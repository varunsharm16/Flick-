import AVFoundation
import CoreMedia
import Foundation

struct FixtureFrameResult {
  var timestamp: TimeInterval
  var pose: PoseFrame?
  var detections: BallRimDetections
}

struct CVFixtureRunSummary: Equatable {
  var frameCount: Int
  var firstTimestamp: TimeInterval?
  var lastTimestamp: TimeInterval?
  var poseFrameCount: Int
  var averagePoseVisibility: Double
  var detectorAvailability: DetectorAvailability
  var ballDetectionCount: Int
  var rimDetectionCount: Int

  static let empty = CVFixtureRunSummary(
    frameCount: 0,
    firstTimestamp: nil,
    lastTimestamp: nil,
    poseFrameCount: 0,
    averagePoseVisibility: 0,
    detectorAvailability: .unavailableNoModel,
    ballDetectionCount: 0,
    rimDetectionCount: 0
  )
}

final class CVFixtureRunner {
  private let poseEstimator: PoseEstimator
  private let detector: BallRimDetecting

  init(poseEstimator: PoseEstimator = PoseEstimator(), detector: BallRimDetecting = UnavailableBallRimDetector()) {
    self.poseEstimator = poseEstimator
    self.detector = detector
  }

  func run(
    url: URL,
    maxFrames: Int = 120,
    tuning: DetectionTuning = .liveDefault
  ) async throws -> [FixtureFrameResult] {
    let asset = AVURLAsset(url: url)
    guard let track = try await asset.loadTracks(withMediaType: .video).first else {
      return []
    }

    let output = AVAssetReaderTrackOutput(track: track, outputSettings: [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA
    ])

    let reader = try AVAssetReader(asset: asset)
    guard reader.canAdd(output) else { return [] }
    reader.add(output)
    reader.startReading()

    var results: [FixtureFrameResult] = []
    while
      results.count < maxFrames,
      let sampleBuffer = output.copyNextSampleBuffer()
    {
      let timestamp = CMSampleBufferGetPresentationTimeStamp(sampleBuffer).seconds
      let pose = try? poseEstimator.estimatePose(in: sampleBuffer)
      let detections = (try? detector.detect(in: sampleBuffer, tuning: tuning)) ?? BallRimDetections(
        timestamp: timestamp,
        objects: [],
        availability: .failed
      )

      results.append(FixtureFrameResult(timestamp: timestamp, pose: pose, detections: detections))
    }

    return results
  }

  func runSummary(
    url: URL,
    maxFrames: Int = 120,
    tuning: DetectionTuning = .liveDefault
  ) async throws -> CVFixtureRunSummary {
    let results = try await run(url: url, maxFrames: maxFrames, tuning: tuning)
    guard !results.isEmpty else {
      return .empty
    }

    let poseFrames = results.compactMap(\.pose)
    let averageVisibility = poseFrames.isEmpty
      ? 0
      : poseFrames.map(\.visibilityScore).reduce(0, +) / Double(poseFrames.count)

    return CVFixtureRunSummary(
      frameCount: results.count,
      firstTimestamp: results.first?.timestamp,
      lastTimestamp: results.last?.timestamp,
      poseFrameCount: poseFrames.count,
      averagePoseVisibility: averageVisibility,
      detectorAvailability: results.last?.detections.availability ?? .failed,
      ballDetectionCount: results.flatMap(\.detections.objects).filter { $0.kind == .ball }.count,
      rimDetectionCount: results.flatMap(\.detections.objects).filter { $0.kind == .rim }.count
    )
  }

  func runBundledSummary(resourceName: String, extension fileExtension: String = "mov", maxFrames: Int = 120) async throws -> CVFixtureRunSummary? {
    guard let url = Bundle.main.url(forResource: resourceName, withExtension: fileExtension) else {
      return nil
    }

    return try await runSummary(url: url, maxFrames: maxFrames)
  }
}
