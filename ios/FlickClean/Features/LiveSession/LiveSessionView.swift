import SwiftUI

struct LiveSessionView: View {
  @ObservedObject var model: LiveSessionModel

  var body: some View {
    ZStack {
      CameraPreview(session: model.camera.session)
        .ignoresSafeArea()
        .overlay(Color.black.opacity(cameraOverlayOpacity))

      PoseSkeletonOverlay(frame: model.latestPose)
        .ignoresSafeArea()

      DetectionOverlay(detections: model.latestDetections.objects)
        .ignoresSafeArea()

      VStack(spacing: 0) {
        LiveSessionTopBar(model: model)
        #if DEBUG
        if model.showDebugOverlay {
          CameraDebugOverlay(
            camera: model.camera,
            processing: model.processingDiagnostics,
            pose: model.latestPose
          )
          .padding(.top, 10)
        }
        #endif
        Spacer()
        LiveCueStack(cues: model.cues)
        LiveSessionControls(model: model)
      }
      .padding(.horizontal, 18)
      .padding(.bottom, 18)
    }
    .background(Color.black.ignoresSafeArea())
    .task {
      model.prepareCamera()
    }
  }

  private var cameraOverlayOpacity: Double {
    switch model.camera.state {
    case .running:
      0.08
    default:
      0.52
    }
  }
}

private struct LiveSessionTopBar: View {
  @ObservedObject var model: LiveSessionModel

  var body: some View {
    VStack(spacing: 12) {
      HStack {
        VStack(alignment: .leading, spacing: 4) {
          Text(model.currentDrill.name)
            .font(.headline)
            .foregroundStyle(Color.flickCream)
          Text("\(model.currentDrill.zone.displayName) • \(model.shotAttempts)/\(model.currentDrill.targetCount)")
            .font(.subheadline)
            .foregroundStyle(.white.opacity(0.72))
        }

        Spacer()

        VStack(alignment: .trailing, spacing: 4) {
          Text("\(model.makes)/\(model.shotAttempts)")
            .font(.title3.bold())
            .foregroundStyle(Color.flickOrange)
          Text(formatTime(model.elapsedSeconds))
            .font(.caption.monospacedDigit())
            .foregroundStyle(.white.opacity(0.72))
        }
      }
      .padding(14)
      .flickSurface(cornerRadius: 18, tint: Color.black.opacity(0.42))

      if let warning = warningText {
        HStack(spacing: 10) {
          Image(systemName: "exclamationmark.triangle.fill")
            .foregroundStyle(Color.flickOrange)
          Text(warning)
            .font(.footnote.weight(.semibold))
            .foregroundStyle(Color.flickCream)
          Spacer()
        }
        .padding(12)
        .flickSurface(cornerRadius: 14, tint: Color.orange.opacity(0.16))
      }
    }
    .padding(.top, 8)
  }

  private var warningText: String? {
    if case let .paused(message) = model.phase {
      return message
    }
    return model.calibrationManager.calibration.warning
  }

  private func formatTime(_ seconds: TimeInterval) -> String {
    let minutes = Int(seconds) / 60
    let seconds = Int(seconds) % 60
    return String(format: "%d:%02d", minutes, seconds)
  }
}

private struct LiveSessionControls: View {
  @ObservedObject var model: LiveSessionModel

  var body: some View {
    VStack(spacing: 12) {
      CalibrationPanel(model: model)
      #if DEBUG
      DetectionTuningPanel(tuning: $model.detectionTuning)
      #endif

      HStack(spacing: 12) {
        Button("End") {
          model.forceEndSession()
        }
        .buttonStyle(SecondaryActionButtonStyle())

        Button(primaryTitle) {
          primaryAction()
        }
        .buttonStyle(PrimaryActionButtonStyle())
      }

      #if DEBUG
      HStack(spacing: 12) {
        Button(model.showDebugOverlay ? "Hide debug" : "Show debug") {
          model.toggleDebugOverlay()
        }

        Button("Simulate shot") {
          model.simulateShotForDebug()
        }
      }
      .font(.caption.weight(.bold))
      .foregroundStyle(.white.opacity(0.72))
      #endif
    }
    .padding(.bottom, 8)
  }

  private var primaryTitle: String {
    switch model.phase {
    case .idle:
      "Calibrate"
    case .calibrating:
      "Capture Point"
    case .readyToBegin:
      "Start Drill"
    case .running:
      "Running"
    case .paused:
      "Recheck"
    case .complete:
      "New Calibration"
    }
  }

  private func primaryAction() {
    switch model.phase {
    case .idle:
      model.startCalibration()
    case .calibrating:
      model.captureCalibrationPoint()
    case .readyToBegin:
      model.beginDrill()
    case .running:
      break
    case .paused:
      model.resumeAfterRecheck()
    case .complete:
      model.startCalibration()
    }
  }
}

private struct CalibrationPanel: View {
  @ObservedObject var model: LiveSessionModel

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack {
        Text(phaseTitle)
          .font(.headline)
          .foregroundStyle(Color.flickCream)
        Spacer()
        DetectorStatusBadge(status: model.latestDetections.availability)
      }

      if let activePoint = model.calibrationManager.activePoint {
        Text(activePoint.prompt)
          .font(.subheadline)
          .foregroundStyle(.white.opacity(0.74))
      } else {
        Text("Use calibration before starting every live session.")
          .font(.subheadline)
          .foregroundStyle(.white.opacity(0.64))
      }
    }
    .padding(14)
    .flickSurface(cornerRadius: 18, tint: Color.black.opacity(0.38))
  }

  private var phaseTitle: String {
    switch model.phase {
    case .idle: "Court setup"
    case .calibrating: "Calibration"
    case .readyToBegin: "Ready"
    case .running: "Live coaching"
    case .paused: "Paused"
    case .complete: "Complete"
    }
  }
}

private struct DetectorStatusBadge: View {
  let status: DetectorAvailability

  var body: some View {
    Text(label)
      .font(.caption.bold())
      .padding(.horizontal, 10)
      .padding(.vertical, 6)
      .background(color.opacity(0.18), in: Capsule())
      .foregroundStyle(color)
  }

  private var label: String {
    switch status {
    case .unavailableNoModel: "Model pending"
    case .ready: "Detector ready"
    case .failed: "Detector error"
    }
  }

  private var color: Color {
    switch status {
    case .unavailableNoModel: Color.flickOrange
    case .ready: .green
    case .failed: .red
    }
  }
}

private struct LiveCueStack: View {
  let cues: [CoachingCue]

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      ForEach(cues) { cue in
        Text(cue.text)
          .font(.subheadline.weight(.semibold))
          .foregroundStyle(Color.flickCream)
          .padding(.horizontal, 14)
          .padding(.vertical, 10)
          .flickSurface(cornerRadius: 18, tint: Color.black.opacity(0.42))
          .transition(.move(edge: .bottom).combined(with: .opacity))
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .animation(.spring(response: 0.35, dampingFraction: 0.82), value: cues)
    .padding(.bottom, 12)
  }
}

#if DEBUG
private struct CameraDebugOverlay: View {
  @ObservedObject var camera: CameraPipeline
  let processing: FrameProcessingDiagnostics
  let pose: PoseFrame?

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Label(stateLabel, systemImage: stateIcon)
          .font(.caption.bold())
          .foregroundStyle(stateColor)
        Spacer()
        Text("No raw video stored")
          .font(.caption2.bold())
          .foregroundStyle(.white.opacity(0.62))
      }

      LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], alignment: .leading, spacing: 8) {
        debugMetric("Input", String(format: "%.1f fps", camera.diagnostics.approximateInputFPS))
        debugMetric("Sampled", String(format: "%.1f fps", camera.diagnostics.approximateSampledFPS))
        debugMetric("Processed", "\(processing.framesProcessed)")
        debugMetric("Busy skips", "\(processing.framesSkippedBusy)")
        debugMetric("Luma", String(format: "%.2f", camera.diagnostics.latestLuminance))
        debugMetric("Pose", "\(processing.lastPoseQuality.rawValue) \(String(format: "%.0f%%", (pose?.visibilityScore ?? 0) * 100))")
        debugMetric("Frame", frameSizeText)
        debugMetric("Avg ms", String(format: "%.1f", processing.averageProcessingMilliseconds))
        debugMetric("Arm", String(format: "%.0f%%", (pose?.visibility.shootingArmScore ?? 0) * 100))
        debugMetric("Upper", String(format: "%.0f%%", (pose?.visibility.upperBodyScore ?? 0) * 100))
        debugMetric("Ball", "\(processing.ballDetectionCount)")
        debugMetric("Rim", "\(processing.rimDetectionCount)")
      }

      Text(processing.detectorDetail ?? "Detector pending")
        .font(.caption2)
        .foregroundStyle(.white.opacity(0.56))
        .lineLimit(2)

      if !processing.missingRequiredJoints.isEmpty {
        Text("Missing: \(processing.missingRequiredJoints.map(\.rawValue).joined(separator: ", "))")
          .font(.caption2)
          .foregroundStyle(.yellow.opacity(0.9))
          .lineLimit(2)
      }

      if let error = processing.lastError {
        Text(error)
          .font(.caption2)
          .foregroundStyle(.red.opacity(0.86))
      }
    }
    .padding(12)
    .flickSurface(cornerRadius: 16, tint: Color.black.opacity(0.46))
  }

  private func debugMetric(_ title: String, _ value: String) -> some View {
    HStack(spacing: 6) {
      Text(title)
        .foregroundStyle(.white.opacity(0.56))
      Spacer(minLength: 4)
      Text(value)
        .foregroundStyle(Color.flickCream)
        .monospacedDigit()
    }
    .font(.caption2)
  }

  private var frameSizeText: String {
    let size = camera.diagnostics.latestDimensions
    guard size != .zero else { return "--" }
    return "\(Int(size.width))x\(Int(size.height))"
  }

  private var stateLabel: String {
    switch camera.state {
    case .idle: "Idle"
    case .requestingPermission: "Requesting permission"
    case .denied: "Camera denied"
    case .configuring: "Configuring"
    case .ready: "Ready"
    case .running: "Running"
    case let .interrupted(message): message
    case let .failed(message): message
    }
  }

  private var stateIcon: String {
    switch camera.state {
    case .running: "camera.fill"
    case .failed, .denied, .interrupted: "exclamationmark.triangle.fill"
    default: "camera"
    }
  }

  private var stateColor: Color {
    switch camera.state {
    case .running: .green
    case .failed, .denied, .interrupted: .red
    default: Color.flickOrange
    }
  }
}
#endif

private struct DetectionOverlay: View {
  let detections: [DetectedObject]

  var body: some View {
    GeometryReader { proxy in
      Canvas { context, size in
        for detection in detections {
          let rect = scaledRect(detection.boundingBox, size: size)
          let color = color(for: detection.kind)

          context.stroke(
            Path(roundedRect: rect, cornerRadius: 6),
            with: .color(color),
            lineWidth: detection.kind == .rim ? 3 : 4
          )

          let labelRect = CGRect(
            x: rect.minX,
            y: max(0, rect.minY - 24),
            width: min(120, max(64, rect.width)),
            height: 22
          )
          context.fill(Path(roundedRect: labelRect, cornerRadius: 6), with: .color(color.opacity(0.86)))

          let label = Text("\(detection.kind.rawValue) \(Int(detection.confidence * 100))%")
            .font(.caption2.bold())
            .foregroundColor(.black)
          context.draw(label, in: labelRect.insetBy(dx: 6, dy: 3))
        }
      }
    }
    .allowsHitTesting(false)
  }

  private func scaledRect(_ normalized: CGRect, size: CGSize) -> CGRect {
    CGRect(
      x: normalized.minX * size.width,
      y: normalized.minY * size.height,
      width: normalized.width * size.width,
      height: normalized.height * size.height
    )
  }

  private func color(for kind: DetectedObjectKind) -> Color {
    switch kind {
    case .ball:
      Color.flickOrange
    case .rim:
      .cyan
    }
  }
}

#if DEBUG
private struct DetectionTuningPanel: View {
  @Binding var tuning: DetectionTuning

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack {
        Text("Detector tuning")
          .font(.headline)
          .foregroundStyle(Color.flickCream)
        Spacer()
        Text("DEBUG")
          .font(.caption.bold())
          .foregroundStyle(.black)
          .padding(.horizontal, 8)
          .padding(.vertical, 4)
          .background(Color.flickOrange, in: Capsule())
      }

      tuningSlider(
        title: "Ball confidence",
        value: $tuning.ballConfidence,
        range: 0.05...0.95
      )
      tuningSlider(
        title: "Rim confidence",
        value: $tuning.rimConfidence,
        range: 0.05...0.95
      )
      tuningSlider(
        title: "NMS IoU",
        value: $tuning.iouThreshold,
        range: 0.10...0.90
      )

      Stepper("Max per class: \(tuning.maxDetectionsPerClass)", value: $tuning.maxDetectionsPerClass, in: 1...20)
        .font(.caption)
        .foregroundStyle(.white.opacity(0.76))
    }
    .padding(14)
    .flickSurface(cornerRadius: 18, tint: Color.black.opacity(0.38))
  }

  private func tuningSlider(
    title: String,
    value: Binding<Double>,
    range: ClosedRange<Double>
  ) -> some View {
    VStack(alignment: .leading, spacing: 4) {
      HStack {
        Text(title)
        Spacer()
        Text(String(format: "%.2f", value.wrappedValue))
          .monospacedDigit()
      }
      .font(.caption)
      .foregroundStyle(.white.opacity(0.76))

      Slider(value: value, in: range)
        .tint(Color.flickOrange)
    }
  }
}
#endif

#Preview {
  LiveSessionView(model: LiveSessionModel())
}
