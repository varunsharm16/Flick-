import CoreGraphics
import Foundation

final class CourtCalibrationManager: ObservableObject {
  @Published private(set) var calibration = CourtCalibration(
    status: .notStarted,
    capturedPoints: [:],
    homography: nil,
    warning: nil
  )
  @Published private(set) var activePoint: CalibrationPoint?

  private var remainingPoints = CalibrationPoint.allCases

  func begin() {
    remainingPoints = CalibrationPoint.allCases
    activePoint = remainingPoints.first
    calibration = CourtCalibration(
      status: .collectingPoints,
      capturedPoints: [:],
      homography: nil,
      warning: nil
    )
  }

  func evaluatePrecheck(poseFrame: PoseFrame?, detections: BallRimDetections?, luminance: Double?) -> Bool {
    if let luminance, luminance < 0.18 {
      calibration.warning = "Lighting is too low. Move the phone or turn on gym lights."
      calibration.status = .precheckFailed
      return false
    }

    if let poseFrame, poseFrame.visibility.quality == .poor || poseFrame.visibility.upperBodyScore < 0.45 {
      calibration.warning = "I need to see more of your body before calibration."
      calibration.status = .precheckFailed
      return false
    }

    if detections?.availability == .unavailableNoModel {
      calibration.warning = "Ball/rim model is not installed yet. Calibration can collect pose points, but rim validation is pending."
      calibration.status = .collectingPoints
      return true
    }

    if let detections, !detections.objects.contains(where: { $0.kind == .rim }) {
      calibration.warning = "I need the rim in frame before the session can start."
      calibration.status = .precheckFailed
      return false
    }

    calibration.warning = nil
    calibration.status = .collectingPoints
    return true
  }

  func captureActivePoint(from poseFrame: PoseFrame?) {
    guard let activePoint else { return }

    let point = poseFrame.flatMap { frame in
      PoseGeometry.hipCenter(frame: frame)
        ?? PoseGeometry.landmark(.root, in: frame).map { CGPoint(x: $0.x, y: $0.y) }
    } ?? CGPoint(x: 0.5, y: 0.5)

    calibration.capturedPoints[activePoint] = point
    remainingPoints.removeAll { $0 == activePoint }
    self.activePoint = remainingPoints.first

    if remainingPoints.isEmpty {
      validate()
    }
  }

  func fail(_ warning: String) {
    calibration.warning = warning
    calibration.status = .failed
  }

  func reset() {
    activePoint = nil
    calibration = CourtCalibration(
      status: .notStarted,
      capturedPoints: [:],
      homography: nil,
      warning: nil
    )
  }

  private func validate() {
    guard calibration.capturedPoints.count == CalibrationPoint.allCases.count else {
      calibration.status = .failed
      calibration.warning = "Calibration is missing court points."
      return
    }

    // Placeholder until real court geometry and model-backed rim validation are available.
    calibration.homography = .identity
    calibration.status = .validated
    calibration.warning = "Calibration points captured. Homography is using the native placeholder until court geometry tuning is complete."
  }
}
