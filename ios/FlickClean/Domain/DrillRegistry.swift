import Foundation

enum DrillRegistry {
  static let introductoryPlan: [Drill] = [
    Drill(
      id: "intro-free-throw-form",
      name: "Free Throw Form Check",
      description: "Set a repeatable base at the line before moving out.",
      zone: .freeThrow,
      shotType: .freeThrow,
      targetType: .attempts,
      targetCount: 10,
      weaknessTags: ["release", "follow_through", "balance"],
      difficulty: .beginner,
      coachingFocus: "Release height and follow-through hold"
    ),
    Drill(
      id: "intro-left-elbow",
      name: "Left Elbow Rhythm",
      description: "Build rhythm from mid-range with a stable gather.",
      zone: .midRangeElbowLeft,
      shotType: .catchAndShoot,
      targetType: .attempts,
      targetCount: 12,
      weaknessTags: ["gather", "arc", "timing"],
      difficulty: .beginner,
      coachingFocus: "Knee load and release timing"
    ),
    Drill(
      id: "intro-top-key-three",
      name: "Top Key Arc Check",
      description: "Stretch range while keeping the shot path high.",
      zone: .topOfKeyThree,
      shotType: .catchAndShoot,
      targetType: .attempts,
      targetCount: 10,
      weaknessTags: ["arc", "release_height"],
      difficulty: .intermediate,
      coachingFocus: "Arc angle and release height"
    )
  ]
}
