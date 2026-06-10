package app.pawfect.notifications

import android.content.Context

object NotificationBootPrefs {
  private const val PREFS_NAME = "pawfect_notification_boot"
  private const val KEY_NEEDS_RESYNC = "needsNotificationResync"

  fun setNeedsResync(context: Context) {
    context
      .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putBoolean(KEY_NEEDS_RESYNC, true)
      .apply()
  }

  fun consumeNeedsResync(context: Context): Boolean {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val needs = prefs.getBoolean(KEY_NEEDS_RESYNC, false)
    if (needs) {
      prefs.edit().remove(KEY_NEEDS_RESYNC).apply()
    }
    return needs
  }
}
