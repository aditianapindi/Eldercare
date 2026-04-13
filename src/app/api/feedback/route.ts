import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { score, comment, page } = await req.json();

  if (typeof score !== "number" || score < 0 || score > 10) {
    return NextResponse.json({ error: "Score must be 0-10" }, { status: 400 });
  }

  if (!page) {
    return NextResponse.json({ error: "Page required" }, { status: 400 });
  }

  // Try to get user ID from auth header if present
  let userId: string | null = null;
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    userId = data.user?.id ?? null;
  }

  const { error } = await supabase.from("feedback").insert({
    score,
    comment: comment?.trim() || null,
    page,
    user_id: userId,
  });

  if (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
