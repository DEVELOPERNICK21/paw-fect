package app.pawfect.widget

import android.appwidget.AppWidgetManager
import android.content.Context
import android.graphics.Paint
import android.os.Bundle
import android.text.SpannableString
import android.text.Spanned
import android.text.style.StrikethroughSpan
import android.view.View
import android.widget.RemoteViews
import app.pawfect.R

/** "Today's care": progress bar plus a tick list sized to the widget's height. */
class UpcomingTasksWidgetProvider : PawfectWidgetProvider() {
  override val requestCodeBase = 10_000
  override val rootViewId = R.id.widget_tasks_root

  private val rowIds =
    intArrayOf(R.id.widget_task_1_row, R.id.widget_task_2_row, R.id.widget_task_3_row, R.id.widget_task_4_row)
  private val checkIds =
    intArrayOf(R.id.widget_task_1_check, R.id.widget_task_2_check, R.id.widget_task_3_check, R.id.widget_task_4_check)
  private val titleIds =
    intArrayOf(R.id.widget_task_1_title, R.id.widget_task_2_title, R.id.widget_task_3_title, R.id.widget_task_4_title)
  private val timeIds =
    intArrayOf(R.id.widget_task_1_time, R.id.widget_task_2_time, R.id.widget_task_3_time, R.id.widget_task_4_time)

  override fun render(context: Context, payload: WidgetPayload?, options: Bundle): RemoteViews {
    val views = RemoteViews(context.packageName, R.layout.widget_upcoming_tasks)
    val petName = payload?.petName ?: context.getString(R.string.widget_pet_fallback)
    views.setTextViewText(R.id.widget_tasks_pet, petName)

    when {
      payload == null -> emptyState(
        context, views,
        context.getString(R.string.widget_setup_title),
        context.getString(R.string.widget_setup_hint),
      )
      !payload.isForToday -> emptyState(
        context, views,
        context.getString(R.string.widget_stale_title),
        context.getString(R.string.widget_stale_hint),
      )
      payload.tasks.isEmpty() -> emptyState(
        context, views,
        context.getString(R.string.widget_tasks_empty_title),
        context.getString(R.string.widget_tasks_empty_hint),
      )
      else -> taskState(context, views, payload, options)
    }
    return views
  }

  private fun emptyState(context: Context, views: RemoteViews, title: String, hint: String) {
    views.setViewVisibility(R.id.widget_tasks_list, View.GONE)
    views.setViewVisibility(R.id.widget_tasks_progress, View.GONE)
    views.setViewVisibility(R.id.widget_tasks_badge, View.GONE)
    views.setViewVisibility(R.id.widget_tasks_empty, View.VISIBLE)
    views.setTextViewText(R.id.widget_tasks_empty_title, title)
    views.setTextViewText(R.id.widget_tasks_empty_hint, hint)
    views.setContentDescription(R.id.widget_tasks_root, "$title. $hint")
  }

  private fun taskState(
    context: Context,
    views: RemoteViews,
    payload: WidgetPayload,
    options: Bundle,
  ) {
    val total = payload.tasks.size
    val done = payload.tasks.count { it.done }
    val left = total - done
    // Show unfinished items first so the widget answers "what's next?" at a glance.
    val ordered = payload.tasks.sortedBy { it.done }

    val heightDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0)
    val fitting = if (heightDp <= 0) 3 else ((heightDp - 90) / 32)
    val visibleRows = fitting.coerceIn(1, rowIds.size)

    views.setViewVisibility(R.id.widget_tasks_empty, View.GONE)
    views.setViewVisibility(R.id.widget_tasks_list, View.VISIBLE)
    views.setViewVisibility(R.id.widget_tasks_progress, View.VISIBLE)
    views.setViewVisibility(R.id.widget_tasks_badge, View.VISIBLE)

    views.setTextViewText(
      R.id.widget_tasks_badge,
      if (left > 0) {
        context.getString(R.string.widget_tasks_left_fmt, left)
      } else {
        context.getString(R.string.widget_tasks_all_done)
      },
    )
    views.setProgressBar(R.id.widget_tasks_progress, 100, (done * 100) / total, false)

    for (i in rowIds.indices) {
      val task = ordered.getOrNull(i)
      if (task == null || i >= visibleRows) {
        views.setViewVisibility(rowIds[i], View.GONE)
        continue
      }
      views.setViewVisibility(rowIds[i], View.VISIBLE)
      views.setImageViewResource(
        checkIds[i],
        if (task.done) R.drawable.ic_widget_check_done else R.drawable.ic_widget_check_todo,
      )
      val title = SpannableString(task.title)
      if (task.done) {
        title.setSpan(StrikethroughSpan(), 0, title.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      }
      views.setTextViewText(titleIds[i], title)
      views.setTextColor(
        titleIds[i],
        context.getColor(if (task.done) R.color.widget_text_tertiary else R.color.widget_text_primary),
      )
      views.setTextViewText(timeIds[i], task.subtitle)
    }

    views.setContentDescription(
      R.id.widget_tasks_root,
      context.getString(R.string.widget_tasks_a11y_fmt, payload.petName, done, total),
    )
  }
}
