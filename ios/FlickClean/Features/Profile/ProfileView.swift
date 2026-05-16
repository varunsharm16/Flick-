import SwiftUI

struct ProfileView: View {
  @State private var displayName = "Varun"
  @State private var heightCentimeters = "183"
  @State private var wingspanCentimeters = "188"
  @State private var notificationsEnabled = true
  @State private var targetPlayer = "No preference"

  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(spacing: 18) {
          profileHeader

          HStack(spacing: 12) {
            MiniStat(title: "Sessions", value: "0")
            MiniStat(title: "Shots", value: "0")
            MiniStat(title: "Tier", value: "Full")
          }

          SettingsSection(title: "Player profile") {
            TextField("Display name", text: $displayName)
              .textFieldStyle(.roundedBorder)
            TextField("Height (cm)", text: $heightCentimeters)
              .keyboardType(.decimalPad)
              .textFieldStyle(.roundedBorder)
            TextField("Wingspan (cm)", text: $wingspanCentimeters)
              .keyboardType(.decimalPad)
              .textFieldStyle(.roundedBorder)
          }

          SettingsSection(title: "Target player") {
            TextField("Target player", text: $targetPlayer)
              .textFieldStyle(.roundedBorder)
            Text("Player profiles are versioned placeholders until the content extraction session fills real shot profiles.")
              .font(.footnote)
              .foregroundStyle(.white.opacity(0.62))
          }

          SettingsSection(title: "Training reminders") {
            Toggle("Notifications", isOn: $notificationsEnabled)
              .tint(Color.flickOrange)
            Text("All feature gates are disabled for now. Build the complete coach first; pricing comes later.")
              .font(.footnote)
              .foregroundStyle(.white.opacity(0.62))
          }
        }
        .padding(20)
        .padding(.bottom, 24)
      }
      .background(Color.black.ignoresSafeArea())
      .navigationTitle("Profile")
      .navigationBarTitleDisplayMode(.inline)
    }
  }

  private var profileHeader: some View {
    VStack(spacing: 14) {
      Image(systemName: "person.crop.circle.fill")
        .font(.system(size: 84))
        .foregroundStyle(.white.opacity(0.68))

      HStack(spacing: 10) {
        Text(displayName.isEmpty ? "Hooper" : displayName)
          .font(.title.bold())
          .foregroundStyle(Color.flickCream)
        Text("FULL ACCESS")
          .font(.caption.bold())
          .padding(.horizontal, 10)
          .padding(.vertical, 5)
          .background(Color.flickOrange.opacity(0.24), in: Capsule())
          .foregroundStyle(Color.flickOrange)
      }

      Text("Native iOS coaching foundation with camera, pose, calibration, and rule engine seams.")
        .multilineTextAlignment(.center)
        .foregroundStyle(.white.opacity(0.68))
    }
    .padding(22)
    .frame(maxWidth: .infinity)
    .background(LinearGradient(colors: [Color.flickBrown.opacity(0.58), Color.black.opacity(0.28)], startPoint: .topLeading, endPoint: .bottomTrailing))
    .flickSurface(cornerRadius: 20, tint: Color.flickOrange.opacity(0.10))
  }
}

private struct MiniStat: View {
  let title: String
  let value: String

  var body: some View {
    VStack(spacing: 6) {
      Text(title)
        .font(.caption)
        .foregroundStyle(.white.opacity(0.62))
      Text(value)
        .font(.headline.bold())
        .foregroundStyle(Color.flickCream)
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 14)
    .flickSurface(cornerRadius: 14, tint: Color.white.opacity(0.05))
  }
}

private struct SettingsSection<Content: View>: View {
  let title: String
  @ViewBuilder let content: Content

  var body: some View {
    VStack(alignment: .leading, spacing: 12) {
      Text(title)
        .font(.headline)
        .foregroundStyle(Color.flickCream)
      content
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(16)
    .flickSurface(cornerRadius: 16, tint: Color.white.opacity(0.05))
  }
}

#Preview {
  ProfileView()
}
