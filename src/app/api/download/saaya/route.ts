import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const APK_URL = "https://github.com/OrangeAKA/saaya/releases/latest/download/saaya.apk";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Basic rate limiting: 10 downloads per IP per hour
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) return false;
  return entry.count >= RATE_LIMIT_MAX;
}

function recordRequest(ip: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
  } else {
    entry.count++;
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

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

  recordRequest(ip);

  // Insert download record
  await supabase.from("saaya_downloads").insert({
    email: email.trim().toLowerCase(),
    session_id: session_id || null,
    source: source || null,
  });

  return NextResponse.json({ url: APK_URL });
}
