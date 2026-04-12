import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getVaultOwnerId } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await auth.supabase
    .from("financial_assets")
    .select("id, parent_id, asset_type, institution, description, status, notes, renewal_date, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const ownerId = await getVaultOwnerId(auth);
  const { data, error } = await auth.supabase
    .from("financial_assets")
    .insert({
      user_id: ownerId,
      parent_id: body.parent_id || null,
      asset_type: body.asset_type,
      institution: body.institution || null,
      description: body.description || null,
      status: body.status || "unknown",
      notes: body.notes || null,
      renewal_date: body.renewal_date || null,
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

  const { error } = await auth.supabase.from("financial_assets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
