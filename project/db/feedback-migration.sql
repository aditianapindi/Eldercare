-- Feedback table for NPS-style ratings + free-form comments
create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  score smallint not null check (score between 0 and 10),
  comment text,
  page text not null,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Allow anyone (anon or authed) to insert feedback
alter table feedback enable row level security;

create policy "Anyone can submit feedback"
  on feedback for insert
  with check (true);

-- Only service role can read feedback (admin dashboard)
create policy "Service role can read feedback"
  on feedback for select
  using (auth.role() = 'service_role');
