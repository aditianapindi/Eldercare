import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";
import { randomBytes } from "crypto";

/** GET — list active invites (unclaimed shares) + current members of the caller's vault */
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { supabase, user } = auth;

  const [sharesRes, membersRes] = await Promise.all([
    supabase
      .from("vault_shares")
      .select("id, token, label, role, created_at, expires_at, claimed_at, claimed_by, revoked_at")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("vault_members")
      .select("id, member_user_id, role, created_at")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  if (sharesRes.error) return NextResponse.json({ error: sharesRes.error.message }, { status: 500 });
  if (membersRes.error) return NextResponse.json({ error: membersRes.error.message }, { status: 500 });

  const allShares = sharesRes.data || [];
  const members = (membersRes.data || []).map((m) => {
    // Find the share this member claimed so we can display the label the owner set
    const claimedShare = allShares.find((s) => s.claimed_by === m.member_user_id);
    return {
      ...m,
      invite_label: claimedShare?.label || null,
    };
  });

  return NextResponse.json({
    shares: allShares,
    members,
  });
}

/** POST — create a new share link (single-use, 48h expiry) */
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const label = typeof body.label === "string" ? body.label.trim().slice(0, 60) : null;

  // 24 bytes = 32-char base64url token. Random enough to be unguessable.
  const token = randomBytes(24).toString("base64url");

  const { data, error } = await auth.supabase
    .from("vault_shares")
    .insert({
      owner_user_id: auth.user.id,
      token,
      role: "editor",
      label,
    })
    .select("id, token, label, role, created_at, expires_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** DELETE — revoke a share (by id) or remove a member (by member_id with ?type=member) */
export async function DELETE(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, type } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  if (type === "member") {
    const { error } = await auth.supabase
      .from("vault_members")
      .delete()
      .eq("id", id)
      .eq("owner_user_id", auth.user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Default: revoke a share
  const { error } = await auth.supabase
    .from("vault_shares")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_user_id", auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
