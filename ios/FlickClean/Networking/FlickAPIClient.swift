import Foundation

protocol AuthTokenProviding {
  func accessToken() async throws -> String?
}

struct NoAuthTokenProvider: AuthTokenProviding {
  func accessToken() async throws -> String? {
    nil
  }
}

struct FlickAPIClient {
  enum APIError: Error {
    case invalidResponse
    case serverError(String)
  }

  var baseURL: URL
  var tokenProvider: AuthTokenProviding
  var session: URLSession = .shared

  init(
    baseURL: URL = URL(string: "http://localhost:5050")!,
    tokenProvider: AuthTokenProviding = NoAuthTokenProvider()
  ) {
    self.baseURL = baseURL
    self.tokenProvider = tokenProvider
  }

  func chat(message: String, context: CoachContextPayload) async throws -> String {
    let response: CoachChatResponse = try await post(
      path: "/ai/chat",
      payload: CoachChatRequest(message: message, context: context)
    )
    return response.reply
  }

  func analyzeShot(_ payload: ShotAnalysisRequest) async throws -> ShotAnalysisResponse {
    try await post(path: "/ai/shot", payload: payload)
  }

  func synthesizeSession(_ payload: SessionSynthesisRequest) async throws -> SessionSynthesisResponse {
    try await post(path: "/ai/session", payload: payload)
  }

  private func post<Request: Encodable, Response: Decodable>(
    path: String,
    payload: Request
  ) async throws -> Response {
    var request = URLRequest(url: baseURL.appending(path: path))
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    if let token = try await tokenProvider.accessToken() {
      request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }

    request.httpBody = try JSONEncoder.flick.encode(payload)
    let (data, response) = try await session.data(for: request)

    guard let http = response as? HTTPURLResponse else {
      throw APIError.invalidResponse
    }

    guard (200..<300).contains(http.statusCode) else {
      let body = String(data: data, encoding: .utf8) ?? "Unknown server error"
      throw APIError.serverError(body)
    }

    return try JSONDecoder.flick.decode(Response.self, from: data)
  }
}

extension JSONEncoder {
  static var flick: JSONEncoder {
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
    return encoder
  }
}

extension JSONDecoder {
  static var flick: JSONDecoder {
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    return decoder
  }
}

struct CoachContextPayload: Codable {
  var userProfile: UserProfile?
  var recentCues: [CoachingCue]
  var activeDrill: Drill?
  var recentShots: [Shot]
}

struct CoachChatRequest: Codable {
  var message: String
  var context: CoachContextPayload
}

struct CoachChatResponse: Codable {
  var reply: String
}

struct ShotAnalysisRequest: Codable {
  var shot: Shot
  var keyFramesBase64JPEG: [String]
  var drill: Drill
  var userProfile: UserProfile?
}

struct ShotAnalysisResponse: Codable {
  var cue: CoachingCue?
  var notes: String?
}

struct SessionSynthesisRequest: Codable {
  var session: Session
}

struct SessionSynthesisResponse: Codable {
  var summary: String
  var topInsight: String
  var nextFocus: String
}
