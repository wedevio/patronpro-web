-- ppweb-0ka.5 onboarding persistence core
-- verification_tier_expected: static-only in this worktree unless psql is available

create table if not exists onboarding_clients (
  id varchar(40) primary key check (id ~ '^cli_[0-9A-HJKMNP-TV-Z]{26}$'),
  ghl_contact_id text null check (ghl_contact_id is null or length(ghl_contact_id) > 0),
  display_name text null,
  email text null,
  phone text null,
  source_payload jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  anonymized_at timestamptz null,
  constraint onboarding_clients_ghl_contact_id_unique unique (ghl_contact_id)
);

create table if not exists onboarding_meetings (
  id varchar(40) primary key check (id ~ '^mtg_[0-9A-HJKMNP-TV-Z]{26}$'),
  client_id varchar(40) not null references onboarding_clients(id) on delete restrict,
  ghl_appointment_id text null check (ghl_appointment_id is null or length(ghl_appointment_id) > 0),
  meeting_source text not null check (meeting_source in ('ghl', 'manual', 'system')),
  status text not null check (status in ('scheduled', 'rescheduled', 'cancelled', 'completed', 'no-show', 'blocked')),
  scheduled_start_at timestamptz null,
  scheduled_end_at timestamptz null,
  timezone text null,
  replaced_by_id varchar(40) null references onboarding_meetings(id) on delete set null,
  source_payload jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  anonymized_at timestamptz null,
  constraint onboarding_meetings_ghl_appointment_id_unique unique (ghl_appointment_id),
  constraint onboarding_meetings_time_order check (
    scheduled_start_at is null
    or scheduled_end_at is null
    or scheduled_end_at > scheduled_start_at
  )
);

create table if not exists onboarding_calendar_invites (
  id varchar(40) primary key check (id ~ '^inv_[0-9A-HJKMNP-TV-Z]{26}$'),
  meeting_id varchar(40) not null references onboarding_meetings(id) on delete restrict,
  invite_source text not null check (invite_source in ('calendar-link', 'google-calendar-api', 'manual', 'system')),
  artifact_kind text not null check (artifact_kind in ('ics', 'google-calendar-event', 'calendar-url', 'manual-note')),
  title text null,
  starts_at timestamptz null,
  ends_at timestamptz null,
  timezone text null,
  redacted_payload jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_calendar_invites_time_order check (
    starts_at is null
    or ends_at is null
    or ends_at > starts_at
  )
);

create table if not exists onboarding_calendar_provider_links (
  id varchar(40) primary key check (id ~ '^cpl_[0-9A-HJKMNP-TV-Z]{26}$'),
  invite_id varchar(40) not null references onboarding_calendar_invites(id) on delete cascade,
  provider text not null check (provider in ('google-calendar', 'calendar-link', 'manual')),
  external_calendar_id text null check (external_calendar_id is null or length(external_calendar_id) > 0),
  external_event_id text null check (external_event_id is null or length(external_event_id) > 0),
  status text not null check (status in ('active', 'disconnected', 'revoked', 'error')),
  redacted_provider_payload jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_provider_links_invite_provider_calendar_unique unique (
    invite_id,
    provider,
    external_calendar_id
  )
);

create table if not exists onboarding_email_previews (
  id varchar(40) primary key check (id ~ '^eml_[0-9A-HJKMNP-TV-Z]{26}$'),
  meeting_id varchar(40) not null references onboarding_meetings(id) on delete restrict,
  meeting_version_id varchar(40) null references onboarding_meetings(id) on delete set null,
  subject text not null,
  body_text text not null,
  body_html text null,
  preview_status text not null check (preview_status in ('draft', 'approved', 'superseded', 'blocked')),
  redacted_context jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists onboarding_send_attempts (
  id varchar(40) primary key check (id ~ '^snd_[0-9A-HJKMNP-TV-Z]{26}$'),
  meeting_id varchar(40) not null references onboarding_meetings(id) on delete restrict,
  invite_id varchar(40) null references onboarding_calendar_invites(id) on delete set null,
  email_preview_id varchar(40) null references onboarding_email_previews(id) on delete set null,
  attempt_no integer not null check (attempt_no >= 1),
  run_mode text not null check (run_mode in ('dry-run', 'approved-live')),
  status text not null check (status in ('draft', 'queued', 'sent', 'failed', 'blocked')),
  state_version integer not null default 0 check (state_version >= 0),
  provider text null check (provider is null or provider in ('gmail', 'google-calendar', 'ghl', 'manual', 'system')),
  redacted_request jsonb null,
  redacted_response jsonb null,
  error_code text null,
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint onboarding_send_attempts_meeting_attempt_unique unique (meeting_id, attempt_no)
);

create table if not exists onboarding_audit_events (
  id varchar(40) primary key check (id ~ '^aud_[0-9A-HJKMNP-TV-Z]{26}$'),
  entity_type text not null check (
    entity_type in ('client', 'meeting', 'invite', 'provider_link', 'email_preview', 'send_attempt')
  ),
  entity_id varchar(40) not null,
  audit_source text not null check (audit_source in ('ghl', 'manual', 'system', 'google-calendar-api')),
  event_type text not null,
  run_mode text null check (run_mode is null or run_mode in ('dry-run', 'approved-live')),
  message text null,
  redacted_payload jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists onboarding_clients_ghl_contact_id_idx
  on onboarding_clients (ghl_contact_id);

create index if not exists onboarding_meetings_client_id_idx
  on onboarding_meetings (client_id);

create index if not exists onboarding_meetings_ghl_appointment_id_idx
  on onboarding_meetings (ghl_appointment_id);

create index if not exists onboarding_meetings_scheduled_start_at_idx
  on onboarding_meetings (scheduled_start_at);

create index if not exists onboarding_meetings_replaced_by_id_idx
  on onboarding_meetings (replaced_by_id);

create index if not exists onboarding_calendar_invites_meeting_id_idx
  on onboarding_calendar_invites (meeting_id);

create index if not exists onboarding_provider_links_invite_id_idx
  on onboarding_calendar_provider_links (invite_id);

create index if not exists onboarding_provider_links_provider_calendar_idx
  on onboarding_calendar_provider_links (provider, external_calendar_id);

create index if not exists onboarding_email_previews_meeting_id_idx
  on onboarding_email_previews (meeting_id);

create index if not exists onboarding_email_previews_meeting_version_id_idx
  on onboarding_email_previews (meeting_version_id);

create index if not exists onboarding_email_previews_preview_status_idx
  on onboarding_email_previews (preview_status);

create index if not exists onboarding_send_attempts_meeting_id_idx
  on onboarding_send_attempts (meeting_id);

create index if not exists onboarding_send_attempts_invite_id_idx
  on onboarding_send_attempts (invite_id);

create index if not exists onboarding_send_attempts_email_preview_id_idx
  on onboarding_send_attempts (email_preview_id);

create index if not exists onboarding_send_attempts_run_mode_idx
  on onboarding_send_attempts (run_mode);

create index if not exists onboarding_send_attempts_status_idx
  on onboarding_send_attempts (status);

create index if not exists onboarding_audit_events_entity_idx
  on onboarding_audit_events (entity_type, entity_id);

create index if not exists onboarding_audit_events_audit_source_idx
  on onboarding_audit_events (audit_source);

create index if not exists onboarding_audit_events_event_type_idx
  on onboarding_audit_events (event_type);

create index if not exists onboarding_audit_events_created_at_idx
  on onboarding_audit_events (created_at);
