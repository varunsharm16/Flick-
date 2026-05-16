import Foundation

struct CoachMessage: Identifiable, Equatable {
  enum Role {
    case user
    case assistant
  }

  var id = UUID()
  var role: Role
  var text: String
}

final class CoachChatModel: ObservableObject {
  @Published var messages: [CoachMessage] = [
    CoachMessage(role: .assistant, text: "Ask about your shot. I will anchor answers to your session data as it comes in.")
  ]
  @Published var isSending = false

  private let apiClient: FlickAPIClient

  init(apiClient: FlickAPIClient = FlickAPIClient()) {
    self.apiClient = apiClient
  }

  func send(_ text: String) {
    let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty, !isSending else { return }

    messages.append(CoachMessage(role: .user, text: trimmed))
    isSending = true

    Task {
      do {
        let reply = try await apiClient.chat(
          message: trimmed,
          context: CoachContextPayload(
            userProfile: nil,
            recentCues: [],
            activeDrill: DrillRegistry.introductoryPlan.first,
            recentShots: []
          )
        )
        await MainActor.run {
          self.messages.append(CoachMessage(role: .assistant, text: reply))
          self.isSending = false
        }
      } catch {
        await MainActor.run {
          self.messages.append(CoachMessage(role: .assistant, text: "Coach chat is wired, but the authenticated server connection is not available in this build yet."))
          self.isSending = false
        }
      }
    }
  }
}
