alter table public.account_submissions
  add column if not exists preferred_platform_language text,
  add column if not exists customer_communication_language text;
