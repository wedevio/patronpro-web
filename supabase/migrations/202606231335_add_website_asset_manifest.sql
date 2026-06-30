alter table if exists account_websites
  add column if not exists asset_manifest jsonb not null default '{}'::jsonb,
  add column if not exists asset_manifest_version integer not null default 1,
  add column if not exists asset_optimization_status text not null default 'idle',
  add column if not exists asset_optimization_error text,
  add column if not exists html_reference_status text,
  add column if not exists html_last_refreshed_at timestamptz,
  add column if not exists html_snapshot jsonb;

alter table if exists account_websites
  drop constraint if exists account_websites_asset_optimization_status_check;

alter table if exists account_websites
  add constraint account_websites_asset_optimization_status_check
  check (asset_optimization_status in ('idle', 'running', 'optimized', 'partial', 'skipped', 'failed'));
