import Foundation

// Duplicate of main-app storage helper for the Widget Extension target.
enum WidgetGlanceStorage {
  static let appGroupId = "group.app.pawfect.glance"
  static let payloadKey = "payload"

  static var defaults: UserDefaults {
    UserDefaults(suiteName: appGroupId) ?? .standard
  }

  static func loadPayload() -> String? {
    defaults.string(forKey: payloadKey)
  }
}
