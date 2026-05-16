import CoreGraphics
import Foundation

typealias FlickID = UUID

struct UserProfile: Codable, Identifiable, Equatable {
  enum DominantHand: String, Codable, CaseIterable {
    case left
    case right
  }

  enum PlayingLevel: String, Codable, CaseIterable {
    case recreational
    case amateurLeague
    case college
    case professional
  }

  var id: FlickID
  var displayName: String
  var heightCentimeters: Double
  var wingspanCentimeters: Double?
  var dominantHand: DominantHand
  var playingLevel: PlayingLevel
  var targetPlayerID: String?
}

enum CourtZone: String, Codable, CaseIterable, Identifiable {
  case freeThrow
  case paint
  case midRangeElbowLeft
  case midRangeElbowRight
  case midRangeBaselineLeft
  case midRangeBaselineRight
  case leftWingThree
  case rightWingThree
  case leftCornerThree
  case rightCornerThree
  case topOfKeyThree
  case unknown

  var id: String { rawValue }

  var displayName: String {
    switch self {
    case .freeThrow: "Free throw"
    case .paint: "Paint"
    case .midRangeElbowLeft: "Left elbow"
    case .midRangeElbowRight: "Right elbow"
    case .midRangeBaselineLeft: "Left baseline"
    case .midRangeBaselineRight: "Right baseline"
    case .leftWingThree: "Left wing 3"
    case .rightWingThree: "Right wing 3"
    case .leftCornerThree: "Left corner 3"
    case .rightCornerThree: "Right corner 3"
    case .topOfKeyThree: "Top of key 3"
    case .unknown: "Unknown zone"
    }
  }
}

enum ShotType: String, Codable, CaseIterable {
  case catchAndShoot
  case pullUp
  case offDribble
  case freeThrow
}

enum DrillTargetType: String, Codable {
  case attempts
  case makes
}

enum DrillDifficulty: String, Codable, CaseIterable {
  case beginner
  case intermediate
  case advanced
}

struct Drill: Codable, Identifiable, Equatable {
  var id: String
  var name: String
  var description: String
  var zone: CourtZone
  var shotType: ShotType
  var targetType: DrillTargetType
  var targetCount: Int
  var weaknessTags: [String]
  var difficulty: DrillDifficulty
  var coachingFocus: String
}

struct Session: Codable, Identifiable {
  enum Status: String, Codable {
    case planned
    case calibrating
    case running
    case paused
    case completed
    case endedEarly
  }

  var id: FlickID
  var userID: FlickID
  var startedAt: Date
  var endedAt: Date?
  var status: Status
  var drills: [Drill]
  var shots: [Shot]
}

struct Shot: Codable, Identifiable {
  var id: FlickID
  var drillID: String
  var capturedAt: Date
  var features: ShotFeatures
  var fingerprint: ShotFingerprint
  var outcome: ShotOutcome
  var zone: CourtZone
}

enum ShotOutcome: String, Codable, CaseIterable {
  case make
  case miss
  case undetected
  case detectorUnavailable
}

struct ShotFeatures: Codable, Equatable {
  var elbowAngleAtRelease: Double?
  var wristAngleAtRelease: Double?
  var kneeBendDepthAtGather: Double?
  var releaseHeightRatio: Double?
  var arcAngle: Double?
  var releaseTimingMilliseconds: Double?
  var followThroughHoldFrames: Int?
  var ballPositionAtGather: String?
  var shotZone: CourtZone
}

struct ShotFingerprint: Codable, Equatable {
  var elbowAngle: Double?
  var wristAngle: Double?
  var releaseHeightRatio: Double?
  var arcAngle: Double?

  init(features: ShotFeatures) {
    elbowAngle = features.elbowAngleAtRelease
    wristAngle = features.wristAngleAtRelease
    releaseHeightRatio = features.releaseHeightRatio
    arcAngle = features.arcAngle
  }
}

enum CueSource: String, Codable {
  case ruleEngine
  case cloudAnalysis
  case voiceQuestion
  case system
}

struct CoachingCue: Codable, Identifiable, Equatable {
  var id: FlickID = UUID()
  var text: String
  var source: CueSource
  var priority: Int
  var createdAt: Date = Date()
}

struct PoseLandmark: Codable, Equatable, Identifiable {
  var id: String { joint.rawValue }
  var joint: PoseJoint
  var x: Double
  var y: Double
  var confidence: Double
}

enum PoseJoint: String, Codable, CaseIterable {
  case nose
  case neck
  case rightShoulder
  case rightElbow
  case rightWrist
  case leftShoulder
  case leftElbow
  case leftWrist
  case rightHip
  case rightKnee
  case rightAnkle
  case leftHip
  case leftKnee
  case leftAnkle
  case root
}

enum PoseQuality: String, Codable, Equatable {
  case noPose
  case poor
  case partial
  case good
  case excellent
}

struct PoseVisibilityReport: Codable, Equatable {
  var overallScore: Double
  var upperBodyScore: Double
  var lowerBodyScore: Double
  var shootingArmScore: Double
  var fullBodyScore: Double
  var visibleJointCount: Int
  var missingRequiredJoints: [PoseJoint]
  var quality: PoseQuality
}

struct PoseFrame: Codable, Equatable {
  var timestamp: TimeInterval
  var landmarks: [PoseLandmark]
  var visibilityScore: Double
  var bounds: CGRect
  var visibility: PoseVisibilityReport

  init(
    timestamp: TimeInterval,
    landmarks: [PoseLandmark],
    visibilityScore: Double? = nil,
    bounds: CGRect? = nil,
    visibility: PoseVisibilityReport? = nil
  ) {
    let report = visibility ?? PoseVisibilityScorer.score(landmarks: landmarks, dominantHand: .right)
    self.timestamp = timestamp
    self.landmarks = landmarks
    self.visibilityScore = visibilityScore ?? report.overallScore
    self.bounds = bounds ?? PoseGeometry.boundingBox(for: landmarks)
    self.visibility = report
  }
}

enum DetectedObjectKind: String, Codable, CaseIterable {
  case ball
  case rim
}

struct DetectedObject: Codable, Identifiable, Equatable {
  var id: FlickID = UUID()
  var kind: DetectedObjectKind
  var boundingBox: CGRect
  var confidence: Double
}

enum DetectorAvailability: String, Codable, Equatable {
  case unavailableNoModel
  case ready
  case failed
}

struct BallRimDetections: Codable, Equatable {
  var timestamp: TimeInterval
  var objects: [DetectedObject]
  var availability: DetectorAvailability
}

enum CalibrationPoint: String, Codable, CaseIterable, Identifiable {
  case freeThrowCenter
  case leftCornerThree
  case rightCornerThree
  case underBasket

  var id: String { rawValue }

  var prompt: String {
    switch self {
    case .freeThrowCenter: "Stand at the free throw line center"
    case .leftCornerThree: "Stand on the left corner three"
    case .rightCornerThree: "Stand on the right corner three"
    case .underBasket: "Stand under the basket"
    }
  }
}

struct HomographyMatrix: Codable, Equatable {
  var values: [Double]

  static let identity = HomographyMatrix(values: [
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
  ])
}

struct CourtCalibration: Codable, Equatable {
  enum Status: String, Codable {
    case notStarted
    case precheckFailed
    case collectingPoints
    case validated
    case failed
  }

  var status: Status
  var capturedPoints: [CalibrationPoint: CGPoint]
  var homography: HomographyMatrix?
  var warning: String?
}
