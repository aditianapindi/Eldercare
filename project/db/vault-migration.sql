-- GetSukoon Family Vault — Migration
-- Run this in Supabase SQL Editor AFTER the initial migration.sql
-- https://supabase.com/dashboard/project/idfnjnflrtodqqpzvbjo/sql/new

-- Add user_id to existing tables
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE reports ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- Allow authenticated users to read their own assessments
CREATE POLICY "Users can read own assessments"
  ON assessments FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to update their own assessments (for linking)
CREATE POLICY "Users can update own assessments"
  ON assessments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read their own reports
CREATE POLICY "Users can read own reports"
  ON reports FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Parents
CREATE TABLE parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Parent',
  age int,
  location text,
  living_situation text,
  conditions text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Doctors
CREATE TABLE doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES parents(id) ON DELETE SET NULL,
  name text NOT NULL,
  specialty text,
  hospital text,
  phone text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Medicines
CREATE TABLE medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES parents(id) ON DELETE SET NULL,
  name text NOT NULL,
  dosage text,
  frequency text,
  time_of_day text[] DEFAULT '{}',
  with_food boolean DEFAULT true,
  prescribed_by text,
  notes text,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Family Contacts
CREATE TABLE family_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text NOT NULL,
  phone text,
  relationship text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Daily Check-ins
CREATE TABLE checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES parents(id) ON DELETE SET NULL,
  checked_at date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  UNIQUE(user_id, parent_id, checked_at)
);

-- RLS
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own parents" ON parents FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own doctors" ON doctors FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own medicines" ON medicines FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own contacts" ON family_contacts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own checkins" ON checkins FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
