import Foundation

enum RuleFeature: String, Codable {
  case elbowAngleAtRelease
  case releaseHeightRatio
  case kneeBendDepthAtGather
  case arcAngle
  case followThroughHoldFrames
}

enum RuleComparison: String, Codable {
  case lessThan
  case greaterThan
}

struct CoachingRule: Codable, Identifiable {
  var id: String
  var feature: RuleFeature
  var comparison: RuleComparison
  var threshold: Double
  var zone: CourtZone?
  var requiresMiss: Bool
  var priority: Int
  var cueText: String
}

final class RuleEngine {
  private let rules: [CoachingRule]

  init(rules: [CoachingRule] = RuleEngine.placeholderRules) {
    self.rules = rules
  }

  func cue(for shot: Shot) -> CoachingCue? {
    rules
      .filter { rule in
        if let zone = rule.zone, zone != shot.zone {
          return false
        }

        if rule.requiresMiss, shot.outcome == .make {
          return false
        }

        guard let value = value(for: rule.feature, features: shot.features) else {
          return false
        }

        switch rule.comparison {
        case .lessThan:
          return value < rule.threshold
        case .greaterThan:
          return value > rule.threshold
        }
      }
      .sorted { $0.priority < $1.priority }
      .first
      .map {
        CoachingCue(text: $0.cueText, source: .ruleEngine, priority: $0.priority)
      }
  }

  private func value(for feature: RuleFeature, features: ShotFeatures) -> Double? {
    switch feature {
    case .elbowAngleAtRelease:
      features.elbowAngleAtRelease
    case .releaseHeightRatio:
      features.releaseHeightRatio
    case .kneeBendDepthAtGather:
      features.kneeBendDepthAtGather
    case .arcAngle:
      features.arcAngle
    case .followThroughHoldFrames:
      features.followThroughHoldFrames.map(Double.init)
    }
  }

  static let placeholderRules: [CoachingRule] = [
    CoachingRule(
      id: "release-too-low",
      feature: .releaseHeightRatio,
      comparison: .lessThan,
      threshold: 0.72,
      zone: nil,
      requiresMiss: false,
      priority: 2,
      cueText: "Release a little higher and finish through the rim."
    ),
    CoachingRule(
      id: "elbow-underextended",
      feature: .elbowAngleAtRelease,
      comparison: .lessThan,
      threshold: 145,
      zone: nil,
      requiresMiss: false,
      priority: 3,
      cueText: "Extend the elbow fully before the wrist snap."
    ),
    CoachingRule(
      id: "light-knee-load",
      feature: .kneeBendDepthAtGather,
      comparison: .greaterThan,
      threshold: 168,
      zone: nil,
      requiresMiss: false,
      priority: 4,
      cueText: "Load your knees slightly more before the release."
    )
  ]
}
