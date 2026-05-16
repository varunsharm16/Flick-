import SwiftUI

struct FlickCleanRootView: View {
  @StateObject private var liveSessionModel = LiveSessionModel()
  @StateObject private var coachModel = CoachChatModel()
  @State private var selectedTab: FlickTab = .live

  var body: some View {
    TabView(selection: $selectedTab) {
      LiveSessionView(model: liveSessionModel)
        .tabItem {
          Label("Live", systemImage: "figure.basketball")
        }
        .tag(FlickTab.live)

      ProgressDashboardView()
        .tabItem {
          Label("Progress", systemImage: "chart.line.uptrend.xyaxis")
        }
        .tag(FlickTab.progress)

      CoachChatView(model: coachModel)
        .tabItem {
          Label("Coach", systemImage: "bubble.left.and.bubble.right")
        }
        .tag(FlickTab.coach)

      ProfileView()
        .tabItem {
          Label("Profile", systemImage: "person.crop.circle")
        }
        .tag(FlickTab.profile)
    }
    .tint(Color.flickOrange)
    .preferredColorScheme(.dark)
  }
}

private enum FlickTab {
  case live
  case progress
  case coach
  case profile
}

#Preview {
  FlickCleanRootView()
}
