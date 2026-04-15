-- GetSukoon — Passport Code Migration (Saaya Integration)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/idfnjnflrtodqqpzvbjo/sql/new
--
-- What this does:
-- 1. Adds passport_codes, device_registrations, saaya_events tables
-- 2. Adds SECURITY DEFINER functions: claim_passport_code, record_saaya_event, is_passport_owner
-- 3. RLS: owners read/manage codes; vault members can read codes; devices/events read-only for owners
-- 4. Edge functions (anon callers) use service role for writes
--
-- Safe to re-run (uses DROP POLICY IF EXISTS + CREATE OR REPLACE FUNCTION)

-- ─────────────────────────────────────────────
-- 1. Tables
-- ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS passport_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  parent_id uuid REFERENCES parents(id) ON DELETE SET NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '48 hours'),
  claimed_at timestamptz,
  claimed_by_device text,
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_passport_codes_owner ON passport_codes(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_passport_codes_code ON passport_codes(code);

CREATE TABLE IF NOT EXISTS device_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_code text NOT NULL REFERENCES passport_codes(code),
  device_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  device_info text,
  registered_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_registrations_code ON device_registrations(passport_code);
CREATE INDEX IF NOT EXISTS idx_device_registrations_token ON device_registrations(device_token);

CREATE TABLE IF NOT EXISTS saaya_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passport_code text NOT NULL REFERENCES passport_codes(code),
  device_token uuid NOT NULL REFERENCES device_registrations(device_token),
  client_event_id uuid UNIQUE,
  timestamp_millis bigint NOT NULL,
  call_type text NOT NULL,
  caller_classification text NOT NULL,
  caller_label text,
  sensitive_app_name text NOT NULL,
  is_overlay_trigger boolean DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saaya_events_code ON saaya_events(passport_code);
CREATE INDEX IF NOT EXISTS idx_saaya_events_device ON saaya_events(device_token);
CREATE INDEX IF NOT EXISTS idx_saaya_events_timestamp ON saaya_events(timestamp_millis DESC);

-- ─────────────────────────────────────────────
-- 2. Enable RLS
-- ─────────────────────────────────────────────

ALTER TABLE passport_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE saaya_events ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 3. Helper: is_passport_owner(code)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_passport_owner(p_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM passport_codes
    WHERE code = p_code
      AND owner_user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION is_passport_owner(text) TO authenticated;

-- ─────────────────────────────────────────────
-- 4. RLS Policies — passport_codes
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Owner selects passport codes" ON passport_codes;
CREATE POLICY "Owner selects passport codes" ON passport_codes FOR SELECT
  USING (auth.uid() = owner_user_id OR is_vault_member(owner_user_id));

DROP POLICY IF EXISTS "Owner inserts passport codes" ON passport_codes;
CREATE POLICY "Owner inserts passport codes" ON passport_codes FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owner updates passport codes revoked_at" ON passport_codes;
CREATE POLICY "Owner updates passport codes revoked_at" ON passport_codes FOR UPDATE
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Owner deletes passport codes" ON passport_codes;
CREATE POLICY "Owner deletes passport codes" ON passport_codes FOR DELETE
  USING (auth.uid() = owner_user_id);

-- ─────────────────────────────────────────────
-- 5. RLS Policies — device_registrations
--    Owner reads via join to passport_codes. No direct user writes.
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Owner reads device registrations" ON device_registrations;
CREATE POLICY "Owner reads device registrations" ON device_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM passport_codes
      WHERE code = device_registrations.passport_code
        AND owner_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- 6. RLS Policies — saaya_events
--    Owner reads via join to passport_codes. No direct user writes.
-- ─────────────────────────────────────────────

DROP POLICY IF EXISTS "Owner reads saaya events" ON saaya_events;
CREATE POLICY "Owner reads saaya events" ON saaya_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM passport_codes
      WHERE code = saaya_events.passport_code
        AND owner_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- 7. Claim function (SECURITY DEFINER, anon callers)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION claim_passport_code(p_code text, p_device_info text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_passport passport_codes%ROWTYPE;
  v_device device_registrations%ROWTYPE;
BEGIN
  -- Lock the row to serialize concurrent claims
  SELECT * INTO v_passport FROM passport_codes
  WHERE code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'invalid');
  END IF;

  IF v_passport.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'revoked');
  END IF;

  IF v_passport.expires_at <= now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  IF v_passport.claimed_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'already_claimed');
  END IF;

  -- Insert device registration
  INSERT INTO device_registrations (passport_code, device_info)
  VALUES (p_code, p_device_info)
  RETURNING * INTO v_device;

  -- Mark passport as claimed
  UPDATE passport_codes
  SET claimed_at = now(),
      claimed_by_device = p_device_info
  WHERE id = v_passport.id;

  RETURN jsonb_build_object('device_token', v_device.device_token);
END;
$$;

GRANT EXECUTE ON FUNCTION claim_passport_code(text, text) TO anon;

-- ─────────────────────────────────────────────
-- 8. Record event function (SECURITY DEFINER, anon callers)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION record_saaya_event(
  p_device_token uuid,
  p_client_event_id uuid,
  p_timestamp_millis bigint,
  p_call_type text,
  p_caller_classification text,
  p_caller_label text,
  p_sensitive_app_name text,
  p_is_overlay_trigger boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_device device_registrations%ROWTYPE;
  v_passport passport_codes%ROWTYPE;
  v_event_id uuid;
BEGIN
  -- Look up device
  SELECT * INTO v_device FROM device_registrations
  WHERE device_token = p_device_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'unknown_device');
  END IF;

  -- Check passport is not revoked
  SELECT * INTO v_passport FROM passport_codes
  WHERE code = v_device.passport_code;

  IF v_passport.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'passport_revoked');
  END IF;

  -- Insert event with dedup on client_event_id
  INSERT INTO saaya_events (
    passport_code, device_token, client_event_id,
    timestamp_millis, call_type, caller_classification,
    caller_label, sensitive_app_name, is_overlay_trigger
  ) VALUES (
    v_device.passport_code, p_device_token, p_client_event_id,
    p_timestamp_millis, p_call_type, p_caller_classification,
    p_caller_label, p_sensitive_app_name, p_is_overlay_trigger
  )
  ON CONFLICT (client_event_id) DO NOTHING
  RETURNING id INTO v_event_id;

  -- Update last_seen_at
  UPDATE device_registrations
  SET last_seen_at = now()
  WHERE device_token = p_device_token;

  -- If dedup hit, v_event_id will be NULL — still success
  IF v_event_id IS NULL THEN
    RETURN jsonb_build_object('event_id', null, 'dedup', true);
  END IF;

  RETURN jsonb_build_object('event_id', v_event_id);
END;
$$;

GRANT EXECUTE ON FUNCTION record_saaya_event(uuid, uuid, bigint, text, text, text, text, boolean) TO anon;
