package com.saaya.app.service

import android.Manifest
import android.app.Notification
import android.app.PendingIntent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.saaya.app.SaayaApp
import com.saaya.app.MainActivity
import com.saaya.app.R
import com.saaya.app.detection.ContactLookup
import com.saaya.app.detection.ForegroundAppMonitor
import com.saaya.app.detection.PhoneCallMonitor
import com.saaya.app.model.ActiveCall
import com.saaya.app.model.CallerClassification
import com.saaya.app.model.ProtectionEvent
import com.saaya.app.model.SensitiveApps
import com.saaya.app.tracker.CallStateTracker
import com.saaya.app.util.GuardianPreferences
import com.saaya.app.model.CallType
import com.saaya.app.util.LogTags
import com.saaya.app.util.PassportPreferences
import com.saaya.app.util.ProtectionEventStore
import com.saaya.app.network.SaayaSyncClient

class SaayaService : Service() {

    private val handler = Handler(Looper.getMainLooper())
    private lateinit var guardianPrefs: GuardianPreferences
    private lateinit var contactLookup: ContactLookup
    private lateinit var phoneCallMonitor: PhoneCallMonitor
    private lateinit var foregroundAppMonitor: ForegroundAppMonitor
    private lateinit var overlayManager: OverlayManager
    private lateinit var ttsWarning: TtsWarning
    private lateinit var smsAlerter: SmsAlerter
    private lateinit var protectionEventStore: ProtectionEventStore
    private lateinit var passportPrefs: PassportPreferences
    private lateinit var syncClient: SaayaSyncClient
    private var phoneMonitorStarted = false

    override fun onCreate() {
        super.onCreate()
        try {
            startAsForegroundService()
            isRunning = true
            Log.d(LogTags.FG_DETECT, "SaayaService CREATED")

            guardianPrefs = GuardianPreferences(this)
            contactLookup = ContactLookup(this, guardianPrefs)

            phoneCallMonitor = PhoneCallMonitor(
                context = this,
                contactLookup = contactLookup,
                onCallStarted = ::onCallStarted,
                onCallEnded = ::onCallEnded
            )

            foregroundAppMonitor = ForegroundAppMonitor(
                context = this,
                onAppChanged = ::onForegroundAppChanged
            )

            ttsWarning = TtsWarning(this)
            overlayManager = OverlayManager(this, guardianPrefs, handler)
            smsAlerter = SmsAlerter(this, guardianPrefs, handler)
            protectionEventStore = ProtectionEventStore(this)
            passportPrefs = PassportPreferences(this)
            syncClient = SaayaSyncClient(passportPrefs)

            ensurePhoneCallMonitorStarted("onCreate")
        } catch (t: Throwable) {
            Log.e(LogTags.FG_DETECT, "Service startup failed: ${t::class.simpleName} — ${t.message}", t)
            isRunning = false
            stopSelf()
        }
    }

    private fun onCallStarted(call: ActiveCall) {
        Log.d(
            LogTags.FG_DETECT,
            "onCallStarted type=${call.type} number=${call.number} classification=${call.classification}"
        )
        CallStateTracker.onCallStarted(call)
        if (call.classification != CallerClassification.KNOWN) {
            Log.d(LogTags.FG_DETECT, "Unknown/private call — starting foreground app polling")
            foregroundAppMonitor.start()
        } else {
            Log.d(LogTags.FG_DETECT, "Known contact call — no monitoring needed")
        }
    }

    private fun onCallEnded() {
        CallStateTracker.onCallEnded()
        foregroundAppMonitor.stop()
        overlayManager.dismiss()
        Log.d(LogTags.FG_DETECT, "Call ended — monitoring stopped")
    }

    private fun onForegroundAppChanged(packageName: String) {
        Log.d(LogTags.FG_DETECT, "onForegroundAppChanged package=$packageName")
        CallStateTracker.onForegroundAppChanged(packageName)
        val decision = CallStateTracker.evaluateTrigger()
        Log.d(LogTags.FG_DETECT, "Trigger decision for $packageName: $decision")
        if (decision == CallStateTracker.TriggerDecision.READY) {
            CallStateTracker.markTriggered(packageName)
            val app = SensitiveApps.get(packageName)
            onTrigger(packageName, app?.displayName ?: packageName)
        }
    }

    private fun onTrigger(packageName: String, appName: String) {
        val call = CallStateTracker.activeCall ?: return
        Log.w(
            LogTags.FG_DETECT,
            "=== FRAUD TRIGGER === app=$appName ($packageName) number=${call.number} type=${call.type}"
        )
        val event = ProtectionEvent(
            timestampMillis = System.currentTimeMillis(),
            callType = call.type,
            callerClassification = call.classification,
            callerLabel = call.number,
            sensitiveAppName = appName,
            isOverlayTrigger = true
        )
        protectionEventStore.recordEvent(event)
        if (passportPrefs.isLinked()) {
            Thread {
                try {
                    syncClient.syncEvent(event)
                } catch (t: Throwable) {
                    Log.e(LogTags.FG_DETECT, "Passport sync failed: ${t.message}")
                }
            }.start()
        }
        try {
            smsAlerter.sendAlert(call.number ?: "unknown", appName)
        } catch (t: Throwable) {
            Log.e(LogTags.FG_SMS, "Trigger SMS failed: ${t.message}", t)
        }
        try {
            ttsWarning.play()
        } catch (t: Throwable) {
            Log.e(LogTags.FG_DETECT, "Trigger TTS failed: ${t.message}", t)
        }
        try {
            overlayManager.show(packageName, appName, call.number ?: "")
        } catch (t: Throwable) {
            Log.e(LogTags.FG_OVERLAY, "Trigger overlay failed: ${t.message}", t)
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        ensurePhoneCallMonitorStarted(intent?.action ?: "onStartCommand")
        when (intent?.action) {
            ACTION_REFRESH_MONITORS -> {
                Log.d(LogTags.FG_DETECT, "Received refresh action for service monitors")
            }
            ACTION_WHATSAPP_CALL_STARTED -> {
                val name = intent.getStringExtra(EXTRA_CALLER_NAME) ?: "Unknown"
                val call = ActiveCall(
                    type = CallType.WHATSAPP_VOICE,
                    number = name,
                    classification = CallerClassification.UNKNOWN,
                    startTimeMillis = System.currentTimeMillis()
                )
                onCallStarted(call)
                Log.d(LogTags.FG_DETECT, "WhatsApp call started — caller: $name")
            }
            ACTION_WHATSAPP_CALL_ENDED -> {
                onCallEnded()
                Log.d(LogTags.FG_DETECT, "WhatsApp call ended via listener")
            }
        }
        return START_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        if (::phoneCallMonitor.isInitialized) {
            phoneCallMonitor.stop()
        }
        if (::foregroundAppMonitor.isInitialized) {
            foregroundAppMonitor.stop()
        }
        if (::ttsWarning.isInitialized) {
            ttsWarning.shutdown()
        }
        if (::overlayManager.isInitialized) {
            overlayManager.dismiss()
        }
        Log.d(LogTags.FG_DETECT, "SaayaService DESTROYED")
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun ensurePhoneCallMonitorStarted(reason: String) {
        if (!::phoneCallMonitor.isInitialized) return
        if (phoneMonitorStarted) return
        if (!hasTelephonyPermission()) {
            Log.w(LogTags.FG_DETECT, "Skipping phone listener registration ($reason): READ_PHONE_STATE not granted")
            return
        }
        phoneMonitorStarted = phoneCallMonitor.start()
        if (phoneMonitorStarted) {
            Log.d(LogTags.FG_DETECT, "Phone listener registered ($reason)")
        } else {
            Log.w(LogTags.FG_DETECT, "Phone listener registration failed ($reason)")
        }
    }

    private fun hasTelephonyPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED
    }

    private fun startAsForegroundService() {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            ServiceCompat.startForeground(
                this,
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun buildNotification(): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this, 0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, SaayaApp.NOTIFICATION_CHANNEL_ID)
            .setContentTitle(getString(R.string.service_notification_title))
            .setContentText(getString(R.string.service_notification_text))
            .setSmallIcon(R.drawable.ic_shield)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    companion object {
        const val NOTIFICATION_ID = 1001
        const val ACTION_REFRESH_MONITORS = "com.saaya.ACTION_REFRESH_MONITORS"
        const val ACTION_WHATSAPP_CALL_STARTED = "com.saaya.ACTION_WHATSAPP_CALL_STARTED"
        const val ACTION_WHATSAPP_CALL_ENDED = "com.saaya.ACTION_WHATSAPP_CALL_ENDED"
        const val EXTRA_CALLER_NAME = "caller_name"
        fun hasTelephonyPermission(context: android.content.Context): Boolean {
            return ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.READ_PHONE_STATE
            ) == PackageManager.PERMISSION_GRANTED
        }
        @Volatile var isRunning = false
            private set
    }
}
