BEGIN;

CREATE SCHEMA IF NOT EXISTS patronpro_collab;

SET search_path TO patronpro_collab, public;

CREATE TABLE IF NOT EXISTS patronpro_collab.provider_public_evidence (
  provider_evidence_id text PRIMARY KEY,
  candidate_id text NOT NULL REFERENCES patronpro_collab.candidates(candidate_id) ON DELETE CASCADE,
  source_lane text,
  provider_source text NOT NULL CHECK (provider_source IN (
    'modash_public',
    'hypeauditor_public_tool',
    'social_blade_public',
    'ad_library_public',
    'manual_public_source',
    'other_public_source'
  )),
  evidence_type text NOT NULL CHECK (evidence_type IN (
    'brand_sponsored_examples',
    'brand_collaborators',
    'creator_audit',
    'engagement_calculator',
    'original_post_verification',
    'ad_library_receipt',
    'blocker_receipt',
    'other'
  )),
  brand_name text,
  brand_domain text,
  provider_page_url text NOT NULL CHECK (provider_page_url ~* '^https://'),
  original_source_url text CHECK (original_source_url IS NULL OR original_source_url ~* '^https://'),
  platform text,
  creator_handle text,
  creator_display_name text,
  post_date date,
  visible_metric_text text,
  followers_count bigint CHECK (followers_count IS NULL OR followers_count >= 0),
  subscribers_count bigint CHECK (subscribers_count IS NULL OR subscribers_count >= 0),
  views_count bigint CHECK (views_count IS NULL OR views_count >= 0),
  likes_count bigint CHECK (likes_count IS NULL OR likes_count >= 0),
  comments_count bigint CHECK (comments_count IS NULL OR comments_count >= 0),
  shares_count bigint CHECK (shares_count IS NULL OR shares_count >= 0),
  engagement_rate numeric CHECK (engagement_rate IS NULL OR engagement_rate >= 0),
  audience_quality_score numeric CHECK (audience_quality_score IS NULL OR audience_quality_score >= 0),
  estimated_rate_text text,
  sponsor_signal text,
  evidence_summary text,
  source_confidence text NOT NULL DEFAULT 'provider_page_only' CHECK (source_confidence IN (
    'original_post_verified',
    'provider_page_only',
    'tool_output_only',
    'blocked',
    'unverified'
  )),
  screenshot_manifest jsonb NOT NULL DEFAULT '[]'::jsonb,
  raw_public_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  captured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS provider_public_evidence_candidate_source_idx
  ON patronpro_collab.provider_public_evidence (candidate_id, provider_source);

CREATE INDEX IF NOT EXISTS provider_public_evidence_brand_source_idx
  ON patronpro_collab.provider_public_evidence (brand_domain, provider_source);

CREATE INDEX IF NOT EXISTS provider_public_evidence_platform_creator_idx
  ON patronpro_collab.provider_public_evidence (platform, creator_handle);

CREATE INDEX IF NOT EXISTS provider_public_evidence_confidence_idx
  ON patronpro_collab.provider_public_evidence (source_confidence);

COMMENT ON TABLE patronpro_collab.provider_public_evidence IS
  'Public-only provider receipts from Modash, HypeAuditor free tools, ad libraries, and similar public evidence sources. No paid API payloads or secrets.';

COMMIT;

