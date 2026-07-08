BEGIN;

CREATE SCHEMA IF NOT EXISTS patronpro_collab;

SET search_path TO patronpro_collab, public;

CREATE TABLE IF NOT EXISTS patronpro_collab.crm_provider_strategy_patterns (
  strategy_pattern_id text PRIMARY KEY,
  candidate_id text NOT NULL REFERENCES patronpro_collab.candidates(candidate_id) ON DELETE CASCADE,
  source_lane text NOT NULL DEFAULT 'crm_providers',
  pattern_type text NOT NULL CHECK (pattern_type IN (
    'creator_sponsorship',
    'paid_social_ad',
    'grant_or_giveaway',
    'education_event',
    'website_funnel',
    'offer_pricing',
    'product_positioning',
    'social_distribution',
    'evidence_gap',
    'other'
  )),
  pattern_name text NOT NULL,
  strategy_summary text,
  why_it_works text,
  patronpro_replication_idea text,
  evidence_strength text NOT NULL DEFAULT 'directional_public' CHECK (evidence_strength IN (
    'strong_public',
    'directional_public',
    'blocked',
    'needs_verification'
  )),
  primary_channel text,
  source_urls jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(source_urls) = 'array'),
  related_provider_evidence_ids jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(related_provider_evidence_ids) = 'array'),
  screenshot_manifest jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(screenshot_manifest) = 'array'),
  raw_public_payload jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(raw_public_payload) = 'object'),
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS crm_provider_strategy_patterns_candidate_type_idx
  ON patronpro_collab.crm_provider_strategy_patterns (candidate_id, pattern_type);

CREATE INDEX IF NOT EXISTS crm_provider_strategy_patterns_evidence_strength_idx
  ON patronpro_collab.crm_provider_strategy_patterns (evidence_strength);

CREATE INDEX IF NOT EXISTS crm_provider_strategy_patterns_primary_channel_idx
  ON patronpro_collab.crm_provider_strategy_patterns (primary_channel);

COMMENT ON TABLE patronpro_collab.crm_provider_strategy_patterns IS
  'CRM-provider marketing strategy patterns for public competitive case studies. Stores reusable funnel, creator, ad, offer, website, and evidence-gap observations without reusing collaborator compatibility/contact cards.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'patronpro_collab_app') THEN
    GRANT SELECT ON patronpro_collab.crm_provider_strategy_patterns TO patronpro_collab_app;
  END IF;
END $$;

COMMIT;
