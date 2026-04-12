import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getVaultOwnerId } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await auth.supabase
    .from("parents")
    .select("id, label, age, location, living_situation, conditions, created_at, updated_at")
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const ownerId = await getVaultOwnerId(auth);
  const { data, error } = await auth.supabase
    .from("parents")
    .insert({
      user_id: ownerId,
      label: body.label || "Parent",
      age: body.age || null,
      location: body.location || null,
      living_situation: body.living_situation || null,
      conditions: body.conditions || [],
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("parents")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await auth.supabase.from("parents").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
