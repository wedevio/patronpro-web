-- Update the check constraint to allow step 5 (review step)
alter table public.onboarding_progress
  drop constraint onboarding_progress_current_step_check;

alter table public.onboarding_progress
  add constraint onboarding_progress_current_step_check
  check (current_step >= 1 and current_step <= 5);
