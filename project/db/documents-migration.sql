-- GetSukoon — Health Documents Migration
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/idfnjnflrtodqqpzvbjo/sql/new
--
-- Prereq: run share-migration.sql FIRST — this uses is_vault_member()
--
-- Storage bucket 'health-documents' must be created manually in the dashboard:
--   1. Dashboard → Storage → New bucket
--   2. Name: health-documents
--   3. Public: OFF (private — we use signed URLs)
--   4. File size limit: 10 MB
--   5. Allowed MIME types: application/pdf, image/jpeg, image/png, image/heic, image/heif

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES parents(id) ON DELETE SET NULL,
  medical_event_id uuid REFERENCES medical_events(id) ON DELETE SET NULL,
  doc_type text NOT NULL,  -- 'prescription' | 'test_report' | 'insurance' | 'other'
  file_path text NOT NULL, -- path inside the 'health-documents' bucket
  file_name text NOT NULL,
  file_size int NOT NULL,
  mime_type text NOT NULL,
  notes text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_parent ON documents(parent_id);
CREATE INDEX IF NOT EXISTS idx_documents_event ON documents(medical_event_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vault access documents" ON documents;
CREATE POLICY "Vault access documents" ON documents FOR ALL
  USING (auth.uid() = user_id OR is_vault_member(user_id))
  WITH CHECK (auth.uid() = user_id OR is_vault_member(user_id));

-- ─────────────────────────────────────────────
-- Storage RLS for the 'health-documents' bucket
-- ─────────────────────────────────────────────
-- We namespace files under <user_id>/<doc_id>.<ext> so RLS can parse
-- the first folder segment as the owning user_id.

DROP POLICY IF EXISTS "Vault access storage health-documents" ON storage.objects;
CREATE POLICY "Vault access storage health-documents" ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'health-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_vault_member(((storage.foldername(name))[1])::uuid)
    )
  )
  WITH CHECK (
    bucket_id = 'health-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_vault_member(((storage.foldername(name))[1])::uuid)
    )
  );
