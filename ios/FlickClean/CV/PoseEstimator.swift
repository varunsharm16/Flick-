import CoreGraphics
import CoreMedia
import Vision

struct PoseEstimatorConfiguration {
  var orientation: CGImagePropertyOrientation = .right
  var minimumJointConfidence: Double = 0.08
  var dominantHand: UserProfile.DominantHand = .right
  var coordinateTransform: PoseCoordinateTransform = .rotateCounterClockwise
}

enum PoseCoordinateTransform {
  case identity
  case rotateCounterClockwise

  func apply(x: Double, y: Double) -> (x: Double, y: Double) {
    switch self {
    case .identity:
      return (x, y)
    case .rotateCounterClockwise:
      return (y, 1 - x)
    }
  }
}

final class PoseEstimator {
  private let request = VNDetectHumanBodyPoseRequest()
  private let configuration: PoseEstimatorConfiguration

  init(configuration: PoseEstimatorConfiguration = PoseEstimatorConfiguration()) {
    self.configuration = configuration
    request.revision = VNDetectHumanBodyPoseRequest.currentRevision
  }

  func estimatePose(in sampleBuffer: CMSampleBuffer) throws -> PoseFrame? {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
      return nil
    }

    let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: configuration.orientation)
    try handler.perform([request])

    guard let observation = request.results?.first else {
      return nil
    }

    let points = try observation.recognizedPoints(.all)
    let landmarks = Self.map(
      points: points,
      minimumConfidence: configuration.minimumJointConfidence,
      transform: configuration.coordinateTransform
    )
    guard !landmarks.isEmpty else { return nil }

    let visibility = PoseVisibilityScorer.score(
      landmarks: landmarks,
      dominantHand: configuration.dominantHand
    )

    return PoseFrame(
      timestamp: CMSampleBufferGetPresentationTimeStamp(sampleBuffer).seconds,
      landmarks: landmarks,
      visibilityScore: visibility.overallScore,
      bounds: PoseGeometry.boundingBox(for: landmarks),
      visibility: visibility
    )
  }

  private static func map(
    points: [VNHumanBodyPoseObservation.JointName: VNRecognizedPoint],
    minimumConfidence: Double,
    transform: PoseCoordinateTransform
  ) -> [PoseLandmark] {
    let mapping: [(VNHumanBodyPoseObservation.JointName, PoseJoint)] = [
      (.nose, .nose),
      (.neck, .neck),
      (.rightShoulder, .rightShoulder),
      (.rightElbow, .rightElbow),
      (.rightWrist, .rightWrist),
      (.leftShoulder, .leftShoulder),
      (.leftElbow, .leftElbow),
      (.leftWrist, .leftWrist),
      (.rightHip, .rightHip),
      (.rightKnee, .rightKnee),
      (.rightAnkle, .rightAnkle),
      (.leftHip, .leftHip),
      (.leftKnee, .leftKnee),
      (.leftAnkle, .leftAnkle),
      (.root, .root)
    ]

    return mapping.compactMap { visionJoint, flickJoint in
      guard
        let point = points[visionJoint],
        Double(point.confidence) >= minimumConfidence
      else {
        return nil
      }

      let normalizedX = max(0, min(1, Double(point.location.x)))
      let normalizedY = max(0, min(1, Double(1 - point.location.y)))
      let transformed = transform.apply(x: normalizedX, y: normalizedY)

      return PoseLandmark(
        joint: flickJoint,
        x: max(0, min(1, transformed.x)),
        y: max(0, min(1, transformed.y)),
        confidence: Double(point.confidence)
      )
    }
  }
}

enum PoseVisibilityScorer {
  private static let confidenceThreshold = 0.35

  static func score(
    landmarks: [PoseLandmark],
    dominantHand: UserProfile.DominantHand
  ) -> PoseVisibilityReport {
    let visible = Set(landmarks.filter { $0.confidence >= confidenceThreshold }.map(\.joint))
    let shootingArm = PoseGeometry.shootingArmJoints(dominantHand: dominantHand)
    let required = Set([PoseJoint.neck, .root] + shootingArm)
    let missingRequired = required.filter { !visible.contains($0) }.sorted { $0.rawValue < $1.rawValue }

    let upperBodyJoints: [PoseJoint] = [
      .neck,
      .leftShoulder,
      .leftElbow,
      .leftWrist,
      .rightShoulder,
      .rightElbow,
      .rightWrist
    ]
    let lowerBodyJoints: [PoseJoint] = [
      .root,
      .leftHip,
      .leftKnee,
      .leftAnkle,
      .rightHip,
      .rightKnee,
      .rightAnkle
    ]

    let upper = fractionVisible(upperBodyJoints, visible: visible)
    let lower = fractionVisible(lowerBodyJoints, visible: visible)
    let arm = fractionVisible(shootingArm, visible: visible)
    let fullBody = fractionVisible(PoseJoint.allCases, visible: visible)
    let overall = min(1, max(0, (upper * 0.35) + (lower * 0.20) + (arm * 0.35) + (fullBody * 0.10)))

    return PoseVisibilityReport(
      overallScore: overall,
      upperBodyScore: upper,
      lowerBodyScore: lower,
      shootingArmScore: arm,
      fullBodyScore: fullBody,
      visibleJointCount: visible.count,
      missingRequiredJoints: missingRequired,
      quality: quality(overall: overall, missingRequiredCount: missingRequired.count)
    )
  }

  private static func fractionVisible(_ joints: [PoseJoint], visible: Set<PoseJoint>) -> Double {
    guard !joints.isEmpty else { return 0 }
    let count = joints.filter { visible.contains($0) }.count
    return Double(count) / Double(joints.count)
  }

  private static func quality(overall: Double, missingRequiredCount: Int) -> PoseQuality {
    if overall <= 0 {
      return .noPose
    }

    if missingRequiredCount >= 3 || overall < 0.35 {
      return .poor
    }

    if missingRequiredCount > 0 || overall < 0.62 {
      return .partial
    }

    if overall < 0.84 {
      return .good
    }

    return .excellent
  }
}

struct PoseFeatureSnapshot: Equatable {
  var elbowAngle: Double?
  var kneeAngle: Double?
  var wristHeightRatio: Double?
  var shoulderTiltDegrees: Double?
  var hipCenter: CGPoint?
  var shoulderCenter: CGPoint?
  var bodyHeight: Double?
  var shootingHand: PoseLandmark?
}

enum PoseGeometry {
  static func landmark(_ joint: PoseJoint, in frame: PoseFrame, minimumConfidence: Double = 0.25) -> PoseLandmark? {
    frame.landmarks.first { $0.joint == joint && $0.confidence >= minimumConfidence }
  }

  static func landmark(_ joint: PoseJoint, in landmarks: [PoseLandmark], minimumConfidence: Double = 0.25) -> PoseLandmark? {
    landmarks.first { $0.joint == joint && $0.confidence >= minimumConfidence }
  }

  static func shootingArmJoints(dominantHand: UserProfile.DominantHand) -> [PoseJoint] {
    dominantHand == .right
      ? [.rightShoulder, .rightElbow, .rightWrist]
      : [.leftShoulder, .leftElbow, .leftWrist]
  }

  static func boundingBox(for landmarks: [PoseLandmark], minimumConfidence: Double = 0.25) -> CGRect {
    let visible = landmarks.filter { $0.confidence >= minimumConfidence }
    guard !visible.isEmpty else { return .zero }

    let minX = visible.map(\.x).min() ?? 0
    let maxX = visible.map(\.x).max() ?? 0
    let minY = visible.map(\.y).min() ?? 0
    let maxY = visible.map(\.y).max() ?? 0

    return CGRect(
      x: minX,
      y: minY,
      width: max(0, maxX - minX),
      height: max(0, maxY - minY)
    )
  }

  static func angle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark) -> Double {
    let ab = CGVector(dx: a.x - b.x, dy: a.y - b.y)
    let cb = CGVector(dx: c.x - b.x, dy: c.y - b.y)
    let dot = ab.dx * cb.dx + ab.dy * cb.dy
    let magnitudes = hypot(ab.dx, ab.dy) * hypot(cb.dx, cb.dy)
    guard magnitudes > 0 else { return 0 }
    let cosine = max(-1, min(1, dot / magnitudes))
    return acos(cosine) * 180 / .pi
  }

  static func distance(_ a: PoseLandmark, _ b: PoseLandmark) -> Double {
    hypot(a.x - b.x, a.y - b.y)
  }

  static func midpoint(_ a: PoseLandmark, _ b: PoseLandmark) -> CGPoint {
    CGPoint(x: (a.x + b.x) / 2, y: (a.y + b.y) / 2)
  }

  static func shoulderCenter(frame: PoseFrame) -> CGPoint? {
    guard
      let left = landmark(.leftShoulder, in: frame),
      let right = landmark(.rightShoulder, in: frame)
    else {
      return nil
    }

    return midpoint(left, right)
  }

  static func hipCenter(frame: PoseFrame) -> CGPoint? {
    guard
      let left = landmark(.leftHip, in: frame),
      let right = landmark(.rightHip, in: frame)
    else {
      return landmark(.root, in: frame).map { CGPoint(x: $0.x, y: $0.y) }
    }

    return midpoint(left, right)
  }

  static func bodyHeight(frame: PoseFrame) -> Double? {
    guard
      let top = landmark(.nose, in: frame) ?? landmark(.neck, in: frame),
      let ankle = landmark(.leftAnkle, in: frame) ?? landmark(.rightAnkle, in: frame)
    else {
      return nil
    }

    return max(0.01, ankle.y - top.y)
  }

  static func elbowAngle(frame: PoseFrame, dominantHand: UserProfile.DominantHand = .right) -> Double? {
    let shoulderJoint: PoseJoint = dominantHand == .right ? .rightShoulder : .leftShoulder
    let elbowJoint: PoseJoint = dominantHand == .right ? .rightElbow : .leftElbow
    let wristJoint: PoseJoint = dominantHand == .right ? .rightWrist : .leftWrist

    guard
      let shoulder = landmark(shoulderJoint, in: frame),
      let elbow = landmark(elbowJoint, in: frame),
      let wrist = landmark(wristJoint, in: frame)
    else {
      return nil
    }

    return angle(a: shoulder, b: elbow, c: wrist)
  }

  static func kneeAngle(frame: PoseFrame, dominantHand: UserProfile.DominantHand = .right) -> Double? {
    let hipJoint: PoseJoint = dominantHand == .right ? .rightHip : .leftHip
    let kneeJoint: PoseJoint = dominantHand == .right ? .rightKnee : .leftKnee
    let ankleJoint: PoseJoint = dominantHand == .right ? .rightAnkle : .leftAnkle

    guard
      let hip = landmark(hipJoint, in: frame),
      let knee = landmark(kneeJoint, in: frame),
      let ankle = landmark(ankleJoint, in: frame)
    else {
      return nil
    }

    return angle(a: hip, b: knee, c: ankle)
  }

  static func shoulderTiltDegrees(frame: PoseFrame) -> Double? {
    guard
      let left = landmark(.leftShoulder, in: frame),
      let right = landmark(.rightShoulder, in: frame)
    else {
      return nil
    }

    return atan2(right.y - left.y, right.x - left.x) * 180 / .pi
  }

  static func releaseHeightRatio(frame: PoseFrame, dominantHand: UserProfile.DominantHand = .right) -> Double? {
    let wristJoint: PoseJoint = dominantHand == .right ? .rightWrist : .leftWrist
    guard
      let wrist = landmark(wristJoint, in: frame),
      let bodyHeight = bodyHeight(frame: frame),
      let ankle = landmark(.leftAnkle, in: frame) ?? landmark(.rightAnkle, in: frame)
    else {
      return nil
    }

    return max(0, min(1.5, (ankle.y - wrist.y) / bodyHeight))
  }

  static func featureSnapshot(frame: PoseFrame, dominantHand: UserProfile.DominantHand = .right) -> PoseFeatureSnapshot {
    let wristJoint: PoseJoint = dominantHand == .right ? .rightWrist : .leftWrist
    return PoseFeatureSnapshot(
      elbowAngle: elbowAngle(frame: frame, dominantHand: dominantHand),
      kneeAngle: kneeAngle(frame: frame, dominantHand: dominantHand),
      wristHeightRatio: releaseHeightRatio(frame: frame, dominantHand: dominantHand),
      shoulderTiltDegrees: shoulderTiltDegrees(frame: frame),
      hipCenter: hipCenter(frame: frame),
      shoulderCenter: shoulderCenter(frame: frame),
      bodyHeight: bodyHeight(frame: frame),
      shootingHand: landmark(wristJoint, in: frame)
    )
  }
}
