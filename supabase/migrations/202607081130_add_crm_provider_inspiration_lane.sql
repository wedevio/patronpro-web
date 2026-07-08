BEGIN;

SET search_path TO patronpro_collab, public;

DO $$
DECLARE
  candidate_type_constraint record;
BEGIN
  FOR candidate_type_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'patronpro_collab.candidates'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%candidate_type%'
  LOOP
    EXECUTE format('ALTER TABLE patronpro_collab.candidates DROP CONSTRAINT %I', candidate_type_constraint.conname);
  END LOOP;
END $$;

ALTER TABLE patronpro_collab.candidates
  ADD CONSTRAINT candidates_candidate_type_check
  CHECK (candidate_type IN (
    'school',
    'influencer',
    'creator',
    'facebook_group',
    'community',
    'crm_provider',
    'other'
  ));

DO $$
DECLARE
  source_lane_constraint record;
BEGIN
  FOR source_lane_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'patronpro_collab.candidates'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%source_lane%'
  LOOP
    EXECUTE format('ALTER TABLE patronpro_collab.candidates DROP CONSTRAINT %I', source_lane_constraint.conname);
  END LOOP;
END $$;

ALTER TABLE patronpro_collab.candidates
  ADD CONSTRAINT candidates_source_lane_check
  CHECK (source_lane IN (
    'schools',
    'influencers',
    'communities',
    'crm_providers'
  ));

DO $$
DECLARE
  task_type_constraint record;
BEGIN
  FOR task_type_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'patronpro_collab.candidate_tasks'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%task_type%'
  LOOP
    EXECUTE format('ALTER TABLE patronpro_collab.candidate_tasks DROP CONSTRAINT %I', task_type_constraint.conname);
  END LOOP;
END $$;

ALTER TABLE patronpro_collab.candidate_tasks
  ADD CONSTRAINT candidate_tasks_task_type_check
  CHECK (task_type IN (
    'contact_verification',
    'crm_clearance',
    'partnership_conflict_review',
    'media_refresh',
    'outreach_packaging',
    'manual_review',
    'social_media_metadata_crawl',
    'ad_library_research',
    'funnel_capture',
    'other'
  ));

INSERT INTO patronpro_collab.research_goal_sets (
  goal_set_id,
  project_key,
  slug,
  name,
  status,
  summary,
  owner,
  raw_public_payload
) VALUES (
  'goal_crm_provider_inspiration_v1',
  'patron-pro-collab-prospect-research',
  'crm-provider-inspiration',
  'CRM Provider Inspiration',
  'active',
  'Evidence model for CRM provider positioning, funnels, workshops, paid/influencer distribution, and PatronPro adaptation notes.',
  'research',
  '{"schema_version":"crm_provider_inspiration_goal_v1","created_for_bead":"ppcollab-insp-1rt"}'::jsonb
)
ON CONFLICT (project_key, slug) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  summary = EXCLUDED.summary,
  owner = EXCLUDED.owner,
  raw_public_payload = patronpro_collab.research_goal_sets.raw_public_payload || EXCLUDED.raw_public_payload,
  updated_at = now();

INSERT INTO patronpro_collab.research_questions (
  question_id,
  goal_set_id,
  question_key,
  label,
  short_label,
  answer_type,
  display_order,
  is_required,
  dashboard_card_group,
  allowed_values,
  guidance,
  raw_public_payload
) VALUES
  (
    'rq_crm_provider_vertical_offer',
    'goal_crm_provider_inspiration_v1',
    'crm_provider_vertical_offer',
    'What vertical and offer is this CRM provider selling?',
    'Vertical offer',
    'structured_text',
    10,
    true,
    'crm_provider_offer',
    '[]'::jsonb,
    'Name the target vertical, promise, pricing/entry point if public, and first conversion CTA.',
    '{"schema_version":"crm_provider_inspiration_question_v1"}'::jsonb
  ),
  (
    'rq_crm_provider_funnel_mechanics',
    'goal_crm_provider_inspiration_v1',
    'crm_provider_funnel_mechanics',
    'What funnel mechanics are visible?',
    'Funnel',
    'structured_text',
    20,
    true,
    'crm_provider_funnel',
    '[]'::jsonb,
    'Capture homepage CTA, checkout/demo/webinar path, lead magnet, scheduling path, and onboarding promise.',
    '{"schema_version":"crm_provider_inspiration_question_v1"}'::jsonb
  ),
  (
    'rq_crm_provider_social_youtube_metadata',
    'goal_crm_provider_inspiration_v1',
    'crm_provider_social_youtube_metadata',
    'What public social or YouTube metadata is available?',
    'Social metadata',
    'structured_text',
    30,
    true,
    'crm_provider_media',
    '[]'::jsonb,
    'Use official or high-confidence profiles only; third-party interviews belong in media evidence and need caveats.',
    '{"schema_version":"crm_provider_inspiration_question_v1"}'::jsonb
  ),
  (
    'rq_crm_provider_workshops_events',
    'goal_crm_provider_inspiration_v1',
    'crm_provider_workshops_events',
    'Does the provider use seminars, workshops, webinars, or training offers?',
    'Workshops',
    'structured_text',
    40,
    false,
    'crm_provider_media',
    '["none_seen","workshop","webinar","course","live_training","unknown"]'::jsonb,
    'Record public event/training surfaces and whether they feed demo, trial, or subscription conversion.',
    '{"schema_version":"crm_provider_inspiration_question_v1"}'::jsonb
  ),
  (
    'rq_crm_provider_paid_influencer_distribution',
    'goal_crm_provider_inspiration_v1',
    'crm_provider_paid_influencer_distribution',
    'Is paid, affiliate, influencer, or partner distribution visible?',
    'Distribution',
    'structured_text',
    50,
    false,
    'crm_provider_distribution',
    '["paid_ads_seen","affiliate_seen","partner_seen","influencer_seen","none_seen","blocked","unknown"]'::jsonb,
    'Store only public evidence. If ad libraries or channels are blocked, create a blocker task rather than guessing.',
    '{"schema_version":"crm_provider_inspiration_question_v1"}'::jsonb
  ),
  (
    'rq_crm_provider_highlevel_relationship',
    'goal_crm_provider_inspiration_v1',
    'crm_provider_highlevel_relationship',
    'What is the HighLevel or LeadConnector relationship evidence?',
    'HL/LC evidence',
    'structured_text',
    60,
    true,
    'crm_provider_platform',
    '["official_highlevel_claim","leadconnector_domain","third_party_claim","unclear","not_highlevel"]'::jsonb,
    'Separate first-party claims, LeadConnector-domain evidence, and third-party comparison claims.',
    '{"schema_version":"crm_provider_inspiration_question_v1"}'::jsonb
  ),
  (
    'rq_crm_provider_patronpro_takeaway',
    'goal_crm_provider_inspiration_v1',
    'crm_provider_patronpro_takeaway',
    'What should PatronPro borrow, avoid, or test?',
    'PatronPro takeaway',
    'structured_text',
    70,
    true,
    'crm_provider_strategy',
    '[]'::jsonb,
    'Tie the takeaway to a concrete website, social, funnel, workshop, or paid-distribution source.',
    '{"schema_version":"crm_provider_inspiration_question_v1"}'::jsonb
  )
ON CONFLICT (question_id) DO UPDATE SET
  goal_set_id = EXCLUDED.goal_set_id,
  question_key = EXCLUDED.question_key,
  label = EXCLUDED.label,
  short_label = EXCLUDED.short_label,
  answer_type = EXCLUDED.answer_type,
  display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required,
  dashboard_card_group = EXCLUDED.dashboard_card_group,
  allowed_values = EXCLUDED.allowed_values,
  guidance = EXCLUDED.guidance,
  raw_public_payload = patronpro_collab.research_questions.raw_public_payload || EXCLUDED.raw_public_payload,
  updated_at = now();

COMMIT;
