import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const APK_URL = "https://github.com/OrangeAKA/saaya/releases/latest/download/saaya.apk";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { email, session_id, source } = body;

  if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  // Upsert: same email+source updates timestamp instead of creating duplicates.
  // This replaces in-memory rate limiting (which doesn't work on serverless).
  const { error } = await supabase.from("saaya_downloads").upsert(
    {
      email: email.trim().toLowerCase(),
      session_id: session_id || null,
      source: source || null,
    },
    { onConflict: "email,source" }
  );

  if (error) {
    console.error("[saaya-download] insert failed:", error.message);
  }

  return NextResponse.json({ url: APK_URL });
}
