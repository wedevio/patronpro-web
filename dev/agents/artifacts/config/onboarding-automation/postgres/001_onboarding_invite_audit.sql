create table if not exists onboarding_invite_audit (
  id text primary key,
  created_at timestamptz not null,
  mode text not null check (mode in ('dry-run')),
  client_name text not null,
  business_name text not null,
  client_email text not null,
  meeting_title text not null,
  meeting_start timestamptz not null,
  meeting_end timestamptz not null,
  meeting_timezone text not null,
  join_url text,
  ics_sha256 text not null,
  payload jsonb not null
);
