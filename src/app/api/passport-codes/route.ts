import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";
import { randomBytes } from "crypto";

// 8-char alphanumeric, no ambiguous chars (0/O/1/I/L excluded)
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generatePassportCode(): string {
  const bytes = randomBytes(8);
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join("");
}

/** GET — list passport codes for the authenticated user */
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: codes, error } = await auth.supabase
    .from("passport_codes")
    .select(
      "id, code, parent_id, label, created_at, expires_at, claimed_at, claimed_by_device, revoked_at"
    )
    .eq("owner_user_id", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // For claimed codes, fetch device registration info
  const claimedCodes = (codes || []).filter((c) => c.claimed_at);
  let devices: Record<string, { device_info: string | null; last_seen_at: string }> = {};

  if (claimedCodes.length > 0) {
    const { data: regs } = await auth.supabase
      .from("device_registrations")
      .select("passport_code, device_info, last_seen_at")
      .in("passport_code", claimedCodes.map((c) => c.code));

    for (const reg of regs || []) {
      devices[reg.passport_code] = {
        device_info: reg.device_info,
        last_seen_at: reg.last_seen_at,
      };
    }
  }

  return NextResponse.json({
    codes: (codes || []).map((c) => ({
      ...c,
      device: devices[c.code] || null,
    })),
  });
}

/** POST — create a new passport code */
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const label = typeof body.label === "string" ? body.label.trim().slice(0, 60) : null;
  const parent_id = typeof body.parent_id === "string" ? body.parent_id : null;

  // Generate unique code with retry
  let code: string = "";
  for (let i = 0; i < 5; i++) {
    code = generatePassportCode();
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
      parent_id,
      label,
    })
    .select("id, code, label, parent_id, created_at, expires_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** DELETE — revoke a passport code (by id) */
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
