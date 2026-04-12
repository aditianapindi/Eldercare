import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";

/** GET — has this user joined the ABHA waitlist? */
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await auth.supabase
    .from("abha_waitlist")
    .select("id, interested_at")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  return NextResponse.json({ joined: !!data, interested_at: data?.interested_at ?? null });
}

/** POST — join the waitlist (idempotent) */
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const email = auth.user.email;
  if (!email) {
    return NextResponse.json({ error: "No email on account" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("abha_waitlist")
    .upsert(
      { user_id: auth.user.id, email },
      { onConflict: "user_id" }
    )
    .select("id, interested_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ joined: true, interested_at: data.interested_at });
}
