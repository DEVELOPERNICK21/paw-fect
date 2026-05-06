package app.pawfect.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context

object WidgetBridge {
  const val PREFS_NAME = "pawfect_widgets"
  const val KEY_PAYLOAD = "payload"

  fun refreshAll(context: Context) {
    val mgr = AppWidgetManager.getInstance(context)
    triggerUpdate(context, mgr, NextMilestoneWidgetProvider::class.java)
    triggerUpdate(context, mgr, UpcomingTasksWidgetProvider::class.java)
  }

  private fun triggerUpdate(
    context: Context,
    mgr: AppWidgetManager,
    cls: Class<out AppWidgetProvider>,
  ) {
    val cn = ComponentName(context, cls)
    val ids = mgr.getAppWidgetIds(cn)
    if (ids.isEmpty()) {
      return
    }
    val provider = cls.getDeclaredConstructor().newInstance()
    provider.onUpdate(context, mgr, ids)
  }
}
