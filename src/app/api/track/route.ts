import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { session_id, page, referrer, source, user_id } = body;

  if (!session_id || !page) {
    return NextResponse.json({ error: "session_id and page required" }, { status: 400 });
  }

  await supabase.from("page_views").insert({
    session_id,
    page,
    referrer: referrer || null,
    source: source || null,
    user_id: user_id || null,
  });

  return NextResponse.json({ ok: true });
}
