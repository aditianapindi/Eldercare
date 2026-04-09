import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await auth.supabase
    .from("medicines")
    .select("id, parent_id, name, dosage, frequency, time_of_day, with_food, prescribed_by, notes, active, is_lifelong, end_date, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await auth.supabase
    .from("medicines")
    .insert({
      user_id: auth.user.id,
      name: body.name,
      dosage: body.dosage || null,
      frequency: body.frequency || null,
      time_of_day: body.time_of_day || [],
      with_food: body.with_food ?? true,
      prescribed_by: body.prescribed_by || null,
      parent_id: body.parent_id || null,
      notes: body.notes || null,
      is_lifelong: body.is_lifelong ?? true,
      end_date: body.end_date || null,
    })
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

  // Soft delete — mark as inactive
  const { error } = await auth.supabase
    .from("medicines")
    .update({ active: false })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
