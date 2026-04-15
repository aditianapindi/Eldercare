package com.saaya.app.util

import android.os.Build

object DeviceInfo {

    /**
     * Human-readable device summary, e.g. "Samsung Galaxy A14, Android 13".
     */
    fun summary(): String {
        val manufacturer = Build.MANUFACTURER.replaceFirstChar { it.uppercaseChar() }
        val model = Build.MODEL
        val androidVersion = Build.VERSION.RELEASE

        // If the model already starts with the manufacturer name, don't duplicate it.
        val device = if (model.startsWith(manufacturer, ignoreCase = true)) {
            model
        } else {
            "$manufacturer $model"
        }
        return "$device, Android $androidVersion"
    }
}
