package app.pawfect.widget

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetDataModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "WidgetDataModule"

  @ReactMethod
  fun sync(json: String) {
    val ctx = reactApplicationContext.applicationContext
    val prefs = ctx.getSharedPreferences(WidgetBridge.PREFS_NAME, Context.MODE_PRIVATE)
    prefs.edit().putString(WidgetBridge.KEY_PAYLOAD, json).apply()
    WidgetBridge.refreshAll(ctx)
  }
}
