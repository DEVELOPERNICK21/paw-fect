package app.pawfect.notifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * Flags a JS-side notification resync whenever pending trigger times may be stale:
 * reboot clears alarms, and time zone / clock changes shift wall-clock reminder times.
 */
class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action !in RESYNC_ACTIONS) {
      return
    }
    NotificationBootPrefs.setNeedsResync(context.applicationContext)
  }

  private companion object {
    val RESYNC_ACTIONS = setOf(
      Intent.ACTION_BOOT_COMPLETED,
      Intent.ACTION_TIMEZONE_CHANGED,
      Intent.ACTION_TIME_CHANGED,
      Intent.ACTION_MY_PACKAGE_REPLACED,
    )
  }
}
