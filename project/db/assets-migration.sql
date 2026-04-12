-- Financial Assets table for the Family Vault
-- Tracks what financial assets parents have (not amounts or account numbers)

CREATE TABLE financial_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES parents(id) ON DELETE SET NULL,
  asset_type text NOT NULL,
  institution text,
  description text,
  status text DEFAULT 'unknown',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE financial_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own assets" ON financial_assets FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
