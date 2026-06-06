create table if not exists public.roadmap_tracks (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  position integer not null default 0,
  is_active boolean not null default true,
  public_visibility text not null default 'internal' check (public_visibility in ('internal', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  track_id uuid not null references public.roadmap_tracks(id) on delete restrict,
  status text not null default 'requested' check (status in ('requested', 'analyzed', 'queued', 'in_progress', 'completed', 'blocked', 'not_planned')),
  owner_user_id uuid,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  request_type text not null default 'feature' check (request_type in ('feature', 'improvement', 'bugfix', 'internal')),
  target_quarter text,
  score integer,
  public_visibility text not null default 'internal' check (public_visibility in ('internal', 'public')),
  public_title text,
  public_summary text,
  public_published_at timestamptz,
  position integer not null default 0,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  archived_at timestamptz
);

create table if not exists public.roadmap_item_comments (
  id uuid primary key default gen_random_uuid(),
  roadmap_item_id uuid not null references public.roadmap_items(id) on delete cascade,
  author_user_id uuid,
  author_label text not null,
  body text not null,
  visibility text not null default 'internal' check (visibility in ('internal', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roadmap_item_status_history (
  id uuid primary key default gen_random_uuid(),
  roadmap_item_id uuid not null references public.roadmap_items(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('requested', 'analyzed', 'queued', 'in_progress', 'completed', 'blocked', 'not_planned')),
  changed_by text not null,
  changed_at timestamptz not null default now()
);

create index if not exists roadmap_tracks_position_idx
  on public.roadmap_tracks(position);

create index if not exists roadmap_items_active_board_idx
  on public.roadmap_items(track_id, status, archived_at, position);

create index if not exists roadmap_items_owner_idx
  on public.roadmap_items(owner_user_id);

create index if not exists roadmap_comments_item_idx
  on public.roadmap_item_comments(roadmap_item_id, created_at);

create index if not exists roadmap_history_item_idx
  on public.roadmap_item_status_history(roadmap_item_id, changed_at desc);

alter table public.roadmap_tracks enable row level security;
alter table public.roadmap_items enable row level security;
alter table public.roadmap_item_comments enable row level security;
alter table public.roadmap_item_status_history enable row level security;

insert into public.roadmap_tracks (key, name, description, position)
values
  ('business', 'Business Roadmap', 'Commercial, growth, and business-side initiatives.', 0),
  ('product', 'Product Roadmap', 'Product features, UX improvements, and roadmap delivery.', 1),
  ('operations', 'Operations Roadmap', 'Internal process, enablement, and operational improvements.', 2)
on conflict (key) do update
set
  name = excluded.name,
  description = excluded.description,
  position = excluded.position,
  updated_at = now();
