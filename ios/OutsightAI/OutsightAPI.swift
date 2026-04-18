import Foundation

final class OutsightAPI {
    let baseURL = URL(string: ProcessInfo.processInfo.environment["OUTSIGHT_API"] ?? "http://localhost:4000")!
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    private func request(_ path: String, method: String = "GET", body: Data? = nil) async throws -> Data {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let body { req.httpBody = body }
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw URLError(.badServerResponse)
        }
        return data
    }

    func intelligence(company: String, executive: Bool = false) async throws -> IntelligencePayload {
        let payload = try encoder.encode(["company": company, "executive": "\(executive)"])
        let data = try await request("/intelligence", method: "POST", body: payload)
        return try decoder.decode(IntelligenceResponse.self, from: data).data
    }

    func watchlist() async throws -> [WatchlistItem] {
        struct R: Codable { let watchlist: [WatchlistItem] }
        let data = try await request("/watchlist")
        return try decoder.decode(R.self, from: data).watchlist
    }

    func addWatchlist(company: String) async throws -> [WatchlistItem] {
        struct R: Codable { let watchlist: [WatchlistItem] }
        let body = try encoder.encode(["company": company])
        let data = try await request("/watchlist", method: "POST", body: body)
        return try decoder.decode(R.self, from: data).watchlist
    }

    func alerts() async throws -> [AlertItem] {
        struct R: Codable { let alerts: [AlertItem] }
        let data = try await request("/alerts")
        return try decoder.decode(R.self, from: data).alerts
    }

    func subscribeAlerts(email: String?, pushToken: String?) async throws {
        let body = try encoder.encode(["email": email, "pushToken": pushToken].compactMapValues { $0 })
        _ = try await request("/alerts/subscribe", method: "POST", body: body)
    }
}
