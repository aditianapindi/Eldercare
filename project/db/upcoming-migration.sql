-- GetSukoon — Upcoming / renewal dates migration
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/idfnjnflrtodqqpzvbjo/sql/new
--
-- Minimal additive change: gives financial_assets a renewal_date.
-- Upcoming medical appointments already use medical_events.event_date.
-- Upcoming medicine end-dates already use medicines.end_date.

ALTER TABLE financial_assets ADD COLUMN IF NOT EXISTS renewal_date date;

CREATE INDEX IF NOT EXISTS idx_financial_assets_renewal ON financial_assets(renewal_date)
  WHERE renewal_date IS NOT NULL;
