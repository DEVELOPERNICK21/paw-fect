import Foundation

@objc(WidgetDataModule)
class WidgetDataModule: NSObject {
  @objc
  static func requiresMainQueueSetup() -> Bool {
    false
  }

  @objc
  func sync(_ json: String) {
    WidgetGlanceStorage.savePayload(json)
  }

  @objc
  func clear() {
    WidgetGlanceStorage.clearPayload()
  }
}
