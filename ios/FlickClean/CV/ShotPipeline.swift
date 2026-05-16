import CoreMedia
import Foundation

enum ShotSegmentationState: String, Codable {
  case idle
  case ready
  case gather
  case release
  case flight
  case outcomePending
}

struct ShotPipelineInput {
  var poseFrame: PoseFrame?
  var detections: BallRimDetections
  var timestamp: TimeInterval
  var zone: CourtZone
}

enum ShotPipelineEvent {
  case stateChanged(ShotSegmentationState)
  case shotCompleted(Shot)
}

final class ShotStateMachine {
  private(set) var state: ShotSegmentationState = .idle
  private var gatherFrame: PoseFrame?
  private var releaseFrame: PoseFrame?
  private var releaseStartedAt: TimeInterval?
  private var lastKneeAngle: Double?
  private var lastElbowAngle: Double?
  private let dominantHand: UserProfile.DominantHand

  init(dominantHand: UserProfile.DominantHand = .right) {
    self.dominantHand = dominantHand
  }

  func reset() {
    state = .idle
    gatherFrame = nil
    releaseFrame = nil
    releaseStartedAt = nil
    lastKneeAngle = nil
    lastElbowAngle = nil
  }

  func process(_ input: ShotPipelineInput, drillID: String) -> [ShotPipelineEvent] {
    guard let poseFrame = input.poseFrame else {
      return []
    }

    let kneeAngle = PoseGeometry.kneeAngle(frame: poseFrame, dominantHand: dominantHand)
    let elbowAngle = PoseGeometry.elbowAngle(frame: poseFrame, dominantHand: dominantHand)
    defer {
      lastKneeAngle = kneeAngle
      lastElbowAngle = elbowAngle
    }

    var events: [ShotPipelineEvent] = []

    switch state {
    case .idle:
      if poseFrame.visibilityScore >= 0.55 {
        state = .ready
        events.append(.stateChanged(state))
      }

    case .ready:
      if let kneeAngle, kneeAngle < 150 {
        gatherFrame = poseFrame
        state = .gather
        events.append(.stateChanged(state))
      }

    case .gather:
      if let elbowAngle, let lastElbowAngle, elbowAngle - lastElbowAngle > 8 {
        releaseFrame = poseFrame
        releaseStartedAt = input.timestamp
        state = .release
        events.append(.stateChanged(state))
      }

    case .release:
      state = .flight
      events.append(.stateChanged(state))

    case .flight:
      if input.detections.availability == .unavailableNoModel {
        let shot = buildShot(
          drillID: drillID,
          zone: input.zone,
          outcome: .detectorUnavailable,
          timestamp: input.timestamp
        )
        reset()
        events.append(.shotCompleted(shot))
      } else if input.detections.objects.contains(where: { $0.kind == .rim }) {
        state = .outcomePending
        events.append(.stateChanged(state))
      }

    case .outcomePending:
      let shot = buildShot(
        drillID: drillID,
        zone: input.zone,
        outcome: inferOutcome(from: input.detections),
        timestamp: input.timestamp
      )
      reset()
      events.append(.shotCompleted(shot))
    }

    return events
  }

  private func buildShot(
    drillID: String,
    zone: CourtZone,
    outcome: ShotOutcome,
    timestamp: TimeInterval
  ) -> Shot {
    let features = ShotFeatureExtractor.extract(
      gatherFrame: gatherFrame,
      releaseFrame: releaseFrame,
      releaseStartedAt: releaseStartedAt,
      completedAt: timestamp,
      zone: zone,
      dominantHand: dominantHand
    )

    return Shot(
      id: UUID(),
      drillID: drillID,
      capturedAt: Date(),
      features: features,
      fingerprint: ShotFingerprint(features: features),
      outcome: outcome,
      zone: zone
    )
  }

  private func inferOutcome(from detections: BallRimDetections) -> ShotOutcome {
    let hasBall = detections.objects.contains { $0.kind == .ball }
    let hasRim = detections.objects.contains { $0.kind == .rim }
    return hasBall && hasRim ? .make : .undetected
  }
}

enum ShotFeatureExtractor {
  static func extract(
    gatherFrame: PoseFrame?,
    releaseFrame: PoseFrame?,
    releaseStartedAt: TimeInterval?,
    completedAt: TimeInterval,
    zone: CourtZone,
    dominantHand: UserProfile.DominantHand
  ) -> ShotFeatures {
    var features = ShotFeatures(
      elbowAngleAtRelease: nil,
      wristAngleAtRelease: nil,
      kneeBendDepthAtGather: nil,
      releaseHeightRatio: nil,
      arcAngle: nil,
      releaseTimingMilliseconds: nil,
      followThroughHoldFrames: nil,
      ballPositionAtGather: nil,
      shotZone: zone
    )

    if let releaseFrame {
      features.elbowAngleAtRelease = PoseGeometry.elbowAngle(frame: releaseFrame, dominantHand: dominantHand)
      features.releaseHeightRatio = PoseGeometry.releaseHeightRatio(frame: releaseFrame, dominantHand: dominantHand)
    }

    if let gatherFrame {
      features.kneeBendDepthAtGather = PoseGeometry.kneeAngle(frame: gatherFrame, dominantHand: dominantHand)
    }

    if let releaseStartedAt {
      features.releaseTimingMilliseconds = max(0, completedAt - releaseStartedAt) * 1000
    }

    return features
  }
}
