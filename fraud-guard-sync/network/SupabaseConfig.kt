package com.saaya.app.network

/**
 * Supabase project configuration.
 *
 * These are *public* values by design -- row-level security (RLS) and
 * the device_token header enforce access control, not the anon key.
 * Replace the placeholders before the first release build.
 */
object SupabaseConfig {

    // TODO: Replace with your Supabase project URL before release
    // For local testing with mock server, use: "http://10.0.2.2:54321"
    // (10.0.2.2 is the Android emulator's alias for host localhost)
    const val PROJECT_URL = "http://10.0.2.2:54321"

    // TODO: Replace with your Supabase anon (public) key before release
    const val ANON_KEY = "mock-anon-key"

    /** Base URL for Edge Functions. */
    const val FUNCTIONS_URL = "$PROJECT_URL/functions/v1"
}
