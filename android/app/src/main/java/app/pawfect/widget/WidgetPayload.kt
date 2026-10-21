package app.pawfect.widget

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import app.pawfect.MainActivity
import app.pawfect.R
import org.json.JSONObject
import java.util.Calendar

data class WidgetTask(val title: String, val subtitle: String, val done: Boolean)

data class WidgetMilestone(val title: String, val dueDateLabel: String, val dueYmd: String)

data class WidgetNextUp(val title: String, val timeLabel: String)

data class WidgetProgress(val completed: Int, val total: Int) {
  val percent: Int get() = if (total <= 0) 0 else (completed * 100) / total
}

/**
 * Snapshot written by JS (`widgetSnapshot.ts`). [forDate] is the local day the
 * task-shaped fields describe; once the device date moves on they are stale.
 */
data class WidgetPayload(
  val petName: String,
  val tasks: List<WidgetTask>,
  val milestone: WidgetMilestone?,
  val nextUp: WidgetNextUp?,
  val progress: WidgetProgress?,
  val forDate: String?,
) {
  /** Payloads from older builds have no forDate; treat them as fresh until the app syncs. */
  val isForToday: Boolean get() = forDate.isNullOrEmpty() || forDate == WidgetDates.today()

  companion object {
    fun read(context: Context): WidgetPayload? {
      val prefs = context.getSharedPreferences(WidgetBridge.PREFS_NAME, Context.MODE_PRIVATE)
      val raw = prefs.getString(WidgetBridge.KEY_PAYLOAD, null) ?: return null
      return try {
        parse(JSONObject(raw), context.getString(R.string.widget_pet_fallback))
      } catch (_: Exception) {
        null
      }
    }

    internal fun parse(o: JSONObject, petFallback: String): WidgetPayload {
      val tasks = ArrayList<WidgetTask>()
      val arr = o.optJSONArray("tasks")
      if (arr != null) {
        for (i in 0 until arr.length()) {
          val t = arr.optJSONObject(i) ?: continue
          tasks.add(
            WidgetTask(
              t.optString("title", ""),
              t.optString("subtitle", ""),
              t.optBoolean("done", false),
            ),
          )
        }
      }
      val m = o.optJSONObject("milestone")
      val milestone =
        if (m != null && m.length() > 0) {
          WidgetMilestone(
            m.optString("title", ""),
            m.optString("dueDateLabel", ""),
            m.optString("dueDateYmd", ""),
          )
        } else {
          null
        }
      val n = o.optJSONObject("nextUp")
      val nextUp =
        if (n != null && n.length() > 0) {
          WidgetNextUp(n.optString("title", ""), n.optString("timeLabel", ""))
        } else {
          null
        }
      val p = o.optJSONObject("careProgress")
      val progress =
        if (p != null && p.length() > 0) {
          WidgetProgress(p.optInt("completed", 0), p.optInt("total", 0))
        } else {
          null
        }
      return WidgetPayload(
        petName = o.optString("petName", petFallback).ifBlank { petFallback },
        tasks = tasks,
        milestone = milestone,
        nextUp = nextUp,
        progress = progress,
        forDate = if (o.has("forDate")) o.optString("forDate") else null,
      )
    }
  }
}

object WidgetDates {
  private const val DAY_MS = 86_400_000.0

  private fun midnight(c: Calendar): Calendar {
    c.set(Calendar.HOUR_OF_DAY, 0)
    c.set(Calendar.MINUTE, 0)
    c.set(Calendar.SECOND, 0)
    c.set(Calendar.MILLISECOND, 0)
    return c
  }

  fun today(): String {
    val c = Calendar.getInstance()
    return "%04d-%02d-%02d".format(
      c.get(Calendar.YEAR),
      c.get(Calendar.MONTH) + 1,
      c.get(Calendar.DAY_OF_MONTH),
    )
  }

  /** Whole days from today to [ymd] (negative = overdue), or null if unparsable. */
  fun daysUntil(ymd: String): Int? {
    val parts = ymd.take(10).split("-")
    if (parts.size < 3) return null
    val y = parts[0].toIntOrNull() ?: return null
    val mo = parts[1].toIntOrNull() ?: return null
    val d = parts[2].toIntOrNull() ?: return null
    val due = midnight(Calendar.getInstance()).apply { set(y, mo - 1, d) }
    val today = midnight(Calendar.getInstance())
    return Math.round((due.timeInMillis - today.timeInMillis) / DAY_MS).toInt()
  }

  /** Mirrors the in-app urgency bars: overdue/≤7 days = 3, ≤30 = 2, otherwise 1. */
  fun urgencySegments(days: Int): Int =
    when {
      days <= 7 -> 3
      days <= 30 -> 2
      else -> 1
    }
}

object WidgetIntents {
  fun launchApp(context: Context, requestCode: Int): PendingIntent {
    val launch = Intent(context, MainActivity::class.java)
    val flags =
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      } else {
        @Suppress("DEPRECATION")
        PendingIntent.FLAG_UPDATE_CURRENT
      }
    return PendingIntent.getActivity(context, requestCode, launch, flags)
  }
}
