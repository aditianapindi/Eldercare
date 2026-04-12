-- GetSukoon — Vault Sharing Migration
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/idfnjnflrtodqqpzvbjo/sql/new
--
-- What this does:
-- 1. Adds vault_members + vault_shares tables
-- 2. Adds a SECURITY DEFINER function to claim invites safely
-- 3. Rewrites RLS on every vault table so members of an owner's vault
--    can read AND write within that vault
-- 4. Backwards-compatible: owners see/do exactly what they did before
--
-- Safe to re-run (uses DROP POLICY IF EXISTS + CREATE OR REPLACE FUNCTION)

-- ─────────────────────────────────────────────
-- 1. Sharing tables
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vault_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'editor',  -- 'editor' | 'viewer' (viewer reserved, not enforced in MVP)
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_user_id, member_user_id)
);

CREATE INDEX IF NOT EXISTS idx_vault_members_owner ON vault_members(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_vault_members_member ON vault_members(member_user_id);

CREATE TABLE IF NOT EXISTS vault_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'editor',
  label text,  -- e.g. "Brother Ravi"
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  claimed_at timestamptz,
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_vault_shares_owner ON vault_shares(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_vault_shares_token ON vault_shares(token);

ALTER TABLE vault_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner or member reads membership" ON vault_members;
CREATE POLICY "Owner or member reads membership" ON vault_members FOR SELECT
  USING (auth.uid() = owner_user_id OR auth.uid() = member_user_id);

DROP POLICY IF EXISTS "Owner revokes membership" ON vault_members;
CREATE POLICY "Owner revokes membership" ON vault_members FOR DELETE
  USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Member leaves vault" ON vault_members;
CREATE POLICY "Member leaves vault" ON vault_members FOR DELETE
  USING (auth.uid() = member_user_id);

DROP POLICY IF EXISTS "Owner manages shares" ON vault_shares;
CREATE POLICY "Owner manages shares" ON vault_shares FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- ─────────────────────────────────────────────
-- 2. Claim function (SECURITY DEFINER, safe insert path)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION claim_vault_share(share_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share vault_shares%ROWTYPE;
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT * INTO v_share FROM vault_shares
  WHERE token = share_token
    AND claimed_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid_or_expired');
  END IF;

  IF v_share.owner_user_id = v_user_id THEN
    RETURN jsonb_build_object('error', 'cannot_join_own_vault');
  END IF;

  -- Idempotent: already a member? just mark share claimed
  IF EXISTS (
    SELECT 1 FROM vault_members
    WHERE owner_user_id = v_share.owner_user_id AND member_user_id = v_user_id
  ) THEN
    UPDATE vault_shares SET claimed_at = now(), claimed_by = v_user_id WHERE id = v_share.id;
    RETURN jsonb_build_object('ok', true, 'already_member', true, 'owner_user_id', v_share.owner_user_id);
  END IF;

  INSERT INTO vault_members (owner_user_id, member_user_id, role)
  VALUES (v_share.owner_user_id, v_user_id, v_share.role);

  UPDATE vault_shares SET claimed_at = now(), claimed_by = v_user_id WHERE id = v_share.id;

  RETURN jsonb_build_object('ok', true, 'owner_user_id', v_share.owner_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION claim_vault_share(text) TO authenticated;

-- ─────────────────────────────────────────────
-- 3. Helper: is_vault_member(owner_id)
--    Used in every policy below. Inline EXISTS works but this reads cleaner.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_vault_member(target_owner uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vault_members
    WHERE owner_user_id = target_owner
      AND member_user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION is_vault_member(uuid) TO authenticated;

-- ─────────────────────────────────────────────
-- 4. Rewrite RLS on every vault table
--    Pattern: user owns the row OR is a member of the owning user's vault
-- ─────────────────────────────────────────────

-- PARENTS
DROP POLICY IF EXISTS "Users manage own parents" ON parents;
DROP POLICY IF EXISTS "Vault access parents" ON parents;
CREATE POLICY "Vault access parents" ON parents FOR ALL
  USING (auth.uid() = user_id OR is_vault_member(user_id))
  WITH CHECK (auth.uid() = user_id OR is_vault_member(user_id));

-- DOCTORS
DROP POLICY IF EXISTS "Users manage own doctors" ON doctors;
DROP POLICY IF EXISTS "Vault access doctors" ON doctors;
CREATE POLICY "Vault access doctors" ON doctors FOR ALL
  USING (auth.uid() = user_id OR is_vault_member(user_id))
  WITH CHECK (auth.uid() = user_id OR is_vault_member(user_id));

-- MEDICINES
DROP POLICY IF EXISTS "Users manage own medicines" ON medicines;
DROP POLICY IF EXISTS "Vault access medicines" ON medicines;
CREATE POLICY "Vault access medicines" ON medicines FOR ALL
  USING (auth.uid() = user_id OR is_vault_member(user_id))
  WITH CHECK (auth.uid() = user_id OR is_vault_member(user_id));

-- MEDICAL_EVENTS  (table was added ad-hoc; if missing the DROPs are no-ops)
DROP POLICY IF EXISTS "Users manage own medical_events" ON medical_events;
DROP POLICY IF EXISTS "Vault access medical_events" ON medical_events;
CREATE POLICY "Vault access medical_events" ON medical_events FOR ALL
  USING (auth.uid() = user_id OR is_vault_member(user_id))
  WITH CHECK (auth.uid() = user_id OR is_vault_member(user_id));

-- FAMILY_CONTACTS
DROP POLICY IF EXISTS "Users manage own contacts" ON family_contacts;
DROP POLICY IF EXISTS "Vault access contacts" ON family_contacts;
CREATE POLICY "Vault access contacts" ON family_contacts FOR ALL
  USING (auth.uid() = user_id OR is_vault_member(user_id))
  WITH CHECK (auth.uid() = user_id OR is_vault_member(user_id));

-- CHECKINS
DROP POLICY IF EXISTS "Users manage own checkins" ON checkins;
DROP POLICY IF EXISTS "Vault access checkins" ON checkins;
CREATE POLICY "Vault access checkins" ON checkins FOR ALL
  USING (auth.uid() = user_id OR is_vault_member(user_id))
  WITH CHECK (auth.uid() = user_id OR is_vault_member(user_id));

-- FINANCIAL_ASSETS
DROP POLICY IF EXISTS "Users manage own assets" ON financial_assets;
DROP POLICY IF EXISTS "Vault access assets" ON financial_assets;
CREATE POLICY "Vault access assets" ON financial_assets FOR ALL
  USING (auth.uid() = user_id OR is_vault_member(user_id))
  WITH CHECK (auth.uid() = user_id OR is_vault_member(user_id));

-- EXPENSES
DROP POLICY IF EXISTS "Users manage own expenses" ON expenses;
DROP POLICY IF EXISTS "Vault access expenses" ON expenses;
CREATE POLICY "Vault access expenses" ON expenses FOR ALL
  USING (auth.uid() = user_id OR is_vault_member(user_id))
  WITH CHECK (auth.uid() = user_id OR is_vault_member(user_id));

-- REPORTS  (members can read, not regenerate)
DROP POLICY IF EXISTS "Vault access reports select" ON reports;
CREATE POLICY "Vault access reports select" ON reports FOR SELECT
  USING (
    true  -- reports remain publicly readable by id (share links still work)
  );

-- ASSESSMENTS  (members can read owner's assessment)
DROP POLICY IF EXISTS "Vault access assessments select" ON assessments;
CREATE POLICY "Vault access assessments select" ON assessments FOR SELECT
  USING (
    user_id IS NULL
    OR auth.uid() = user_id
    OR is_vault_member(user_id)
  );
