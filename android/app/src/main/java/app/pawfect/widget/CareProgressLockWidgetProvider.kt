package app.pawfect.widget

import android.content.Context
import android.os.Bundle
import android.widget.RemoteViews
import app.pawfect.R

/** Small "Care progress" widget: how much of today's plan is done. */
class CareProgressLockWidgetProvider : PawfectWidgetProvider() {
  override val requestCodeBase = 20_000
  override val rootViewId = R.id.widget_care_progress_root

  override fun render(context: Context, payload: WidgetPayload?, options: Bundle): RemoteViews {
    val views = RemoteViews(context.packageName, R.layout.widget_care_progress_lock)
    views.setTextViewText(
      R.id.widget_care_progress_pet,
      payload?.petName ?: context.getString(R.string.widget_pet_fallback),
    )

    val line: String
    var percent = 0
    when {
      payload == null -> line = context.getString(R.string.widget_setup_title)
      !payload.isForToday -> line = context.getString(R.string.widget_stale_title)
      payload.progress == null || payload.progress.total <= 0 ->
        line = context.getString(R.string.widget_care_progress_empty)
      else -> {
        line = context.getString(
          R.string.widget_care_progress_line_fmt,
          payload.progress.completed,
          payload.progress.total,
        )
        percent = payload.progress.percent
      }
    }

    views.setTextViewText(R.id.widget_care_progress_line, line)
    views.setProgressBar(R.id.widget_care_progress_bar, 100, percent, false)
    views.setContentDescription(R.id.widget_care_progress_root, line)
    return views
  }
}
