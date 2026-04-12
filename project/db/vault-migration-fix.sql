-- Fix: Allow link-session API to read and claim unclaimed assessments/reports
-- Run this in Supabase SQL Editor
-- https://supabase.com/dashboard/project/idfnjnflrtodqqpzvbjo/sql/new

-- Allow reading unclaimed assessments (needed for session linking)
CREATE POLICY "Anyone can read unclaimed assessments"
  ON assessments FOR SELECT
  USING (user_id IS NULL);

-- Allow authenticated users to claim unclaimed assessments
CREATE POLICY "Authenticated users can claim assessments"
  ON assessments FOR UPDATE
  USING (user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to claim unclaimed reports
CREATE POLICY "Authenticated users can claim reports"
  ON reports FOR UPDATE
  USING (user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);
