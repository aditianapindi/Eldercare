import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { randomBytes } from "crypto";

const CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // 30 chars, no 0/O/1/I/L

/** GET — list passport codes + associated device registrations */
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase, user } = auth;

  const [codesRes, devicesRes] = await Promise.all([
    supabase
      .from("passport_codes")
      .select("id, code, parent_id, label, created_at, expires_at, claimed_at, claimed_by_device, revoked_at")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("device_registrations")
      .select("id, passport_code, device_token, device_info, registered_at, last_seen_at"),
      // RLS will filter to only codes owned by this user
  ]);

  if (codesRes.error) return NextResponse.json({ error: codesRes.error.message }, { status: 500 });
  if (devicesRes.error) return NextResponse.json({ error: devicesRes.error.message }, { status: 500 });

  // Check if user previously downloaded Saaya (by email match)
  let isKnownDownloader = false;
  try {
    const admin = getSupabaseAdmin();
    const { data: downloads } = await admin
      .from("saaya_downloads")
      .select("id")
      .eq("email", user.email?.toLowerCase() || "")
      .limit(1);
    isKnownDownloader = (downloads?.length ?? 0) > 0;

    // Link downloads to user if not already linked
    if (isKnownDownloader && user.email) {
      await admin.rpc("link_saaya_downloads", {
        p_email: user.email.toLowerCase(),
        p_user_id: user.id,
      }); // Non-critical, errors caught by outer try/catch
    }
  } catch {
    // saaya_downloads table may not exist yet — ignore
  }

  return NextResponse.json({
    codes: codesRes.data || [],
    devices: devicesRes.data || [],
    is_known_downloader: isKnownDownloader,
  });
}

/** POST — create a new passport code (single-use, 48h expiry) */
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const label = typeof body.label === "string" ? body.label.trim().slice(0, 60) : null;
  const parent_id = typeof body.parent_id === "string" ? body.parent_id : null;

  // Generate unique 8-char code with retry
  let code = "";
  for (let i = 0; i < 5; i++) {
    const bytes = randomBytes(8);
    code = Array.from(bytes).map(b => CHARSET[b % CHARSET.length]).join("");
    const { data: existing } = await auth.supabase
      .from("passport_codes")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!existing) break;
  }

  const { data, error } = await auth.supabase
    .from("passport_codes")
    .insert({
      owner_user_id: auth.user.id,
      code,
      label,
      parent_id,
    })
    .select("id, code, parent_id, label, created_at, expires_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** DELETE — revoke a passport code (soft delete via revoked_at) */
export async function DELETE(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await auth.supabase
    .from("passport_codes")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_user_id", auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
