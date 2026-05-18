package app.pawfect.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Build
import android.view.View
import android.widget.RemoteViews
import app.pawfect.MainActivity
import app.pawfect.R
import org.json.JSONObject

/** Compact lock-screen widget: next care task + time. */
class NextUpLockWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    val prefs = context.getSharedPreferences(WidgetBridge.PREFS_NAME, Context.MODE_PRIVATE)
    val raw = prefs.getString(WidgetBridge.KEY_PAYLOAD, null)
    var petName = context.getString(R.string.widget_pet_fallback)
    var title = context.getString(R.string.widget_next_up_empty)
    var timeLabel = ""

    if (raw != null) {
      try {
        val o = JSONObject(raw)
        petName = o.optString("petName", petName)
        val nextUp = o.optJSONObject("nextUp")
        if (nextUp != null && nextUp.length() > 0) {
          title = nextUp.optString("title", title)
          timeLabel = nextUp.optString("timeLabel", "")
        }
      } catch (_: Exception) {
        // keep defaults
      }
    }

    val flags =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      } else {
        @Suppress("DEPRECATION")
        PendingIntent.FLAG_UPDATE_CURRENT
      }

    for (id in appWidgetIds) {
      val views = RemoteViews(context.packageName, R.layout.widget_next_up_lock)
      views.setTextViewText(R.id.widget_next_up_pet, petName)
      views.setTextViewText(R.id.widget_next_up_title, title)
      if (timeLabel.isNotEmpty()) {
        views.setTextViewText(R.id.widget_next_up_time, timeLabel)
        views.setViewVisibility(R.id.widget_next_up_time, View.VISIBLE)
      } else {
        views.setViewVisibility(R.id.widget_next_up_time, View.GONE)
      }

      val launch = Intent(context, MainActivity::class.java)
      val pi = PendingIntent.getActivity(context, id + 30_000, launch, flags)
      views.setOnClickPendingIntent(R.id.widget_next_up_root, pi)

      appWidgetManager.updateAppWidget(id, views)
    }
  }
}
