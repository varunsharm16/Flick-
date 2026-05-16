import SwiftUI

struct ProgressDashboardView: View {
  @State private var selectedRange = "7D"
  private let ranges = ["7D", "30D", "90D", "All"]
  private let stats = ProgressStat.samples

  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(alignment: .leading, spacing: 22) {
          VStack(alignment: .leading, spacing: 8) {
            Text("Your Shooting Progress")
              .font(.system(size: 32, weight: .bold, design: .rounded))
              .foregroundStyle(Color.flickCream)
            Text("Native dashboard placeholder backed by shot/session models.")
              .foregroundStyle(.white.opacity(0.68))
          }

          Picker("Range", selection: $selectedRange) {
            ForEach(ranges, id: \.self) { range in
              Text(range).tag(range)
            }
          }
          .pickerStyle(.segmented)
          .flickSurface(cornerRadius: 12, tint: Color.white.opacity(0.04), interactive: true)

          AccuracyCard(range: selectedRange)

          LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 14) {
            ForEach(stats) { stat in
              StatCard(stat: stat)
            }
          }
        }
        .padding(20)
        .padding(.bottom, 24)
      }
      .background(Color.black.ignoresSafeArea())
      .navigationTitle("Progress")
      .navigationBarTitleDisplayMode(.inline)
    }
  }
}

private struct AccuracyCard: View {
  let range: String
  private let bars: [Double] = [0.42, 0.55, 0.62, 0.58, 0.72, 0.76, 0.70]

  var body: some View {
    VStack(alignment: .leading, spacing: 18) {
      HStack {
        VStack(alignment: .leading, spacing: 4) {
          Text("Accuracy trend")
            .font(.headline)
          Text("\(range) view")
            .foregroundStyle(.white.opacity(0.58))
        }
        Spacer()
        Text("Pending")
          .font(.headline.bold())
          .padding(.horizontal, 14)
          .padding(.vertical, 8)
          .foregroundStyle(.black)
          .background(Color.flickOrange, in: Capsule())
      }

      HStack(alignment: .bottom, spacing: 10) {
        ForEach(Array(bars.enumerated()), id: \.offset) { index, value in
          RoundedRectangle(cornerRadius: 8, style: .continuous)
            .fill(index == bars.count - 1 ? Color.flickOrange : Color.white.opacity(0.22))
            .frame(height: 150 * value)
            .frame(maxWidth: .infinity)
        }
      }
      .frame(height: 160)
    }
    .foregroundStyle(Color.flickCream)
    .padding(20)
    .background(LinearGradient(colors: [Color.flickBrown.opacity(0.55), Color.black.opacity(0.32)], startPoint: .topLeading, endPoint: .bottomTrailing))
    .flickSurface(cornerRadius: 18, tint: Color.flickOrange.opacity(0.10))
  }
}

private struct StatCard: View {
  let stat: ProgressStat

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      Image(systemName: stat.symbol)
        .font(.title2)
        .foregroundStyle(Color.flickOrange)

      Text(stat.title)
        .font(.subheadline.weight(.semibold))
        .foregroundStyle(.white.opacity(0.72))

      Text(stat.value)
        .font(.title.bold())
        .foregroundStyle(Color.flickCream)

      Text(stat.change)
        .font(.caption.weight(.bold))
        .foregroundStyle(stat.positive ? Color.green : Color.flickOrange)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .padding(16)
    .flickSurface(cornerRadius: 16, tint: Color.white.opacity(0.05), interactive: true)
  }
}

private struct ProgressStat: Identifiable {
  let id = UUID()
  let title: String
  let value: String
  let change: String
  let symbol: String
  let positive: Bool

  static let samples = [
    ProgressStat(title: "Shooting Accuracy", value: "--", change: "Awaiting model", symbol: "target", positive: true),
    ProgressStat(title: "Form Consistency", value: "--", change: "Pose ready", symbol: "figure.core.training", positive: true),
    ProgressStat(title: "Shots Taken", value: "0", change: "No raw video stored", symbol: "basketball", positive: true),
    ProgressStat(title: "Release Time", value: "--", change: "From shot state", symbol: "timer", positive: true),
    ProgressStat(title: "Follow Through", value: "--", change: "Rule-ready", symbol: "hand.raised", positive: true),
    ProgressStat(title: "Arc Angle", value: "--", change: "Needs ball model", symbol: "arcade.stick", positive: true)
  ]
}

#Preview {
  ProgressDashboardView()
}
