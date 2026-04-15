import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";

/** GET — fetch saaya events for the authenticated user's passport codes.
 *  Query params:
 *    ?code=ABCD1234  — filter by specific passport code (optional)
 *    ?limit=50       — max events to return (default 50, max 200)
 */
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const codeFilter = url.searchParams.get("code");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);

  // Get user's passport codes
  let codesQuery = auth.supabase
    .from("passport_codes")
    .select("code, label, parent_id, claimed_at, revoked_at")
    .eq("owner_user_id", auth.user.id);

  if (codeFilter) {
    codesQuery = codesQuery.eq("code", codeFilter);
  }

  const { data: codes, error: codesErr } = await codesQuery;
  if (codesErr) return NextResponse.json({ error: codesErr.message }, { status: 500 });
  if (!codes || codes.length === 0) {
    return NextResponse.json({ events: [], devices: [] });
  }

  const codeList = codes.map((c) => c.code);

  // Fetch events and device registrations in parallel
  const [eventsRes, devicesRes] = await Promise.all([
    auth.supabase
      .from("saaya_events")
      .select(
        "id, passport_code, timestamp_millis, call_type, caller_classification, caller_label, sensitive_app_name, is_overlay_trigger, synced_at"
      )
      .in("passport_code", codeList)
      .order("timestamp_millis", { ascending: false })
      .limit(limit),
    auth.supabase
      .from("device_registrations")
      .select("passport_code, device_token, device_info, registered_at, last_seen_at")
      .in("passport_code", codeList),
  ]);

  if (eventsRes.error) return NextResponse.json({ error: eventsRes.error.message }, { status: 500 });
  if (devicesRes.error) return NextResponse.json({ error: devicesRes.error.message }, { status: 500 });

  return NextResponse.json({
    events: eventsRes.data || [],
    devices: (devicesRes.data || []).map((d) => ({
      ...d,
      // Online = last_seen_at within 30 minutes
      is_online: d.last_seen_at && Date.now() - new Date(d.last_seen_at).getTime() < 30 * 60 * 1000,
    })),
  });
}
