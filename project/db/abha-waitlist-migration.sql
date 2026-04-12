-- GetSukoon — ABHA waitlist (Tier 1 placeholder)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/idfnjnflrtodqqpzvbjo/sql/new
--
-- ABHA = Ayushman Bharat Health Account, India's national digital health ID.
-- Real integration requires HIU registration + Consent Manager + FHIR APIs.
-- For MVP we ship a waitlist card; this table captures interest.

CREATE TABLE IF NOT EXISTS abha_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  interested_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE abha_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own abha waitlist" ON abha_waitlist;
CREATE POLICY "Users manage own abha waitlist" ON abha_waitlist FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
