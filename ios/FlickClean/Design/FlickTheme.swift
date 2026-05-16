import SwiftUI

extension Color {
  static let flickOrange = Color(red: 1.0, green: 0.57, blue: 0.0)
  static let flickCream = Color(red: 1.0, green: 0.94, blue: 0.76)
  static let flickBrown = Color(red: 0.12, green: 0.05, blue: 0.0)
  static let flickSurface = Color.white.opacity(0.08)
}

struct FlickSurface: ViewModifier {
  var cornerRadius: CGFloat = 16
  var tint: Color = .flickSurface
  var interactive = false

  func body(content: Content) -> some View {
    let shape = RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)

    if #available(iOS 26.0, *) {
      if interactive {
        content.glassEffect(.regular.tint(tint).interactive(), in: .rect(cornerRadius: cornerRadius))
      } else {
        content.glassEffect(.regular.tint(tint), in: .rect(cornerRadius: cornerRadius))
      }
    } else {
      content
        .background(.ultraThinMaterial, in: shape)
        .overlay {
          shape.stroke(Color.white.opacity(0.12), lineWidth: 1)
        }
    }
  }
}

extension View {
  func flickSurface(
    cornerRadius: CGFloat = 16,
    tint: Color = .flickSurface,
    interactive: Bool = false
  ) -> some View {
    modifier(FlickSurface(cornerRadius: cornerRadius, tint: tint, interactive: interactive))
  }
}

struct PrimaryActionButtonStyle: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.headline)
      .frame(maxWidth: .infinity)
      .padding(.vertical, 14)
      .background(Color.flickOrange.opacity(configuration.isPressed ? 0.75 : 1), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
      .foregroundStyle(.black)
  }
}

struct SecondaryActionButtonStyle: ButtonStyle {
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.headline)
      .frame(maxWidth: .infinity)
      .padding(.vertical, 14)
      .flickSurface(cornerRadius: 14, tint: Color.white.opacity(configuration.isPressed ? 0.12 : 0.06), interactive: true)
      .foregroundStyle(Color.flickCream)
  }
}
