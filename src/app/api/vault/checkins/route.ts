import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getVaultOwnerId } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get recent check-ins (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await auth.supabase
    .from("checkins")
    .select("id, parent_id, checked_in_by, checked_at, note")
    .gte("checked_at", thirtyDaysAgo.toISOString().split("T")[0])
    .order("checked_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const ownerId = await getVaultOwnerId(auth);

  const { data, error } = await auth.supabase
    .from("checkins")
    .upsert(
      {
        user_id: ownerId,                 // vault owner, for RLS
        checked_in_by: auth.user.id,       // actual actor
        parent_id: body.parent_id || null,
        checked_at: body.date || new Date().toISOString().split("T")[0],
        note: body.note || null,
      },
      { onConflict: "checked_in_by,parent_id,checked_at" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
