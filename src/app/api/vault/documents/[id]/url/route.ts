import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";

const BUCKET = "health-documents";
const SIGNED_URL_TTL_SECONDS = 60;

/** GET /api/vault/documents/[id]/url — returns a short-lived signed URL */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // RLS enforces that the caller can see this row
  const { data: row, error } = await auth.supabase
    .from("documents")
    .select("file_path, file_name, mime_type")
    .eq("id", id)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error: signError } = await auth.supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.file_path, SIGNED_URL_TTL_SECONDS);

  if (signError || !data) {
    return NextResponse.json({ error: signError?.message || "Failed to sign URL" }, { status: 500 });
  }

  return NextResponse.json({
    url: data.signedUrl,
    file_name: row.file_name,
    mime_type: row.mime_type,
  });
}
