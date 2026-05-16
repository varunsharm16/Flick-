import SwiftUI

struct CoachChatView: View {
  @ObservedObject var model: CoachChatModel
  @State private var input = ""
  @FocusState private var inputFocused: Bool

  var body: some View {
    NavigationStack {
      VStack(spacing: 0) {
        ScrollViewReader { proxy in
          ScrollView {
            LazyVStack(spacing: 12) {
              ForEach(model.messages) { message in
                CoachBubble(message: message)
                  .id(message.id)
              }

              if model.isSending {
                ProgressView()
                  .tint(Color.flickOrange)
                  .padding()
              }
            }
            .padding(20)
          }
          .contentShape(Rectangle())
          .scrollDismissesKeyboard(.interactively)
          .onTapGesture {
            inputFocused = false
          }
          .onChange(of: model.messages.count) { _, _ in
            if let last = model.messages.last {
              proxy.scrollTo(last.id, anchor: .bottom)
            }
          }
        }

        HStack(spacing: 10) {
          TextField("Ask about your release", text: $input, axis: .vertical)
            .textFieldStyle(.plain)
            .focused($inputFocused)
            .padding(14)
            .flickSurface(cornerRadius: 18, tint: Color.white.opacity(0.06), interactive: true)

          Button {
            model.send(input)
            input = ""
            inputFocused = false
          } label: {
            Image(systemName: "paperplane.fill")
              .frame(width: 46, height: 46)
          }
          .disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
          .flickSurface(cornerRadius: 23, tint: Color.flickOrange.opacity(0.22), interactive: true)
        }
        .padding()
        .background(Color.black)
      }
      .background(Color.black.ignoresSafeArea())
      .navigationTitle("Coach Flick")
      .navigationBarTitleDisplayMode(.inline)
      .toolbar {
        ToolbarItemGroup(placement: .keyboard) {
          Spacer()
          Button("Done") {
            inputFocused = false
          }
        }
      }
    }
  }
}

private struct CoachBubble: View {
  let message: CoachMessage

  var body: some View {
    HStack {
      if message.role == .user {
        Spacer(minLength: 44)
      }

      VStack(alignment: .leading, spacing: 6) {
        if message.role == .assistant {
          Text("Coach Flick")
            .font(.caption.bold())
            .foregroundStyle(Color.flickOrange)
        }
        Text(message.text)
          .foregroundStyle(message.role == .user ? Color.black : Color.flickCream)
      }
      .padding(14)
      .flickSurface(
        cornerRadius: 18,
        tint: message.role == .user ? Color.flickOrange.opacity(0.32) : Color.white.opacity(0.06)
      )

      if message.role == .assistant {
        Spacer(minLength: 44)
      }
    }
  }
}
