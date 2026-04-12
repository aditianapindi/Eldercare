-- Add source tracking column to assessments
-- Tracks where the user came from: 'direct', 'safety', 'fraudguard', etc.
-- Run this on production Supabase BEFORE deploying the updated code.

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS source text DEFAULT NULL;
