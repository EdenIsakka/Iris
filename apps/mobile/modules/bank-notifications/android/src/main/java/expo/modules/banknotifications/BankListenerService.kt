package expo.modules.banknotifications

import android.app.Notification
import android.content.Context
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONArray
import org.json.JSONObject

/**
 * Android la llama con cada notificación, aunque Iris esté cerrada. Guarda solo las de bancos en
 * una fila; la app la lee al abrir. Así no hace falta correr JavaScript en segundo plano.
 */
class BankListenerService : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification) {
    val extras = sbn.notification.extras
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
    val text = (extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
      ?: extras.getCharSequence(Notification.EXTRA_TEXT))?.toString() ?: ""
    if (!isBank(sbn.packageName, text)) return
    BankQueue.add(
      this,
      JSONObject()
        .put("id", "${sbn.key}:${sbn.postTime}")
        .put("package", sbn.packageName)
        .put("title", title)
        .put("text", text)
        .put("postedAt", sbn.postTime),
    )
  }

  // La app del banco (BBVA), o el SMS del banco que muestra la app de mensajes (Bancolombia).
  private fun isBank(pkg: String, text: String) =
    pkg.contains("bbva", ignoreCase = true) ||
      pkg.contains("bancolombia", ignoreCase = true) ||
      text.startsWith("Bancolombia:")
}

/** Fila de notificaciones guardada en el celular hasta que la app las procese. */
object BankQueue {
  private const val PREFS = "iris_bank_queue"
  private const val KEY = "items"
  // Si la app no se abre en mucho tiempo, se quedan las más nuevas.
  private const val MAX = 200

  private fun read(ctx: Context) =
    JSONArray(ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(KEY, "[]"))

  private fun write(ctx: Context, items: JSONArray) =
    ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(KEY, items.toString()).apply()

  @Synchronized
  fun add(ctx: Context, item: JSONObject) {
    val items = read(ctx)
    // Android repite la misma notificación al actualizarla.
    for (i in 0 until items.length()) {
      if (items.getJSONObject(i).getString("id") == item.getString("id")) return
    }
    items.put(item)
    val kept = JSONArray()
    for (i in maxOf(0, items.length() - MAX) until items.length()) kept.put(items.get(i))
    write(ctx, kept)
  }

  @Synchronized
  fun all(ctx: Context): String = read(ctx).toString()

  /** Quita solo las ya procesadas: las que llegaron mientras tanto se quedan. */
  @Synchronized
  fun remove(ctx: Context, ids: List<String>) {
    val items = read(ctx)
    val kept = JSONArray()
    for (i in 0 until items.length()) {
      val item = items.getJSONObject(i)
      if (item.getString("id") !in ids) kept.put(item)
    }
    write(ctx, kept)
  }
}
