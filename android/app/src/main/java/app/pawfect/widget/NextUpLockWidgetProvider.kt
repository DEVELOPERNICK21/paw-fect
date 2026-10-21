package app.pawfect.widget

import android.content.Context
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import app.pawfect.R

/** Small "Next up" widget: the next pending care task and its time. */
class NextUpLockWidgetProvider : PawfectWidgetProvider() {
  override val requestCodeBase = 30_000
  override val rootViewId = R.id.widget_next_up_root

  override fun render(context: Context, payload: WidgetPayload?, options: Bundle): RemoteViews {
    val views = RemoteViews(context.packageName, R.layout.widget_next_up_lock)
    val petName = payload?.petName ?: context.getString(R.string.widget_pet_fallback)
    views.setTextViewText(R.id.widget_next_up_pet, petName)

    val title: String
    var time = ""
    when {
      payload == null -> {
        title = context.getString(R.string.widget_setup_title)
        time = context.getString(R.string.widget_setup_hint)
      }
      !payload.isForToday -> {
        title = context.getString(R.string.widget_stale_title)
        time = context.getString(R.string.widget_stale_hint)
      }
      payload.nextUp != null -> {
        title = payload.nextUp.title
        time = payload.nextUp.timeLabel
      }
      payload.tasks.isEmpty() && payload.progress == null -> {
        title = context.getString(R.string.widget_tasks_empty_title)
      }
      else -> {
        title = context.getString(R.string.widget_next_up_empty)
        time = context.getString(R.string.widget_next_up_empty_hint)
      }
    }

    views.setTextViewText(R.id.widget_next_up_title, title)
    if (time.isNotEmpty()) {
      views.setTextViewText(R.id.widget_next_up_time, time)
      views.setViewVisibility(R.id.widget_next_up_time, View.VISIBLE)
    } else {
      views.setViewVisibility(R.id.widget_next_up_time, View.GONE)
    }
    views.setContentDescription(
      R.id.widget_next_up_root,
      context.getString(R.string.widget_next_up_a11y_fmt, petName, title, time).trim(),
    )
    return views
  }
}
