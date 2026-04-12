-- GetSukoon tables
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/idfnjnflrtodqqpzvbjo/sql/new

-- Assessments: stores form submissions
create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  diagnostic_answers jsonb not null default '{}',
  diagnostic_score int not null default 0,
  parents jsonb default '{}',
  siblings jsonb default '{}',
  concern text default '',
  enrichment jsonb default '{}',
  created_at timestamptz not null default now()
);

-- Reports: stores generated care reports
create table if not exists reports (
  id text primary key,
  session_id text not null,
  assessment_id uuid references assessments(id),
  score int not null default 0,
  blind_spot_count int not null default 0,
  blind_spot_areas text[] default '{}',
  report_data jsonb not null,
  created_at timestamptz not null default now()
);

-- Waitlist: email capture from report page
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  report_id text references reports(id),
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table assessments enable row level security;
alter table reports enable row level security;
alter table waitlist enable row level security;

-- Public read for reports (shared links must work)
create policy "Reports are publicly readable"
  on reports for select
  using (true);

-- Public insert for all tables (anonymous users)
create policy "Anyone can create assessments"
  on assessments for insert
  with check (true);

create policy "Anyone can create reports"
  on reports for insert
  with check (true);

create policy "Anyone can join waitlist"
  on waitlist for insert
  with check (true);
