import type {
  CollaboratorLane,
  CollaboratorProjection,
  ContactProjection,
  DashboardSummary,
  MediaEvidenceProjection,
  SocialProfileProjection,
  WebsiteProjection,
} from "./types";

export type RawCandidateRow = {
  candidate_id: string;
  candidate_type: string;
  source_lane: CollaboratorLane;
  canonical_name: string;
  status: string | null;
  primary_url: string | null;
  category_tags: string[] | null;
  capture_summary: string | null;
  combined_reach: number | string | null;
  shortlist_status: string | null;
  opportunity_tier: string | null;
  score_version: string | null;
  reviewed_at: string | null;
  score_inputs: Record<string, unknown> | null;
  collaboration_fit_score: number | string | null;
  evidence_confidence_score: number | string | null;
  recommended_collaboration_angle: string | null;
  rank_reason: string | null;
  opportunities: string[] | null;
  shortcomings: string[] | null;
  risks: string[] | null;
  social_profiles: SocialProfileRow[] | null;
  websites: WebsiteRow[] | null;
  media_items: MediaRow[] | null;
  contact_intelligence: ContactRow[] | null;
  missing_fields: string[] | null;
  suggested_next_action: string | null;
};

type SocialProfileRow = {
  platform: string;
  canonical_url: string;
  handle?: string | null;
  status?: string | null;
  followers_count?: number | string | null;
  subscribers_count?: number | string | null;
  likes_count?: number | string | null;
  captured_at?: string | null;
};

type WebsiteRow = {
  url: string;
  crawl_status?: string | null;
  clarity_grade?: string | null;
  persuasion_grade?: string | null;
  contactability?: string | null;
  commercial_exchange_status?: string | null;
  locations_count?: number | string | null;
  summary?: string | null;
};

type MediaRow = {
  media_item_id: string;
  platform?: string | null;
  canonical_url?: string | null;
  slot?: number | string | null;
  score_0_100?: number | string | null;
  comments_count?: number | string | null;
  likes_count?: number | string | null;
  views_count?: number | string | null;
  saves_count?: number | string | null;
  hook?: string | null;
  seminar_potential?: string | null;
  visual_summary?: string | null;
  audio_summary?: string | null;
  cta?: string | null;
  risk_summary?: string | null;
  contact_sheet_path?: string | null;
  representative_screenshot_path?: string | null;
};

type ContactRow = {
  status?: string | null;
  preferred_business_contact?: unknown;
  people?: unknown[];
  company_context?: unknown;
};

function numberOrNull(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function cleanString(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "pending" || trimmed === "n/a") return null;
  if (/\/mnt\/|\/home\/|cookie|token|signed_url|api[_-]?key|secret/i.test(trimmed)) return null;
  return trimmed;
}

function cleanList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function hasMeaningfulContent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return cleanString(value) !== null;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.some(hasMeaningfulContent);
  if (typeof value === "object") return Object.values(value).some(hasMeaningfulContent);
  return Boolean(value);
}

function projectSocial(row: SocialProfileRow): SocialProfileProjection | null {
  const url = cleanString(row.canonical_url);
  if (!url) return null;
  return {
    platform: row.platform,
    url,
    handle: cleanString(row.handle),
    status: cleanString(row.status),
    followers: numberOrNull(row.followers_count),
    subscribers: numberOrNull(row.subscribers_count),
    likes: numberOrNull(row.likes_count),
    capturedAt: row.captured_at,
  };
}

function projectWebsite(row: WebsiteRow): WebsiteProjection | null {
  const url = cleanString(row.url);
  if (!url) return null;
  return {
    url,
    crawlStatus: cleanString(row.crawl_status),
    clarityGrade: cleanString(row.clarity_grade),
    persuasionGrade: cleanString(row.persuasion_grade),
    contactability: cleanString(row.contactability),
    commercialExchangeStatus: cleanString(row.commercial_exchange_status),
    locationsCount: numberOrNull(row.locations_count),
    summary: cleanString(row.summary),
  };
}

function projectMedia(row: MediaRow): MediaEvidenceProjection {
  return {
    id: row.media_item_id,
    platform: cleanString(row.platform),
    url: cleanString(row.canonical_url),
    slot: numberOrNull(row.slot),
    score: numberOrNull(row.score_0_100),
    comments: numberOrNull(row.comments_count),
    likes: numberOrNull(row.likes_count),
    views: numberOrNull(row.views_count),
    saves: numberOrNull(row.saves_count),
    hook: cleanString(row.hook),
    seminarPotential: cleanString(row.seminar_potential),
    visualSummary: cleanString(row.visual_summary),
    audioSummary: cleanString(row.audio_summary),
    cta: cleanString(row.cta),
    riskSummary: cleanString(row.risk_summary),
    contactSheetPath: cleanString(row.contact_sheet_path),
    representativeScreenshotPath: cleanString(row.representative_screenshot_path),
  };
}

function collectEvidenceIds(media: MediaEvidenceProjection[]): string[] {
  return media.map((item) => item.id).filter(Boolean);
}

function projectContact(row: ContactRow): ContactProjection {
  return {
    status: cleanString(row.status),
    preferredBusinessContact: row.preferred_business_contact,
    people: Array.isArray(row.people) ? row.people : [],
    companyContext: row.company_context,
  };
}

export function projectCandidate(row: RawCandidateRow): CollaboratorProjection {
  const score = numberOrNull(row.collaboration_fit_score);
  const media = (row.media_items ?? []).map(projectMedia).filter((item) => hasMeaningfulContent(item));
  return {
    id: row.candidate_id,
    lane: row.source_lane,
    type: row.candidate_type,
    name: row.canonical_name,
    status: cleanString(row.shortlist_status) ?? cleanString(row.status),
    primaryUrl: cleanString(row.primary_url),
    score,
    evidenceConfidence: numberOrNull(row.evidence_confidence_score),
    scoreVersion: cleanString(row.score_version),
    reviewedAt: cleanString(row.reviewed_at),
    shortlistStatus: cleanString(row.shortlist_status),
    opportunityTier: cleanString(row.opportunity_tier),
    scoreInputs: row.score_inputs && hasMeaningfulContent(row.score_inputs) ? row.score_inputs : null,
    evidenceIds: collectEvidenceIds(media),
    totalReach: numberOrNull(row.combined_reach),
    tags: cleanList(row.category_tags),
    summary: cleanString(row.rank_reason) ?? cleanString(row.capture_summary),
    recommendation: cleanString(row.recommended_collaboration_angle),
    opportunities: cleanList(row.opportunities),
    shortcomings: cleanList(row.shortcomings),
    risks: cleanList(row.risks),
    socialProfiles: (row.social_profiles ?? []).map(projectSocial).filter(Boolean) as SocialProfileProjection[],
    websites: (row.websites ?? []).map(projectWebsite).filter(Boolean) as WebsiteProjection[],
    media,
    contacts: (row.contact_intelligence ?? []).map(projectContact).filter((item) => hasMeaningfulContent(item)),
    missingFields: cleanList(row.missing_fields),
    nextAction: cleanString(row.suggested_next_action),
  };
}

export function projectSummary(rows: { source_lane: CollaboratorLane; count: string | number }[], readyRows: number, missingRows: number, totalMedia: number): DashboardSummary {
  const byLane: DashboardSummary["byLane"] = { schools: 0, influencers: 0, communities: 0 };
  let total = 0;
  for (const row of rows) {
    const count = numberOrNull(row.count) ?? 0;
    byLane[row.source_lane] = count;
    total += count;
  }
  return { total, byLane, readyForReview: readyRows, missingFieldRows: missingRows, totalMedia };
}
