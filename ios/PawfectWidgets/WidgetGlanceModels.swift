import Foundation

struct WidgetGlancePayload: Codable {
  struct Milestone: Codable {
    let title: String
    let dueDateLabel: String
    let countdownLabel: String
    let dueDateYmd: String
    let kind: String
  }

  struct TaskRow: Codable {
    let title: String
    let subtitle: String
    let done: Bool
  }

  struct NextUp: Codable {
    let title: String
    let timeLabel: String
    let blockId: String
    let petId: String
  }

  struct CareProgress: Codable {
    let completed: Int
    let total: Int
    let percent: Int
  }

  let petName: String
  let breed: String
  let milestone: Milestone?
  let tasks: [TaskRow]
  let nextUp: NextUp?
  let careProgress: CareProgress?
  let updatedAt: String
}

enum WidgetGlancePayloadLoader {
  static func load() -> WidgetGlancePayload? {
    guard let raw = WidgetGlanceStorage.loadPayload(),
          let data = raw.data(using: .utf8) else {
      return nil
    }
    return try? JSONDecoder().decode(WidgetGlancePayload.self, from: data)
  }
}
