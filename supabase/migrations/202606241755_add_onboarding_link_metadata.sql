alter table public.accounts
  add column if not exists onboarding_link_url text,
  add column if not exists onboarding_link_expires_at timestamptz,
  add column if not exists onboarding_link_generated_at timestamptz;
