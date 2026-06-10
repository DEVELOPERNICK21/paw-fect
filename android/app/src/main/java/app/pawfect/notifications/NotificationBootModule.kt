package app.pawfect.notifications

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class NotificationBootModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "NotificationBootModule"

  @ReactMethod
  fun consumeBootResyncFlag(promise: Promise) {
    try {
      val needsResync =
        NotificationBootPrefs.consumeNeedsResync(reactApplicationContext.applicationContext)
      promise.resolve(needsResync)
    } catch (error: Exception) {
      promise.reject("BOOT_RESYNC_READ_FAILED", error)
    }
  }
}
