-- GetSukoon — Care worries chip on assessments (session 10)
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/idfnjnflrtodqqpzvbjo/sql/new
--
-- Silent signal capture for the multi-select chip on the assessment page.
-- One column on the existing assessments row. No new tables, no RLS changes.
-- The assessments row already gets claimed by user_id via /api/link-session,
-- so this column travels with the user automatically at signup time.

ALTER TABLE assessments
  ADD COLUMN IF NOT EXISTS care_worries text[] NOT NULL DEFAULT '{}';
