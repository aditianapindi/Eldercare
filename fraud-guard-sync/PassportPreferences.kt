package com.saaya.app.util

import android.content.Context
import org.json.JSONArray

/**
 * Preferences for the Inaya passport-sync feature.
 *
 * Uses a **separate** SharedPreferences file so we never mix concerns
 * with [GuardianPreferences] (`saaya_prefs`).
 *
 * All writes use [commit()][android.content.SharedPreferences.Editor.commit]
 * instead of `apply()` so data survives a crash immediately after write.
 */
class PassportPreferences(context: Context) {

    private val prefs = context.getSharedPreferences(PREFS_FILE, Context.MODE_PRIVATE)

    /** Returns `true` when a passport code has been claimed and a device token is stored. */
    fun isLinked(): Boolean =
        prefs.getString(KEY_DEVICE_TOKEN, null).isNullOrBlank().not()

    /** Persist a successful passport claim. */
    fun saveLink(code: String, deviceToken: String) {
        prefs.edit()
            .putString(KEY_PASSPORT_CODE, code)
            .putString(KEY_DEVICE_TOKEN, deviceToken)
            .commit()
    }

    /** Remove all link data (un-pair). */
    fun clearLink() {
        prefs.edit()
            .remove(KEY_PASSPORT_CODE)
            .remove(KEY_DEVICE_TOKEN)
            .commit()
    }

    fun getPassportCode(): String? = prefs.getString(KEY_PASSPORT_CODE, null)

    fun getDeviceToken(): String? = prefs.getString(KEY_DEVICE_TOKEN, null)

    // ---- Offline event queue ------------------------------------------------

    /**
     * Append a JSON-encoded event string to the pending queue.
     * Events are stored as a JSON array of strings.
     */
    fun enqueueEvent(json: String) {
        val array = loadEventArray()
        array.put(json)
        prefs.edit()
            .putString(KEY_PENDING_EVENTS, array.toString())
            .commit()
    }

    /** Return all queued event JSON strings (oldest first). */
    fun dequeueEvents(): List<String> {
        val array = loadEventArray()
        return buildList {
            for (i in 0 until array.length()) {
                array.optString(i)?.takeIf { it.isNotBlank() }?.let(::add)
            }
        }
    }

    /** Remove every pending event. */
    fun clearEvents() {
        prefs.edit()
            .remove(KEY_PENDING_EVENTS)
            .commit()
    }

    private fun loadEventArray(): JSONArray {
        val raw = prefs.getString(KEY_PENDING_EVENTS, null)
        return if (raw.isNullOrBlank()) JSONArray() else runCatching { JSONArray(raw) }.getOrElse { JSONArray() }
    }

    companion object {
        private const val PREFS_FILE = "saaya_passport_prefs"
        private const val KEY_PASSPORT_CODE = "passport_code"
        private const val KEY_DEVICE_TOKEN = "device_token"
        private const val KEY_PENDING_EVENTS = "pending_events"
    }
}
