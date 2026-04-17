-- Emergency contact flag migration
-- Promotes "Emergency" from a mutually-exclusive role to a boolean flag,
-- so any contact (Family, Neighbor, Doctor, etc.) can also be marked as emergency.

-- Step 1: Add the is_emergency column
ALTER TABLE family_contacts
  ADD COLUMN IF NOT EXISTS is_emergency boolean NOT NULL DEFAULT false;

-- Step 2: Migrate existing "emergency" role contacts
-- Sets the flag and changes role to "other" (since we don't know the actual relationship)
UPDATE family_contacts
  SET is_emergency = true, role = 'other'
  WHERE role = 'emergency';
