package app.pawfect.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.os.Build
import android.widget.RemoteViews
import app.pawfect.MainActivity
import app.pawfect.R
import org.json.JSONObject

/** Compact lock-screen widget: today's care completion. */
class CareProgressLockWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    val prefs = context.getSharedPreferences(WidgetBridge.PREFS_NAME, Context.MODE_PRIVATE)
    val raw = prefs.getString(WidgetBridge.KEY_PAYLOAD, null)
    var petName = context.getString(R.string.widget_pet_fallback)
    var line = context.getString(R.string.widget_care_progress_empty)
    var percentLine = ""

    if (raw != null) {
      try {
        val o = JSONObject(raw)
        petName = o.optString("petName", petName)
        val progress = o.optJSONObject("careProgress")
        if (progress != null && progress.length() > 0) {
          val completed = progress.optInt("completed", 0)
          val total = progress.optInt("total", 0)
          val percent = progress.optInt("percent", 0)
          line = context.getString(R.string.widget_care_progress_line_fmt, completed, total)
          percentLine = context.getString(R.string.widget_care_progress_percent_fmt, percent)
        }
      } catch (_: Exception) {
        line = context.getString(R.string.widget_open_app)
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
      val views = RemoteViews(context.packageName, R.layout.widget_care_progress_lock)
      views.setTextViewText(R.id.widget_care_progress_pet, petName)
      views.setTextViewText(R.id.widget_care_progress_line, line)
      views.setTextViewText(R.id.widget_care_progress_percent, percentLine)

      val launch = Intent(context, MainActivity::class.java)
      val pi = PendingIntent.getActivity(context, id + 40_000, launch, flags)
      views.setOnClickPendingIntent(R.id.widget_care_progress_root, pi)

      appWidgetManager.updateAppWidget(id, views)
    }
  }
}
