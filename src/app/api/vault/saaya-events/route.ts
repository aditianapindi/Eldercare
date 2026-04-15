import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";

/** GET — fetch saaya events for dashboard (RLS filters via passport_codes join) */
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const passportCode = searchParams.get("passport_code");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 200);

  let query = auth.supabase
    .from("saaya_events")
    .select("id, passport_code, device_token, client_event_id, timestamp_millis, call_type, caller_classification, caller_label, sensitive_app_name, is_overlay_trigger, synced_at")
    .order("timestamp_millis", { ascending: false })
    .limit(limit);

  if (passportCode) {
    query = query.eq("passport_code", passportCode);
  }

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data || [] });
}
