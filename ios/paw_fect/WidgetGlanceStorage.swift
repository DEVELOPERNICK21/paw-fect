import Foundation
import WidgetKit

enum WidgetGlanceStorage {
  static let appGroupId = "group.app.pawfect.glance"
  static let payloadKey = "payload"

  static var defaults: UserDefaults {
    UserDefaults(suiteName: appGroupId) ?? .standard
  }

  static func savePayload(_ json: String) {
    defaults.set(json, forKey: payloadKey)
    if #available(iOS 14.0, *) {
      WidgetCenter.shared.reloadAllTimelines()
    }
  }

  static func loadPayload() -> String? {
    defaults.string(forKey: payloadKey)
  }
}
