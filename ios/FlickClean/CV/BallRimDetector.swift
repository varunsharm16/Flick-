import CoreGraphics
import CoreMedia
import CoreML
import Foundation

struct DetectionTuning: Codable, Equatable {
  var ballConfidence: Double = 0.35
  var rimConfidence: Double = 0.40
  var iouThreshold: Double = 0.45
  var maxDetectionsPerClass: Int = 8

  static let liveDefault = DetectionTuning()

  func threshold(for kind: DetectedObjectKind) -> Double {
    switch kind {
    case .ball:
      ballConfidence
    case .rim:
      rimConfidence
    }
  }
}

enum DetectionOutputFormat: String, Codable, Equatable {
  case yoloMultiArray
  case visionRecognizedObjects
}

struct DetectionModelSpec: Codable, Equatable {
  var modelResourceName: String = "BallRimDetector"
  var inputName: String = "image"
  var outputName: String?
  var inputWidth: Double = 640
  var inputHeight: Double = 640
  var outputFormat: DetectionOutputFormat = .yoloMultiArray
  var classLabels: [Int: DetectedObjectKind] = [
    0: .ball,
    1: .rim
  ]

  static let defaultYOLO = DetectionModelSpec()
}

struct DetectorModelInfo: Equatable {
  var name: String
  var availability: DetectorAvailability
  var detail: String

  static let unavailable = DetectorModelInfo(
    name: "No model",
    availability: .unavailableNoModel,
    detail: "Add BallRimDetector.mlmodel, .mlmodelc, or .mlpackage to enable detection."
  )
}

protocol BallRimDetecting {
  var availability: DetectorAvailability { get }
  var modelInfo: DetectorModelInfo { get }
  func detect(in sampleBuffer: CMSampleBuffer, tuning: DetectionTuning) throws -> BallRimDetections
}

extension BallRimDetecting {
  func detect(in sampleBuffer: CMSampleBuffer) throws -> BallRimDetections {
    try detect(in: sampleBuffer, tuning: .liveDefault)
  }
}

final class UnavailableBallRimDetector: BallRimDetecting {
  let availability: DetectorAvailability = .unavailableNoModel
  let modelInfo: DetectorModelInfo = .unavailable

  func detect(in sampleBuffer: CMSampleBuffer, tuning: DetectionTuning) throws -> BallRimDetections {
    BallRimDetections(
      timestamp: CMSampleBufferGetPresentationTimeStamp(sampleBuffer).seconds,
      objects: [],
      availability: availability
    )
  }
}

enum BallRimDetectorFactory {
  static func makeBundledDetector(spec: DetectionModelSpec = .defaultYOLO) -> BallRimDetecting {
    guard let modelURL = bundledModelURL(resourceName: spec.modelResourceName) else {
      return UnavailableBallRimDetector()
    }

    do {
      return try CoreMLBallRimDetector(modelURL: modelURL, spec: spec)
    } catch {
      return FailedBallRimDetector(modelName: spec.modelResourceName, error: error)
    }
  }

  private static func bundledModelURL(resourceName: String) -> URL? {
    let bundle = Bundle.main
    return bundle.url(forResource: resourceName, withExtension: "mlmodelc")
      ?? bundle.url(forResource: resourceName, withExtension: "mlpackage")
      ?? bundle.url(forResource: resourceName, withExtension: "mlmodel")
  }
}

final class FailedBallRimDetector: BallRimDetecting {
  let availability: DetectorAvailability = .failed
  let modelInfo: DetectorModelInfo

  init(modelName: String, error: Error) {
    modelInfo = DetectorModelInfo(
      name: modelName,
      availability: .failed,
      detail: error.localizedDescription
    )
  }

  func detect(in sampleBuffer: CMSampleBuffer, tuning: DetectionTuning) throws -> BallRimDetections {
    BallRimDetections(
      timestamp: CMSampleBufferGetPresentationTimeStamp(sampleBuffer).seconds,
      objects: [],
      availability: .failed
    )
  }
}

final class CoreMLBallRimDetector: BallRimDetecting {
  private let model: MLModel
  private let spec: DetectionModelSpec
  private let decoder: ObjectDetectionDecoding
  let availability: DetectorAvailability = .ready
  let modelInfo: DetectorModelInfo

  init(
    modelURL: URL,
    spec: DetectionModelSpec = .defaultYOLO,
    decoder: ObjectDetectionDecoding = YOLOMultiArrayDecoder()
  ) throws {
    let loadURL: URL
    if modelURL.pathExtension == "mlmodel" {
      loadURL = try MLModel.compileModel(at: modelURL)
    } else {
      loadURL = modelURL
    }

    self.model = try MLModel(contentsOf: loadURL)
    self.spec = spec
    self.decoder = decoder
    self.modelInfo = DetectorModelInfo(
      name: spec.modelResourceName,
      availability: .ready,
      detail: "Loaded \(modelURL.lastPathComponent)"
    )
  }

  func detect(in sampleBuffer: CMSampleBuffer, tuning: DetectionTuning) throws -> BallRimDetections {
    guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
      return BallRimDetections(timestamp: 0, objects: [], availability: .failed)
    }

    let input = try MLDictionaryFeatureProvider(dictionary: [
      spec.inputName: MLFeatureValue(pixelBuffer: pixelBuffer)
    ])
    let output = try model.prediction(from: input)
    let decoded = try decoder.decode(
      features: output,
      spec: spec,
      tuning: tuning
    )

    return BallRimDetections(
      timestamp: CMSampleBufferGetPresentationTimeStamp(sampleBuffer).seconds,
      objects: decoded,
      availability: availability
    )
  }
}

protocol ObjectDetectionDecoding {
  func decode(
    features: MLFeatureProvider,
    spec: DetectionModelSpec,
    tuning: DetectionTuning
  ) throws -> [DetectedObject]
}

enum DetectionDecodeError: Error {
  case missingOutput
  case unsupportedShape([Int])
}

final class YOLOMultiArrayDecoder: ObjectDetectionDecoding {
  func decode(
    features: MLFeatureProvider,
    spec: DetectionModelSpec,
    tuning: DetectionTuning
  ) throws -> [DetectedObject] {
    guard let array = multiArray(from: features, preferredName: spec.outputName) else {
      throw DetectionDecodeError.missingOutput
    }

    let rows = try rows(from: array)
    let candidates = rows.compactMap { row in
      decode(row: row, spec: spec, tuning: tuning)
    }

    return DetectionNMS.filter(
      candidates,
      iouThreshold: tuning.iouThreshold,
      maxPerClass: tuning.maxDetectionsPerClass
    )
  }

  private func multiArray(from features: MLFeatureProvider, preferredName: String?) -> MLMultiArray? {
    if let preferredName, let value = features.featureValue(for: preferredName)?.multiArrayValue {
      return value
    }

    for name in features.featureNames {
      if let value = features.featureValue(for: name)?.multiArrayValue {
        return value
      }
    }

    return nil
  }

  private func rows(from array: MLMultiArray) throws -> [[Double]] {
    let shape = array.shape.map(\.intValue)
    guard shape.count == 2 || shape.count == 3 else {
      throw DetectionDecodeError.unsupportedShape(shape)
    }

    let values = (0..<array.count).map { array[$0].doubleValue }

    if shape.count == 2 {
      let first = shape[0]
      let second = shape[1]
      if second >= 6 {
        return matrixRows(values: values, rows: first, columns: second)
      }
      if first >= 6 {
        return transposedRows(values: values, channels: first, anchors: second)
      }
    }

    if shape.count == 3 {
      let a = shape[0]
      let b = shape[1]
      let c = shape[2]

      if a == 1, c >= 6 {
        return matrixRows(values: values, rows: b, columns: c)
      }
      if a == 1, b >= 6 {
        return transposedRows(values: values, channels: b, anchors: c)
      }
      if c >= 6 {
        return matrixRows(values: values, rows: a * b, columns: c)
      }
    }

    throw DetectionDecodeError.unsupportedShape(shape)
  }

  private func matrixRows(values: [Double], rows: Int, columns: Int) -> [[Double]] {
    (0..<rows).map { row in
      let start = row * columns
      return Array(values[start..<(start + columns)])
    }
  }

  private func transposedRows(values: [Double], channels: Int, anchors: Int) -> [[Double]] {
    (0..<anchors).map { anchor in
      (0..<channels).map { channel in
        values[channel * anchors + anchor]
      }
    }
  }

  private func decode(
    row: [Double],
    spec: DetectionModelSpec,
    tuning: DetectionTuning
  ) -> DetectedObject? {
    guard row.count >= 6 else { return nil }

    let box = normalizedBox(
      centerX: row[0],
      centerY: row[1],
      width: row[2],
      height: row[3],
      inputWidth: spec.inputWidth,
      inputHeight: spec.inputHeight
    )

    let classID: Int
    let confidence: Double

    if row.count == 6 {
      confidence = row[4]
      classID = Int(row[5].rounded())
    } else {
      let objectness = row[4]
      let scores = Array(row.dropFirst(5))
      guard let best = scores.enumerated().max(by: { $0.element < $1.element }) else {
        return nil
      }
      classID = best.offset
      confidence = objectness * best.element
    }

    guard
      let kind = spec.classLabels[classID],
      confidence >= tuning.threshold(for: kind)
    else {
      return nil
    }

    return DetectedObject(
      kind: kind,
      boundingBox: box,
      confidence: confidence
    )
  }

  private func normalizedBox(
    centerX: Double,
    centerY: Double,
    width: Double,
    height: Double,
    inputWidth: Double,
    inputHeight: Double
  ) -> CGRect {
    let normalizedCenterX = centerX > 1 ? centerX / inputWidth : centerX
    let normalizedCenterY = centerY > 1 ? centerY / inputHeight : centerY
    let normalizedWidth = width > 1 ? width / inputWidth : width
    let normalizedHeight = height > 1 ? height / inputHeight : height

    let minX = max(0, min(1, normalizedCenterX - normalizedWidth / 2))
    let minY = max(0, min(1, normalizedCenterY - normalizedHeight / 2))
    let maxX = max(0, min(1, normalizedCenterX + normalizedWidth / 2))
    let maxY = max(0, min(1, normalizedCenterY + normalizedHeight / 2))

    return CGRect(
      x: minX,
      y: minY,
      width: max(0, maxX - minX),
      height: max(0, maxY - minY)
    )
  }
}

enum DetectionNMS {
  static func filter(
    _ detections: [DetectedObject],
    iouThreshold: Double,
    maxPerClass: Int
  ) -> [DetectedObject] {
    var final: [DetectedObject] = []

    for kind in DetectedObjectKind.allCases {
      var pending = detections
        .filter { $0.kind == kind }
        .sorted { $0.confidence > $1.confidence }
      var kept: [DetectedObject] = []

      while let candidate = pending.first, kept.count < maxPerClass {
        kept.append(candidate)
        pending.removeFirst()
        pending.removeAll {
          iou(candidate.boundingBox, $0.boundingBox) >= iouThreshold
        }
      }

      final.append(contentsOf: kept)
    }

    return final.sorted { $0.confidence > $1.confidence }
  }

  static func iou(_ a: CGRect, _ b: CGRect) -> Double {
    let intersection = a.intersection(b)
    guard !intersection.isNull, intersection.width > 0, intersection.height > 0 else {
      return 0
    }

    let intersectionArea = intersection.width * intersection.height
    let unionArea = (a.width * a.height) + (b.width * b.height) - intersectionArea
    guard unionArea > 0 else { return 0 }
    return intersectionArea / unionArea
  }
}
