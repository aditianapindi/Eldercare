-- Page views tracking for analytics
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/idfnjnflrtodqqpzvbjo/sql/new

create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  user_id uuid,
  page text not null,
  referrer text,
  source text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table page_views enable row level security;

-- Allow anonymous inserts (tracking is best-effort, no auth required)
create policy "Anyone can track page views"
  on page_views for insert
  with check (true);

-- No SELECT policy — admin reads via service-role key which bypasses RLS
