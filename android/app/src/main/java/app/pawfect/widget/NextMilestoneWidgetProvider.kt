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
import java.util.Calendar

class NextMilestoneWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    val prefs = context.getSharedPreferences(WidgetBridge.PREFS_NAME, Context.MODE_PRIVATE)
    val raw = prefs.getString(WidgetBridge.KEY_PAYLOAD, null)
    var petName = "Pet"
    var title = context.getString(R.string.widget_no_milestone)
    var dateLine = ""
    var countdown = ""
    var dueYmd = ""

    if (raw != null) {
      try {
        val o = JSONObject(raw)
        petName = o.optString("petName", petName)
        val m = o.optJSONObject("milestone")
        if (m != null && m.length() > 0) {
          title = m.optString("title", title)
          dateLine = m.optString("dueDateLabel", "")
          countdown = m.optString("countdownLabel", "")
          dueYmd = m.optString("dueDateYmd", "")
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

    val countdownDisplay =
      if (countdown.isNotEmpty()) {
        countdown.trim().uppercase().replace("\\s+".toRegex(), " ")
      } else {
        ""
      }

    val filled = if (dueYmd.length >= 10) {
      filledSegmentCount(dueYmd)
    } else {
      0
    }

    val progIds = intArrayOf(R.id.widget_prog_1, R.id.widget_prog_2, R.id.widget_prog_3)

    for (id in appWidgetIds) {
      val views = RemoteViews(context.packageName, R.layout.widget_next_milestone)
      views.setTextViewText(R.id.widget_pet, petName)
      views.setTextViewText(R.id.widget_milestone_title, title)
      views.setTextViewText(
        R.id.widget_milestone_date,
        if (dateLine.isNotEmpty()) {
          "📅 $dateLine"
        } else {
          ""
        },
      )

      if (countdownDisplay.isNotEmpty()) {
        views.setTextViewText(R.id.widget_countdown_pill, countdownDisplay)
        views.setViewVisibility(R.id.widget_countdown_pill, View.VISIBLE)
      } else {
        views.setViewVisibility(R.id.widget_countdown_pill, View.GONE)
      }

      for (i in 0..2) {
        val on = dueYmd.isNotEmpty() && i < filled
        views.setImageViewResource(
          progIds[i],
          if (on) {
            R.drawable.widget_seg_on
          } else {
            R.drawable.widget_seg_off
          },
        )
      }
      views.setViewVisibility(
        R.id.widget_progress_row,
        if (dueYmd.isNotEmpty()) View.VISIBLE else View.GONE,
      )

      val launch = Intent(context, MainActivity::class.java)
      val pi = PendingIntent.getActivity(context, id, launch, flags)
      views.setOnClickPendingIntent(R.id.widget_root, pi)

      appWidgetManager.updateAppWidget(id, views)
    }
  }

  companion object {
    /** Matches in-app `filledProgressSegments` (1–3 bars). */
    fun filledSegmentCount(dueYmd: String): Int {
      val key = dueYmd.take(10)
      val parts = key.split("-")
      if (parts.size < 3) {
        return 1
      }
      val y = parts[0].toIntOrNull() ?: return 1
      val mo = parts[1].toIntOrNull() ?: 1
      val d = parts[2].toIntOrNull() ?: 1
      val due = Calendar.getInstance()
      due.set(y, mo - 1, d, 0, 0, 0)
      due.set(Calendar.MILLISECOND, 0)
      val today = Calendar.getInstance()
      today.set(Calendar.HOUR_OF_DAY, 0)
      today.set(Calendar.MINUTE, 0)
      today.set(Calendar.SECOND, 0)
      today.set(Calendar.MILLISECOND, 0)
      val diff =
        ((due.timeInMillis - today.timeInMillis) / (1000L * 60 * 60 * 24)).toInt()
      if (diff < 0) {
        return 3
      }
      if (diff <= 7) {
        return 3
      }
      if (diff <= 30) {
        return 2
      }
      return 1
    }
  }
}
