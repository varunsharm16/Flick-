import AVFoundation
import Foundation

final class SpeechCoach {
  private let synthesizer = AVSpeechSynthesizer()

  func speak(_ cue: CoachingCue) {
    let utterance = AVSpeechUtterance(string: cue.text)
    utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
    utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.92
    utterance.pitchMultiplier = 0.98
    synthesizer.speak(utterance)
  }

  func stop() {
    synthesizer.stopSpeaking(at: .immediate)
  }
}
