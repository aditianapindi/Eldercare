-- GetSukoon — Check-ins: per-user within shared vaults
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/idfnjnflrtodqqpzvbjo/sql/new
--
-- Problem: checkins unique constraint was (user_id, parent_id, checked_at).
-- Since shared-vault writes set user_id = owner's id, a sibling checking in
-- after the owner got blocked by the constraint. They couldn't check in at all.
--
-- Fix:
-- 1. Add checked_in_by column — the ACTUAL user who clicked the button
--    (separate from user_id, which is the vault owner for RLS consistency)
-- 2. Backfill: existing rows were created by the owner, so checked_in_by = user_id
-- 3. Drop the old unique constraint
-- 4. Add a new unique constraint on (checked_in_by, parent_id, checked_at)
--    → same user can't double-click, different users in same vault can both check in

-- Step 1: Add the column
ALTER TABLE checkins ADD COLUMN IF NOT EXISTS checked_in_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 2: Backfill existing rows
UPDATE checkins SET checked_in_by = user_id WHERE checked_in_by IS NULL;

-- Step 3: Drop the old unique constraint (dynamic name — Supabase auto-named it)
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'public.checkins'::regclass
    AND contype = 'u'
    AND pg_get_constraintdef(oid) LIKE '%(user_id, parent_id, checked_at)%';

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE checkins DROP CONSTRAINT %I', con_name);
    RAISE NOTICE 'Dropped old unique constraint: %', con_name;
  ELSE
    RAISE NOTICE 'No old constraint found (may already be fixed)';
  END IF;
END $$;

-- Step 4: Add the new unique index (prevents same user double-clicking a parent on same day)
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_actor_parent_date
  ON checkins(checked_in_by, parent_id, checked_at);
