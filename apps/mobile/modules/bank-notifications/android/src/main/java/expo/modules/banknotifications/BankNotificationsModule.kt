package expo.modules.banknotifications

import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BankNotificationsModule : Module() {
  private val context
    get() = requireNotNull(appContext.reactContext)

  override fun definition() = ModuleDefinition {
    Name("BankNotifications")

    /** true si la persona le dio a Iris "Acceso a notificaciones". */
    Function("isEnabled") {
      val enabled = Settings.Secure.getString(context.contentResolver, "enabled_notification_listeners")
      enabled?.contains(context.packageName) == true
    }

    /** Las notificaciones guardadas, como JSON. */
    Function("all") { BankQueue.all(context) }

    Function("remove") { ids: List<String> -> BankQueue.remove(context, ids) }
  }
}
