-- Saaya Downloads Tracking Migration
-- Run in Supabase SQL Editor
--
-- Tracks APK downloads with email capture.
-- When a user later signs up with the same email, user_id can be populated
-- to enable the "known downloader" flow in /vault/saaya.
--
-- Safe to re-run (uses IF NOT EXISTS, DROP POLICY IF EXISTS)

-- -----------------------------------------
-- 1. Table
-- -----------------------------------------
CREATE TABLE IF NOT EXISTS saaya_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  session_id text,
  source text,          -- 'homepage', 'saaya-page', 'safety-page', 'report'
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email, source)
);

-- -----------------------------------------
-- 2. Indexes
-- -----------------------------------------
CREATE INDEX IF NOT EXISTS idx_saaya_downloads_email ON saaya_downloads(email);
CREATE INDEX IF NOT EXISTS idx_saaya_downloads_user_id ON saaya_downloads(user_id);

-- -----------------------------------------
-- 3. RLS
-- -----------------------------------------
ALTER TABLE saaya_downloads ENABLE ROW LEVEL SECURITY;

-- Public insert (no auth required — download happens before signup)
DROP POLICY IF EXISTS "Public insert saaya downloads" ON saaya_downloads;
CREATE POLICY "Public insert saaya downloads" ON saaya_downloads FOR INSERT
  WITH CHECK (true);

-- Authenticated users can read their own downloads (matched by user_id)
DROP POLICY IF EXISTS "Users read own downloads" ON saaya_downloads;
CREATE POLICY "Users read own downloads" ON saaya_downloads FOR SELECT
  USING (auth.uid() = user_id);

-- -----------------------------------------
-- 4. Function: link_saaya_downloads(p_email, p_user_id)
--    Called after signup to link existing downloads to the new user.
--    Restricted: caller can only link downloads to their own account.
-- -----------------------------------------
CREATE OR REPLACE FUNCTION link_saaya_downloads(p_email text, p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  -- Prevent email hijacking: caller can only claim their own user_id
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'unauthorized: can only link downloads to your own account';
  END IF;

  UPDATE saaya_downloads
  SET user_id = p_user_id
  WHERE lower(email) = lower(p_email)
    AND user_id IS NULL;
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
