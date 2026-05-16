import SwiftUI

struct PoseSkeletonOverlay: View {
  let frame: PoseFrame?

  private let connections: [(PoseJoint, PoseJoint)] = [
    (.leftShoulder, .rightShoulder),
    (.leftShoulder, .leftElbow),
    (.leftElbow, .leftWrist),
    (.rightShoulder, .rightElbow),
    (.rightElbow, .rightWrist),
    (.leftShoulder, .leftHip),
    (.rightShoulder, .rightHip),
    (.leftHip, .rightHip),
    (.leftHip, .leftKnee),
    (.leftKnee, .leftAnkle),
    (.rightHip, .rightKnee),
    (.rightKnee, .rightAnkle)
  ]

  var body: some View {
    GeometryReader { proxy in
      Canvas { context, size in
        guard let frame else { return }

        let landmarks = Dictionary(uniqueKeysWithValues: frame.landmarks.map { ($0.joint, $0) })
        let bounds = rect(frame.bounds, size: size)
        if bounds != .zero {
          context.stroke(
            Path(roundedRect: bounds, cornerRadius: 12),
            with: .color(qualityColor(frame.visibility.quality).opacity(0.52)),
            style: StrokeStyle(lineWidth: 2, dash: [7, 5])
          )
        }

        for (start, end) in connections {
          guard
            let a = landmarks[start],
            let b = landmarks[end],
            a.confidence > 0.25,
            b.confidence > 0.25
          else {
            continue
          }

          var path = Path()
          path.move(to: point(a, size: size))
          path.addLine(to: point(b, size: size))
          context.stroke(path, with: .color(qualityColor(frame.visibility.quality).opacity(0.82)), lineWidth: 4)
        }

        for landmark in frame.landmarks where landmark.confidence > 0.25 {
          let rect = CGRect(
            x: point(landmark, size: size).x - 4,
            y: point(landmark, size: size).y - 4,
            width: 8,
            height: 8
          )
          context.fill(Path(ellipseIn: rect), with: .color(.white.opacity(0.88)))
        }
      }
      .frame(width: proxy.size.width, height: proxy.size.height)
    }
    .allowsHitTesting(false)
  }

  private func point(_ landmark: PoseLandmark, size: CGSize) -> CGPoint {
    CGPoint(x: landmark.x * size.width, y: landmark.y * size.height)
  }

  private func rect(_ normalized: CGRect, size: CGSize) -> CGRect {
    CGRect(
      x: normalized.minX * size.width,
      y: normalized.minY * size.height,
      width: normalized.width * size.width,
      height: normalized.height * size.height
    )
  }

  private func qualityColor(_ quality: PoseQuality) -> Color {
    switch quality {
    case .noPose, .poor:
      .red
    case .partial:
      .yellow
    case .good:
      Color.flickOrange
    case .excellent:
      .green
    }
  }
}
