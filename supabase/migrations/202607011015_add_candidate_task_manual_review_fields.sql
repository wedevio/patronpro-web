ALTER TABLE patronpro_collab.candidate_tasks
  ADD COLUMN IF NOT EXISTS manual_review_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_reviewed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS manual_review_verdict text NOT NULL DEFAULT 'not_reviewed',
  ADD COLUMN IF NOT EXISTS manual_review_notes text,
  ADD COLUMN IF NOT EXISTS manual_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS manual_reviewed_by text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'candidate_tasks_manual_review_verdict_check'
      AND conrelid = 'patronpro_collab.candidate_tasks'::regclass
  ) THEN
    ALTER TABLE patronpro_collab.candidate_tasks
      ADD CONSTRAINT candidate_tasks_manual_review_verdict_check
      CHECK (manual_review_verdict IN ('not_reviewed', 'no_conflict', 'conflict', 'needs_follow_up'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'candidate_tasks_manual_review_notes_len_check'
      AND conrelid = 'patronpro_collab.candidate_tasks'::regclass
  ) THEN
    ALTER TABLE patronpro_collab.candidate_tasks
      ADD CONSTRAINT candidate_tasks_manual_review_notes_len_check
      CHECK (manual_review_notes IS NULL OR char_length(manual_review_notes) <= 2000);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'candidate_tasks_manual_review_state_check'
      AND conrelid = 'patronpro_collab.candidate_tasks'::regclass
  ) THEN
    ALTER TABLE patronpro_collab.candidate_tasks
      ADD CONSTRAINT candidate_tasks_manual_review_state_check
      CHECK (
        (manual_reviewed = false AND manual_review_verdict = 'not_reviewed' AND manual_reviewed_at IS NULL)
        OR
        (manual_reviewed = true AND manual_review_verdict IN ('no_conflict', 'conflict', 'needs_follow_up') AND manual_reviewed_at IS NOT NULL AND manual_reviewed_by IS NOT NULL)
      );
  END IF;
END $$;
