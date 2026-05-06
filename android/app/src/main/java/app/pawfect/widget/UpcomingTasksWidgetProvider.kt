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
import org.json.JSONArray
import org.json.JSONObject

class UpcomingTasksWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    val prefs = context.getSharedPreferences(WidgetBridge.PREFS_NAME, Context.MODE_PRIVATE)
    val raw = prefs.getString(WidgetBridge.KEY_PAYLOAD, null)
    var badge = "0 Left"
    var body = context.getString(R.string.widget_tasks_empty)
    var hasTasks = false

    if (raw != null) {
      try {
        val o = JSONObject(raw)
        val arr: JSONArray? = o.optJSONArray("tasks")
        if (arr != null && arr.length() > 0) {
          hasTasks = true
          val sb = StringBuilder()
          var pending = 0
          val limit = minOf(arr.length(), 5)
          for (i in 0 until limit) {
            val t = arr.optJSONObject(i) ?: continue
            val taskTitle = t.optString("title", "")
            val sub = t.optString("subtitle", "")
            val done = t.optBoolean("done", false)
            if (!done) {
              pending++
            }
            val box = if (done) "☑" else "☐"
            sb.append(box).append(" ").append(taskTitle).append("\n   ").append(sub)
            if (i < limit - 1) {
              sb.append("\n\n")
            }
          }
          body = sb.toString()
          badge = "$pending Left"
        }
      } catch (_: Exception) {
        body = context.getString(R.string.widget_open_app)
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
      val views = RemoteViews(context.packageName, R.layout.widget_upcoming_tasks)
      views.setTextViewText(R.id.widget_tasks_badge, badge)
      views.setTextViewText(R.id.widget_tasks_body, body)

      if (hasTasks) {
        views.setTextViewText(
          R.id.widget_tasks_footer_hint,
          context.getString(R.string.widget_tasks_footer_when_list),
        )
      } else {
        views.setTextViewText(
          R.id.widget_tasks_footer_hint,
          context.getString(R.string.widget_tasks_add_hint),
        )
      }
      views.setViewVisibility(R.id.widget_tasks_footer_hint, View.VISIBLE)

      val launch = Intent(context, MainActivity::class.java)
      val pi = PendingIntent.getActivity(context, id + 10_000, launch, flags)
      views.setOnClickPendingIntent(R.id.widget_tasks_root, pi)

      appWidgetManager.updateAppWidget(id, views)
    }
  }
}
