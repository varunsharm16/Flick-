import AVFoundation
import CoreMedia
import Foundation
import QuartzCore

enum LiveSessionPhase: Equatable {
  case idle
  case calibrating
  case readyToBegin
  case running
  case paused(String)
  case complete
}

final class LiveSessionModel: ObservableObject {
  @Published var phase: LiveSessionPhase = .idle
  @Published var currentDrill: Drill = DrillRegistry.introductoryPlan[0]
  @Published var drillPlan: [Drill] = DrillRegistry.introductoryPlan
  @Published var shotAttempts = 0
  @Published var makes = 0
  @Published var latestPose: PoseFrame?
  @Published var latestDetections = BallRimDetections(timestamp: 0, objects: [], availability: .unavailableNoModel)
  @Published var cues: [CoachingCue] = []
  @Published var visibilityWarning: String?
  @Published var elapsedSeconds: TimeInterval = 0
  @Published var processingDiagnostics = FrameProcessingDiagnostics()
  @Published var showDebugOverlay = true
  @Published var detectionTuning = DetectionTuning.liveDefault

  let camera = CameraPipeline()
  let calibrationManager = CourtCalibrationManager()

  private let poseEstimator = PoseEstimator()
  private let detector: BallRimDetecting
  private let shotMachine: ShotStateMachine
  private let ruleEngine: RuleEngine
  private let speechCoach: SpeechCoach
  private let processingQueue = DispatchQueue(label: "com.flick.live-session.processing", qos: .userInitiated)
  private let processingLock = NSLock()
  private var isProcessingFrame = false
  private var timer: Timer?
  private var startedAt: Date?
  private var shots: [Shot] = []

  init(
    detector: BallRimDetecting? = nil,
    shotMachine: ShotStateMachine = ShotStateMachine(),
    ruleEngine: RuleEngine = RuleEngine(),
    speechCoach: SpeechCoach = SpeechCoach()
  ) {
    self.detector = detector ?? BallRimDetectorFactory.makeBundledDetector()
    self.shotMachine = shotMachine
    self.ruleEngine = ruleEngine
    self.speechCoach = speechCoach
  }

  func prepareCamera() {
    Task {
      let granted = await camera.requestPermissions()
      guard granted else {
        await MainActor.run {
          self.phase = .paused("Camera access is required for live coaching.")
        }
        return
      }

      camera.frameHandler = { [weak self] cameraFrame in
        self?.handle(cameraFrame: cameraFrame)
      }
      camera.start()
    }
  }

  func startCalibration() {
    if case .running = phase {
      return
    }

    phase = .calibrating
    calibrationManager.begin()
    prepareCamera()
  }

  func captureCalibrationPoint() {
    calibrationManager.captureActivePoint(from: latestPose)
    if calibrationManager.calibration.status == .validated {
      phase = .readyToBegin
      surfaceSystemCue("Calibration locked. Review the drill and begin when ready.")
    }
  }

  func beginDrill() {
    guard phase == .readyToBegin || phase == .complete else { return }
    phase = .running
    shotMachine.reset()
    startedAt = Date()
    startTimer()
    surfaceSystemCue("First drill loaded: \(currentDrill.name).")
  }

  func pauseForVisibility(_ message: String) {
    guard phase == .running else { return }
    phase = .paused(message)
    visibilityWarning = message
    surfaceSystemCue(message)
  }

  func resumeAfterRecheck() {
    guard case .paused = phase else { return }
    if calibrationManager.evaluatePrecheck(
      poseFrame: latestPose,
      detections: latestDetections,
      luminance: camera.latestFrame?.luminance
    ) {
      phase = .running
      visibilityWarning = nil
      surfaceSystemCue("Recheck passed. Resume the drill.")
    }
  }

  func forceEndSession() {
    phase = .complete
    stopTimer()
    camera.stop()
    speechCoach.stop()
    surfaceSystemCue("Session ended. Summary generation will run from saved shot features.")
  }

  func toggleDebugOverlay() {
    showDebugOverlay.toggle()
  }

  func simulateShotForDebug() {
    let features = ShotFeatures(
      elbowAngleAtRelease: 138,
      wristAngleAtRelease: nil,
      kneeBendDepthAtGather: 172,
      releaseHeightRatio: 0.68,
      arcAngle: nil,
      releaseTimingMilliseconds: 420,
      followThroughHoldFrames: nil,
      ballPositionAtGather: nil,
      shotZone: currentDrill.zone
    )
    let shot = Shot(
      id: UUID(),
      drillID: currentDrill.id,
      capturedAt: Date(),
      features: features,
      fingerprint: ShotFingerprint(features: features),
      outcome: .detectorUnavailable,
      zone: currentDrill.zone
    )
    handleCompletedShot(shot)
  }

  private func handle(cameraFrame: CameraFrame) {
    processingLock.lock()
    if isProcessingFrame {
      processingLock.unlock()
      DispatchQueue.main.async {
        self.processingDiagnostics.framesSkippedBusy += 1
      }
      return
    }
    isProcessingFrame = true
    processingLock.unlock()

    let started = CACurrentMediaTime()

    processingQueue.async { [weak self] in
      guard let self else { return }
      defer {
        self.processingLock.lock()
        self.isProcessingFrame = false
        self.processingLock.unlock()
      }

      let timestamp = cameraFrame.summary.timestamp
      let pose: PoseFrame?
      let poseError: Error?
      do {
        pose = try self.poseEstimator.estimatePose(in: cameraFrame.sampleBuffer)
        poseError = nil
      } catch {
        pose = nil
        poseError = error
      }

      let tuning = self.detectionTuning
      let detections = (try? self.detector.detect(in: cameraFrame.sampleBuffer, tuning: tuning)) ?? BallRimDetections(
        timestamp: cameraFrame.summary.timestamp,
        objects: [],
        availability: .failed
      )

      let events = self.phase == .running
        ? self.shotMachine.process(
          ShotPipelineInput(
            poseFrame: pose,
            detections: detections,
            timestamp: timestamp,
            zone: self.currentDrill.zone
          ),
          drillID: self.currentDrill.id
        )
        : []

      DispatchQueue.main.async {
        self.latestPose = pose
        self.latestDetections = detections
        self.updateProcessingDiagnostics(
          durationMilliseconds: (CACurrentMediaTime() - started) * 1000,
          poseError: poseError
        )
        self.evaluateVisibility(pose: pose, detections: detections)

        for event in events {
          if case let .shotCompleted(shot) = event {
            self.handleCompletedShot(shot)
          }
        }
      }
    }
  }

  private func evaluateVisibility(pose: PoseFrame?, detections: BallRimDetections) {
    guard phase == .running else { return }

    if let pose, pose.visibility.quality == .poor || pose.visibility.quality == .noPose {
      pauseForVisibility("I've lost enough of your body landmarks. Reposition the phone and tap Recheck.")
      return
    }

    if camera.latestFrame?.luminance ?? 1 < 0.14 {
      pauseForVisibility("Lighting is too low. Move the phone or turn on gym lights, then tap Recheck.")
    }
  }

  private func handleCompletedShot(_ shot: Shot) {
    shots.append(shot)
    shotAttempts += 1
    if shot.outcome == .make {
      makes += 1
    }

    if let cue = ruleEngine.cue(for: shot) {
      surface(cue)
    } else if shot.outcome == .detectorUnavailable {
      surfaceSystemCue("Pose features captured. Ball/rim model is still needed for outcome and arc.")
    }

    if shotAttempts >= currentDrill.targetCount {
      phase = .complete
      stopTimer()
      surfaceSystemCue("Drill complete. Shot features are ready for synthesis.")
    }
  }

  private func surfaceSystemCue(_ text: String) {
    surface(CoachingCue(text: text, source: .system, priority: 5))
  }

  private func surface(_ cue: CoachingCue) {
    cues.append(cue)
    cues = Array(cues.suffix(5))
    speechCoach.speak(cue)
  }

  private func startTimer() {
    stopTimer()
    elapsedSeconds = 0
    timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
      guard let self, let startedAt = self.startedAt else { return }
      self.elapsedSeconds = Date().timeIntervalSince(startedAt)
    }
  }

  private func stopTimer() {
    timer?.invalidate()
    timer = nil
  }

  private func updateProcessingDiagnostics(durationMilliseconds: Double, poseError: Error?) {
    processingDiagnostics.framesProcessed += 1
    processingDiagnostics.lastProcessingMilliseconds = durationMilliseconds
    let processed = Double(processingDiagnostics.framesProcessed)
    let previousAverage = processingDiagnostics.averageProcessingMilliseconds
    processingDiagnostics.averageProcessingMilliseconds = previousAverage + ((durationMilliseconds - previousAverage) / processed)
    processingDiagnostics.lastPoseVisibility = latestPose?.visibilityScore ?? 0
    processingDiagnostics.lastPoseQuality = latestPose?.visibility.quality ?? .noPose
    processingDiagnostics.missingRequiredJoints = latestPose?.visibility.missingRequiredJoints ?? []
    processingDiagnostics.detectorAvailability = latestDetections.availability
    processingDiagnostics.ballDetectionCount = latestDetections.objects.filter { $0.kind == .ball }.count
    processingDiagnostics.rimDetectionCount = latestDetections.objects.filter { $0.kind == .rim }.count
    processingDiagnostics.detectorDetail = detector.modelInfo.detail
    processingDiagnostics.lastError = poseError?.localizedDescription
  }
}

struct FrameProcessingDiagnostics: Equatable {
  var framesProcessed = 0
  var framesSkippedBusy = 0
  var lastProcessingMilliseconds: Double = 0
  var averageProcessingMilliseconds: Double = 0
  var lastPoseVisibility: Double = 0
  var lastPoseQuality: PoseQuality = .noPose
  var missingRequiredJoints: [PoseJoint] = []
  var detectorAvailability: DetectorAvailability = .unavailableNoModel
  var ballDetectionCount = 0
  var rimDetectionCount = 0
  var detectorDetail: String?
  var lastError: String?
}
