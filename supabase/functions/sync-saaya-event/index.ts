import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const deviceToken = req.headers.get("x-device-token");
  if (!deviceToken) {
    return new Response(JSON.stringify({ error: "missing_device_token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const {
      client_event_id,
      timestamp_millis,
      call_type,
      caller_classification,
      caller_label,
      sensitive_app_name,
      is_overlay_trigger,
    } = body;

    if (!timestamp_millis || !call_type || !caller_classification || !sensitive_app_name) {
      return new Response(JSON.stringify({ error: "missing_required_fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("record_saaya_event", {
      p_device_token: deviceToken,
      p_client_event_id: client_event_id || null,
      p_timestamp_millis: timestamp_millis,
      p_call_type: call_type,
      p_caller_classification: caller_classification,
      p_caller_label: caller_label || null,
      p_sensitive_app_name: sensitive_app_name,
      p_is_overlay_trigger: is_overlay_trigger ?? true,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (data?.error) {
      return new Response(JSON.stringify(data), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "invalid_request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
