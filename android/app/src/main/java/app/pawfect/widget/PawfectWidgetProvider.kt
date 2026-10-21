package app.pawfect.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.os.Bundle
import android.widget.RemoteViews

/**
 * Shared plumbing: every Pawfect widget re-reads the stored snapshot on each
 * update (OS timer, app sync, or a resize) and renders through [render].
 */
abstract class PawfectWidgetProvider : AppWidgetProvider() {
  protected abstract val requestCodeBase: Int

  protected abstract fun render(
    context: Context,
    payload: WidgetPayload?,
    options: Bundle,
  ): RemoteViews

  protected abstract val rootViewId: Int

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    val payload = WidgetPayload.read(context)
    for (id in appWidgetIds) {
      update(context, appWidgetManager, id, payload)
    }
  }

  override fun onAppWidgetOptionsChanged(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: Bundle,
  ) {
    update(context, appWidgetManager, appWidgetId, WidgetPayload.read(context))
  }

  private fun update(
    context: Context,
    manager: AppWidgetManager,
    id: Int,
    payload: WidgetPayload?,
  ) {
    val views = render(context, payload, manager.getAppWidgetOptions(id))
    views.setOnClickPendingIntent(
      rootViewId,
      WidgetIntents.launchApp(context, requestCodeBase + id),
    )
    manager.updateAppWidget(id, views)
  }
}
