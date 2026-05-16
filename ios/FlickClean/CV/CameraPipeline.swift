import AVFoundation
import CoreImage
import CoreImage.CIFilterBuiltins
import SwiftUI
import UIKit

struct VideoFrameSummary: Equatable {
  var timestamp: TimeInterval
  var luminance: Double
  var dimensions: CGSize
}

enum CameraPipelineState: Equatable {
  case idle
  case requestingPermission
  case denied
  case configuring
  case ready
  case running
  case interrupted(String)
  case failed(String)
}

enum CameraAuthorizationStatus: Equatable {
  case unknown
  case authorized
  case denied
  case restricted
}

struct CameraSamplingPolicy: Equatable {
  var targetFramesPerSecond: Double
  var summaryFramesPerSecond: Double

  static let liveCoaching = CameraSamplingPolicy(targetFramesPerSecond: 12, summaryFramesPerSecond: 4)
}

struct CameraFrame: Equatable {
  var sampleBuffer: CMSampleBuffer
  var summary: VideoFrameSummary

  static func == (lhs: CameraFrame, rhs: CameraFrame) -> Bool {
    lhs.summary == rhs.summary
  }
}

struct CameraPipelineDiagnostics: Equatable {
  var framesReceived: Int = 0
  var framesSampled: Int = 0
  var framesDroppedBySampler: Int = 0
  var approximateInputFPS: Double = 0
  var approximateSampledFPS: Double = 0
  var latestDimensions: CGSize = .zero
  var latestLuminance: Double = 0
  var lastFrameTimestamp: TimeInterval = 0
  var isSessionRunning: Bool = false
}

final class CameraPipeline: NSObject, ObservableObject {
  @Published private(set) var state: CameraPipelineState = .idle
  @Published private(set) var authorizationStatus: CameraAuthorizationStatus = .unknown
  @Published private(set) var latestFrame: VideoFrameSummary?
  @Published private(set) var diagnostics = CameraPipelineDiagnostics()

  let session = AVCaptureSession()

  var samplingPolicy: CameraSamplingPolicy = .liveCoaching
  var frameHandler: ((CameraFrame) -> Void)?

  private let sessionQueue = DispatchQueue(label: "com.flick.camera.session")
  private let videoQueue = DispatchQueue(label: "com.flick.camera.video", qos: .userInitiated)
  private let context = CIContext(options: [.workingColorSpace: NSNull()])
  private weak var videoOutput: AVCaptureVideoDataOutput?
  private var isConfigured = false
  private var shouldRestartWhenForegrounded = false
  private var lastSummaryFrameTime: TimeInterval = 0
  private var lastSampledFrameTime: TimeInterval = 0
  private var lastInputFPSTimestamp: TimeInterval = 0
  private var lastSampledFPSTimestamp: TimeInterval = 0
  private var inputFramesInWindow = 0
  private var sampledFramesInWindow = 0

  override init() {
    super.init()
    authorizationStatus = Self.currentAuthorizationStatus()
    observeSessionNotifications()
    observeApplicationLifecycle()
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  func requestPermissions() async -> Bool {
    await MainActor.run {
      state = .requestingPermission
    }

    let currentStatus = AVCaptureDevice.authorizationStatus(for: .video)
    let cameraGranted: Bool

    switch currentStatus {
    case .authorized:
      cameraGranted = true
    case .notDetermined:
      cameraGranted = await AVCaptureDevice.requestAccess(for: .video)
    case .denied, .restricted:
      cameraGranted = false
    @unknown default:
      cameraGranted = false
    }

    _ = await AVCaptureDevice.requestAccess(for: .audio)

    await MainActor.run {
      authorizationStatus = Self.currentAuthorizationStatus()
      state = cameraGranted ? .idle : .denied
    }

    return cameraGranted
  }

  func configureIfNeeded() {
    sessionQueue.async { [weak self] in
      guard let self, !self.isConfigured else { return }
      self.configureLocked()
    }
  }

  func start() {
    sessionQueue.async { [weak self] in
      guard let self else { return }

      if !self.isConfigured {
        self.configureLocked()
      }

      guard self.isConfigured, !self.session.isRunning else {
        return
      }

      self.session.startRunning()
      self.updateRunningState(isRunning: true)
      DispatchQueue.main.async {
        self.state = .running
      }
    }
  }

  func stop() {
    sessionQueue.async { [weak self] in
      guard let self else { return }
      if self.session.isRunning {
        self.session.stopRunning()
      }
      self.updateRunningState(isRunning: false)
      DispatchQueue.main.async {
        self.state = self.isConfigured ? .ready : .idle
      }
    }
  }

  private func configureLocked() {
    guard authorizationStatus == .authorized || AVCaptureDevice.authorizationStatus(for: .video) == .authorized else {
      DispatchQueue.main.async {
        self.authorizationStatus = Self.currentAuthorizationStatus()
        self.state = .denied
      }
      return
    }

    DispatchQueue.main.async {
      self.state = .configuring
    }

    session.beginConfiguration()
    session.sessionPreset = .high

    defer {
      session.commitConfiguration()
    }

    guard
      let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back)
    else {
      DispatchQueue.main.async {
        self.state = .failed("Back camera is unavailable.")
      }
      return
    }

    do {
      try configureDevice(device)

      let input = try AVCaptureDeviceInput(device: device)
      if session.canAddInput(input) {
        session.addInput(input)
      }

      let output = AVCaptureVideoDataOutput()
      output.alwaysDiscardsLateVideoFrames = true
      output.videoSettings = [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
      ]
      output.setSampleBufferDelegate(self, queue: videoQueue)

      if session.canAddOutput(output) {
        session.addOutput(output)
      }

      if let connection = output.connection(with: .video), connection.isVideoRotationAngleSupported(90) {
        connection.videoRotationAngle = 90
      }

      videoOutput = output
      isConfigured = true
      DispatchQueue.main.async {
        self.state = .ready
      }
    } catch {
      DispatchQueue.main.async {
        self.state = .failed(error.localizedDescription)
      }
    }
  }

  private func configureDevice(_ device: AVCaptureDevice) throws {
    try device.lockForConfiguration()
    defer { device.unlockForConfiguration() }

    if device.isFocusModeSupported(.continuousAutoFocus) {
      device.focusMode = .continuousAutoFocus
    }

    if device.isExposureModeSupported(.continuousAutoExposure) {
      device.exposureMode = .continuousAutoExposure
    }

    let duration = CMTime(value: 1, timescale: 30)
    device.activeVideoMinFrameDuration = duration
    device.activeVideoMaxFrameDuration = duration
  }

  private func handleFrame(sampleBuffer: CMSampleBuffer) {
    let timestamp = CMSampleBufferGetPresentationTimeStamp(sampleBuffer).seconds
    updateInputCounters(timestamp: timestamp)

    let sampleInterval = 1 / max(1, samplingPolicy.targetFramesPerSecond)
    guard timestamp - lastSampledFrameTime >= sampleInterval else {
      updateDroppedSample()
      return
    }
    lastSampledFrameTime = timestamp
    updateSampledCounters(timestamp: timestamp)

    let summary = summarize(sampleBuffer: sampleBuffer, timestamp: timestamp)
    frameHandler?(CameraFrame(sampleBuffer: sampleBuffer, summary: summary))

    let summaryInterval = 1 / max(1, samplingPolicy.summaryFramesPerSecond)
    guard timestamp - lastSummaryFrameTime >= summaryInterval else { return }
    lastSummaryFrameTime = timestamp
    DispatchQueue.main.async {
      self.latestFrame = summary
      self.diagnostics.latestDimensions = summary.dimensions
      self.diagnostics.latestLuminance = summary.luminance
      self.diagnostics.lastFrameTimestamp = summary.timestamp
    }
  }

  private func summarize(sampleBuffer: CMSampleBuffer, timestamp: TimeInterval) -> VideoFrameSummary {
    let dimensions = frameDimensions(sampleBuffer: sampleBuffer)
    let luminance = estimateLuminance(sampleBuffer: sampleBuffer)
    return VideoFrameSummary(timestamp: timestamp, luminance: luminance, dimensions: dimensions)
  }

  private func frameDimensions(sampleBuffer: CMSampleBuffer) -> CGSize {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
      return .zero
    }
    return CGSize(
      width: CVPixelBufferGetWidth(pixelBuffer),
      height: CVPixelBufferGetHeight(pixelBuffer)
    )
  }

  private func estimateLuminance(sampleBuffer: CMSampleBuffer) -> Double {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
      return 0
    }

    let image = CIImage(cvPixelBuffer: pixelBuffer)
    let extent = image.extent
    let filter = CIFilter.areaAverage()
    filter.inputImage = image
    filter.extent = extent

    guard let output = filter.outputImage else {
      return 0
    }

    var bitmap = [UInt8](repeating: 0, count: 4)
    context.render(
      output,
      toBitmap: &bitmap,
      rowBytes: 4,
      bounds: CGRect(x: 0, y: 0, width: 1, height: 1),
      format: .RGBA8,
      colorSpace: nil
    )

    let red = Double(bitmap[0]) / 255.0
    let green = Double(bitmap[1]) / 255.0
    let blue = Double(bitmap[2]) / 255.0
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue
  }

  private func updateInputCounters(timestamp: TimeInterval) {
    inputFramesInWindow += 1
    DispatchQueue.main.async {
      self.diagnostics.framesReceived += 1
    }

    guard lastInputFPSTimestamp > 0 else {
      lastInputFPSTimestamp = timestamp
      return
    }

    let elapsed = timestamp - lastInputFPSTimestamp
    guard elapsed >= 1 else { return }
    let fps = Double(inputFramesInWindow) / elapsed
    inputFramesInWindow = 0
    lastInputFPSTimestamp = timestamp
    DispatchQueue.main.async {
      self.diagnostics.approximateInputFPS = fps
    }
  }

  private func updateSampledCounters(timestamp: TimeInterval) {
    sampledFramesInWindow += 1
    DispatchQueue.main.async {
      self.diagnostics.framesSampled += 1
    }

    guard lastSampledFPSTimestamp > 0 else {
      lastSampledFPSTimestamp = timestamp
      return
    }

    let elapsed = timestamp - lastSampledFPSTimestamp
    guard elapsed >= 1 else { return }
    let fps = Double(sampledFramesInWindow) / elapsed
    sampledFramesInWindow = 0
    lastSampledFPSTimestamp = timestamp
    DispatchQueue.main.async {
      self.diagnostics.approximateSampledFPS = fps
    }
  }

  private func updateDroppedSample() {
    DispatchQueue.main.async {
      self.diagnostics.framesDroppedBySampler += 1
    }
  }

  private func updateRunningState(isRunning: Bool) {
    DispatchQueue.main.async {
      self.diagnostics.isSessionRunning = isRunning
    }
  }

  private func observeSessionNotifications() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(sessionWasInterrupted(_:)),
      name: AVCaptureSession.wasInterruptedNotification,
      object: session
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(sessionInterruptionEnded(_:)),
      name: AVCaptureSession.interruptionEndedNotification,
      object: session
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(sessionRuntimeError(_:)),
      name: AVCaptureSession.runtimeErrorNotification,
      object: session
    )
  }

  private func observeApplicationLifecycle() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(applicationDidEnterBackground),
      name: UIApplication.didEnterBackgroundNotification,
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(applicationWillEnterForeground),
      name: UIApplication.willEnterForegroundNotification,
      object: nil
    )
  }

  @objc private func sessionWasInterrupted(_ notification: Notification) {
    let reason = notification.userInfo?[AVCaptureSessionInterruptionReasonKey] as? Int
    DispatchQueue.main.async {
      self.state = .interrupted(reason.map { "Camera interrupted: \($0)" } ?? "Camera interrupted.")
    }
  }

  @objc private func sessionInterruptionEnded(_ notification: Notification) {
    DispatchQueue.main.async {
      self.state = self.session.isRunning ? .running : .ready
    }
  }

  @objc private func sessionRuntimeError(_ notification: Notification) {
    let error = notification.userInfo?[AVCaptureSessionErrorKey] as? AVError
    DispatchQueue.main.async {
      self.state = .failed(error?.localizedDescription ?? "Camera runtime error.")
    }
  }

  @objc private func applicationDidEnterBackground() {
    sessionQueue.async { [weak self] in
      guard let self else { return }
      self.shouldRestartWhenForegrounded = self.session.isRunning
      if self.session.isRunning {
        self.session.stopRunning()
        self.updateRunningState(isRunning: false)
      }
    }
  }

  @objc private func applicationWillEnterForeground() {
    sessionQueue.async { [weak self] in
      guard let self, self.shouldRestartWhenForegrounded else { return }
      self.shouldRestartWhenForegrounded = false
      if self.isConfigured, !self.session.isRunning {
        self.session.startRunning()
        self.updateRunningState(isRunning: true)
        DispatchQueue.main.async {
          self.state = .running
        }
      }
    }
  }

  private static func currentAuthorizationStatus() -> CameraAuthorizationStatus {
    switch AVCaptureDevice.authorizationStatus(for: .video) {
    case .authorized:
      .authorized
    case .denied:
      .denied
    case .restricted:
      .restricted
    case .notDetermined:
      .unknown
    @unknown default:
      .unknown
    }
  }
}

extension CameraPipeline: AVCaptureVideoDataOutputSampleBufferDelegate {
  func captureOutput(
    _ output: AVCaptureOutput,
    didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    handleFrame(sampleBuffer: sampleBuffer)
  }
}

struct CameraPreview: UIViewRepresentable {
  let session: AVCaptureSession

  func makeUIView(context: Context) -> PreviewView {
    let view = PreviewView()
    view.videoPreviewLayer.session = session
    view.videoPreviewLayer.videoGravity = .resizeAspectFill
    return view
  }

  func updateUIView(_ uiView: PreviewView, context: Context) {
    uiView.videoPreviewLayer.session = session
  }
}

final class PreviewView: UIView {
  override static var layerClass: AnyClass {
    AVCaptureVideoPreviewLayer.self
  }

  var videoPreviewLayer: AVCaptureVideoPreviewLayer {
    layer as! AVCaptureVideoPreviewLayer
  }
}
