import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getVaultOwnerId } from "@/lib/supabase-server";

const BUCKET = "health-documents";
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/heic",
  "image/heif",
]);
const ALLOWED_DOC_TYPES = new Set(["prescription", "test_report", "insurance", "other"]);

/** GET — list all documents in the caller's vault */
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await auth.supabase
    .from("documents")
    .select("id, parent_id, medical_event_id, doc_type, file_path, file_name, file_size, mime_type, notes, uploaded_at")
    .order("uploaded_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** POST — upload a file. Accepts multipart/form-data with:
 *   file         — the binary blob
 *   doc_type     — 'prescription' | 'test_report' | 'insurance' | 'other'
 *   parent_id    — uuid (optional)
 *   medical_event_id — uuid (optional)
 *   notes        — string (optional)
 */
export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: `File type not allowed: ${file.type}` }, { status: 415 });
  }

  const docType = String(form.get("doc_type") || "other");
  if (!ALLOWED_DOC_TYPES.has(docType)) {
    return NextResponse.json({ error: "Invalid doc_type" }, { status: 400 });
  }

  const parentId = form.get("parent_id");
  const medicalEventId = form.get("medical_event_id");
  const notes = form.get("notes");

  const ownerId = await getVaultOwnerId(auth);

  // Path: <owner_user_id>/<random>.<ext> — first folder matches RLS check
  const ext = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "bin";
  const randomId = crypto.randomUUID();
  const filePath = `${ownerId}/${randomId}.${ext}`;

  // Upload to Storage
  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await auth.supabase.storage
    .from(BUCKET)
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Insert metadata row
  const { data, error } = await auth.supabase
    .from("documents")
    .insert({
      user_id: ownerId,
      parent_id: parentId && typeof parentId === "string" ? parentId : null,
      medical_event_id: medicalEventId && typeof medicalEventId === "string" ? medicalEventId : null,
      doc_type: docType,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      notes: notes && typeof notes === "string" ? notes : null,
    })
    .select()
    .single();

  if (error) {
    // Rollback: remove the file we just uploaded
    await auth.supabase.storage.from(BUCKET).remove([filePath]);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/** DELETE — remove a document (row + storage object) */
export async function DELETE(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Fetch file_path first so we can delete from storage
  const { data: row, error: fetchError } = await auth.supabase
    .from("documents")
    .select("file_path")
    .eq("id", id)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error: deleteError } = await auth.supabase.from("documents").delete().eq("id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  // Best-effort storage cleanup — if it fails, the DB row is already gone
  await auth.supabase.storage.from(BUCKET).remove([row.file_path]);

  return NextResponse.json({ ok: true });
}
