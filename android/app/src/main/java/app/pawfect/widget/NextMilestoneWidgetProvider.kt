package app.pawfect.widget

import android.content.Context
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import app.pawfect.R

/**
 * Next vaccine / deworming. The countdown is recomputed from the due date on
 * every update, so it stays correct even if the app has not been opened for days.
 */
class NextMilestoneWidgetProvider : PawfectWidgetProvider() {
  override val requestCodeBase = 0
  override val rootViewId = R.id.widget_root

  private val segmentIds =
    intArrayOf(R.id.widget_prog_1, R.id.widget_prog_2, R.id.widget_prog_3)

  override fun render(context: Context, payload: WidgetPayload?, options: Bundle): RemoteViews {
    val views = RemoteViews(context.packageName, R.layout.widget_next_milestone)
    val petName = payload?.petName ?: context.getString(R.string.widget_pet_fallback)
    views.setTextViewText(R.id.widget_pet, petName)

    val milestone = payload?.milestone
    val days = milestone?.dueYmd?.takeIf { it.isNotEmpty() }?.let { WidgetDates.daysUntil(it) }

    when {
      payload == null -> bare(
        context, views,
        context.getString(R.string.widget_setup_title),
        context.getString(R.string.widget_setup_hint),
      )
      milestone == null -> bare(
        context, views,
        context.getString(R.string.widget_no_milestone),
        context.getString(R.string.widget_no_milestone_hint),
      )
      else -> {
        views.setTextViewText(R.id.widget_milestone_title, milestone.title)
        views.setTextViewText(R.id.widget_milestone_date, milestone.dueDateLabel)
        if (days != null) {
          showCountdown(context, views, days)
        } else {
          views.setViewVisibility(R.id.widget_countdown_pill, View.GONE)
          views.setViewVisibility(R.id.widget_progress_row, View.GONE)
        }
        val chip = if (days != null) countdownLabel(context, days) else ""
        views.setContentDescription(
          R.id.widget_root,
          context.getString(R.string.widget_milestone_a11y_fmt, petName, milestone.title, chip).trim(),
        )
      }
    }
    return views
  }

  private fun bare(context: Context, views: RemoteViews, title: String, hint: String) {
    views.setTextViewText(R.id.widget_milestone_title, title)
    views.setTextViewText(R.id.widget_milestone_date, hint)
    views.setViewVisibility(R.id.widget_countdown_pill, View.GONE)
    views.setViewVisibility(R.id.widget_progress_row, View.GONE)
    views.setContentDescription(R.id.widget_root, "$title. $hint")
  }

  private fun countdownLabel(context: Context, days: Int): String =
    when {
      days < 0 -> context.getString(R.string.widget_countdown_overdue)
      days == 0 -> context.getString(R.string.widget_countdown_today)
      days == 1 -> context.getString(R.string.widget_countdown_tomorrow)
      else -> context.getString(R.string.widget_countdown_days_fmt, days)
    }

  private fun showCountdown(context: Context, views: RemoteViews, days: Int) {
    views.setTextViewText(R.id.widget_countdown_pill, countdownLabel(context, days))
    views.setViewVisibility(R.id.widget_countdown_pill, View.VISIBLE)
    // Overdue = red, due within a week = solid brand orange, otherwise a quiet tint.
    when {
      days < 0 -> {
        views.setInt(R.id.widget_countdown_pill, "setBackgroundResource", R.drawable.widget_chip_danger)
        views.setTextColor(R.id.widget_countdown_pill, context.getColor(R.color.widget_danger))
      }
      days <= 7 -> {
        views.setInt(R.id.widget_countdown_pill, "setBackgroundResource", R.drawable.widget_chip_solid)
        views.setTextColor(R.id.widget_countdown_pill, context.getColor(R.color.widget_on_accent))
      }
      else -> {
        views.setInt(R.id.widget_countdown_pill, "setBackgroundResource", R.drawable.widget_chip_soft)
        views.setTextColor(R.id.widget_countdown_pill, context.getColor(R.color.widget_accent_strong))
      }
    }

    val filled = WidgetDates.urgencySegments(days)
    for (i in segmentIds.indices) {
      views.setImageViewResource(
        segmentIds[i],
        if (i < filled) R.drawable.widget_seg_on else R.drawable.widget_seg_off,
      )
    }
    views.setViewVisibility(R.id.widget_progress_row, View.VISIBLE)
  }
}
