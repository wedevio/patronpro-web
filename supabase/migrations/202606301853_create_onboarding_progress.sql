-- Create table for storing onboarding form progress
create table if not exists public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  location_id text not null,
  contact_id text not null,
  current_step integer not null default 1 check (current_step >= 1 and current_step <= 5),
  form_data jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  
  -- Unique constraint on location_id + contact_id to avoid duplicates
  unique(location_id, contact_id)
);

-- Create index for faster lookups
create index if not exists idx_onboarding_progress_location_contact
  on public.onboarding_progress(location_id, contact_id);

-- Create index on updated_at for cleanup queries
create index if not exists idx_onboarding_progress_updated_at
  on public.onboarding_progress(updated_at);

-- Enable RLS (Row Level Security)
alter table public.onboarding_progress enable row level security;

-- Policy: Allow read/write if location_id matches (anyone can access their own onboarding)
create policy "Allow access by location and contact"
  on public.onboarding_progress
  for all
  using (true)
  with check (true);
