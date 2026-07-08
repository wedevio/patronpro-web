BEGIN;

SET search_path TO patronpro_collab, public;

UPDATE patronpro_collab.research_goal_sets
SET raw_public_payload =
  raw_public_payload ||
  '{
    "applicable_source_lanes": ["crm_providers"],
    "case_study_mode": true,
    "schema_version": "crm_provider_case_study_goal_v1"
  }'::jsonb,
  updated_at = now()
WHERE goal_set_id = 'goal_crm_provider_inspiration_v1';

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
    'rq_crm_provider_market_position',
    'goal_crm_provider_inspiration_v1',
    'crm_provider_market_position',
    'What market segment and scale does this CRM provider signal?',
    'Market position',
    'structured_text',
    80,
    false,
    'crm_provider_case_study',
    '["small_business","mid_market","enterprise","multi_vertical","field_service","unknown"]'::jsonb,
    'Capture target customer, public customer/pro count, industry focus, and whether this is a direct PatronPro benchmark or a broader market benchmark.',
    '{"schema_version":"crm_provider_case_study_question_v1","applicable_source_lanes":["crm_providers"]}'::jsonb
  ),
  (
    'rq_crm_provider_website_design_strategy',
    'goal_crm_provider_inspiration_v1',
    'crm_provider_website_design_strategy',
    'How effective is the website design and offer presentation?',
    'Website design',
    'structured_text',
    90,
    false,
    'crm_provider_case_study',
    '["excellent","strong","adequate","weak","blocked"]'::jsonb,
    'Grade visual clarity, proof, CTA hierarchy, product screenshots, trial/demo path, and how quickly the page explains the business outcome.',
    '{"schema_version":"crm_provider_case_study_question_v1","applicable_source_lanes":["crm_providers"]}'::jsonb
  ),
  (
    'rq_crm_provider_social_distribution_strategy',
    'goal_crm_provider_inspiration_v1',
    'crm_provider_social_distribution_strategy',
    'How is the provider using public social distribution?',
    'Social distribution',
    'structured_text',
    100,
    false,
    'crm_provider_case_study',
    '["multi_platform","youtube_led","short_video_led","linkedin_led","weak","blocked"]'::jsonb,
    'Summarize official YouTube, Instagram, TikTok, Facebook, and LinkedIn surfaces with follower/subscriber counts when public.',
    '{"schema_version":"crm_provider_case_study_question_v1","applicable_source_lanes":["crm_providers"]}'::jsonb
  ),
  (
    'rq_crm_provider_campaign_influencer_strategy',
    'goal_crm_provider_inspiration_v1',
    'crm_provider_campaign_influencer_strategy',
    'What campaigns, events, partner, influencer, or creator signals are visible?',
    'Campaigns',
    'structured_text',
    110,
    false,
    'crm_provider_case_study',
    '["summit","webinar","podcast","creator_sponsor","partner_program","community","ad_library_needed","unknown"]'::jsonb,
    'Record public summits, webinars, communities, podcasts, paid creator examples, partner pages, and public blockers.',
    '{"schema_version":"crm_provider_case_study_question_v1","applicable_source_lanes":["crm_providers"]}'::jsonb
  ),
  (
    'rq_crm_provider_case_study_takeaway',
    'goal_crm_provider_inspiration_v1',
    'crm_provider_case_study_takeaway',
    'What is the case-study takeaway for PatronPro marketing?',
    'Case-study takeaway',
    'structured_text',
    120,
    false,
    'crm_provider_case_study',
    '[]'::jsonb,
    'State what PatronPro should borrow, adapt, avoid, or test, with source URLs and caveats.',
    '{"schema_version":"crm_provider_case_study_question_v1","applicable_source_lanes":["crm_providers"]}'::jsonb
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
