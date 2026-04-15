package com.saaya.app.worker

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat
import androidx.work.Worker
import androidx.work.WorkerParameters
import com.saaya.app.network.SaayaSyncClient
import com.saaya.app.service.SaayaService
import com.saaya.app.util.LogTags
import com.saaya.app.util.PassportPreferences

class HeartbeatWorker(context: Context, params: WorkerParameters) : Worker(context, params) {
    override fun doWork(): Result {
        Log.d(LogTags.FG_DETECT, "Heartbeat: isRunning=${SaayaService.isRunning}")
        // Passport sync: flush offline queue + heartbeat
        val passportPrefs = PassportPreferences(applicationContext)
        if (passportPrefs.isLinked()) {
            try {
                val syncClient = SaayaSyncClient(passportPrefs)
                val flushed = syncClient.flushPendingEvents()
                if (flushed > 0) {
                    Log.d(LogTags.FG_DETECT, "Heartbeat: flushed $flushed pending events")
                }
                syncClient.sendHeartbeat()
                Log.d(LogTags.FG_DETECT, "Heartbeat: passport ping sent")
            } catch (t: Throwable) {
                Log.e(LogTags.FG_DETECT, "Heartbeat: passport sync failed: ${t.message}")
            }
        }
        if (!SaayaService.hasTelephonyPermission(applicationContext)) {
            Log.w(LogTags.FG_DETECT, "Heartbeat: skipping restart until phone permission is granted")
            return Result.success()
        }
        if (!SaayaService.isRunning) {
            Log.w(LogTags.FG_DETECT, "Heartbeat: service dead — restarting")
            try {
                ContextCompat.startForegroundService(
                    applicationContext,
                    Intent(applicationContext, SaayaService::class.java)
                )
            } catch (e: Exception) {
                Log.e(LogTags.FG_DETECT, "Heartbeat restart failed: ${e.message}")
            }
        }
        return Result.success()
    }
}
