import type {
  CollaboratorLane,
  CollaboratorProjection,
  CandidateTaskProjection,
  ClearanceRunProjection,
  ContactBookProjection,
  ContactProjection,
  ContactRouteProjection,
  DashboardSummary,
  CommercialPartnershipPricingProjection,
  EvidenceImageProjection,
  ExternalCollaboratorProjection,
  ActionabilityAnswerProjection,
  MediaEvidenceProjection,
  SocialProfileProjection,
  WebsiteProjection,
  WebsiteScreenshotProjection,
} from "./types";
import mediaDerivativeManifest from "./media-derivatives.generated.json";

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
  contact_book: ContactBookRow[] | null;
  external_collaborators: ExternalCollaboratorRow[] | null;
  actionability_answers: Record<string, ActionabilityAnswerRow> | null;
  public_tasks: CandidateTaskRow[] | null;
  manual_review_tasks: CandidateTaskRow[] | null;
  clearance_runs: ClearanceRunRow[] | null;
  missing_fields: string[] | null;
  suggested_next_action: string | null;
};

type SocialProfileRow = {
  platform: string;
  canonical_url: string;
  handle?: string | null;
  status?: string | null;
  visible_metric_text?: string | null;
  verification_status?: string | null;
  followers_count?: number | string | null;
  subscribers_count?: number | string | null;
  likes_count?: number | string | null;
  captured_at?: string | null;
  bio_links?: unknown;
  raw_public_payload?: Record<string, unknown> | null;
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
  social_links?: unknown;
  contact_routes?: unknown;
  review_links?: unknown;
  join_links?: unknown;
  screenshot_manifest?: unknown;
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

type MediaDerivativeVariant = {
  url?: string;
  width?: number | null;
  height?: number | null;
  byteSize?: number | null;
};

type MediaDerivativeRecord = {
  kind?: string | null;
  sourceWidth?: number | null;
  sourceHeight?: number | null;
  variants?: {
    thumb?: MediaDerivativeVariant;
    detail?: MediaDerivativeVariant;
  };
};

const mediaDerivatives = mediaDerivativeManifest as Record<string, MediaDerivativeRecord>;
const MEDIA_ROOT_MARKER = "patron-pro-prospect-media-audit/";
const PARTNERSHIP_PRICING_KEY = "commercial_partnerships_and_pricing";

function normalizeEvidencePath(sourcePath: string | null): string | null {
  if (!sourcePath) return null;
  let path = sourcePath.trim().replaceAll("\\", "/");
  if (!path) return null;
  if (path.startsWith("/media/")) path = path.slice(1);
  if (path.startsWith("media/")) return path;
  if (path.includes(MEDIA_ROOT_MARKER)) {
    const tail = path.split(MEDIA_ROOT_MARKER, 2)[1]?.replace(/^\/+/, "");
    if (tail?.startsWith("schools/") || tail?.startsWith("influencers/") || tail?.startsWith("communities/") || tail?.startsWith("_optimized/")) {
      return `media/${tail}`;
    }
  }
  if (path.includes("/media/")) return `media/${path.split("/media/", 2)[1]?.replace(/^\/+/, "")}`;
  return path;
}

type ContactRow = {
  status?: string | null;
  preferred_business_contact?: unknown;
  people?: unknown[];
  company_context?: unknown;
};

type ContactRouteRow = {
  person_contact_route_id?: string | null;
  type?: string | null;
  value?: string | null;
  url?: string | null;
  label?: string | null;
  is_preferred?: boolean | null;
  is_direct?: boolean | null;
  is_business_route?: boolean | null;
  verification_status?: string | null;
  confidence?: string | null;
  source_url?: string | null;
  captured_at?: string | null;
  ghl_sync_status?: string | null;
  ghl_contact_id?: string | null;
};

type ContactBookRow = {
  contact_book_rank?: number | string | null;
  person_id: string;
  full_name: string;
  headline?: string | null;
  biography_summary?: string | null;
  geography?: string | null;
  primary_public_url?: string | null;
  category_tags?: string[] | null;
  relationship_id?: string | null;
  relationship_type?: string | null;
  role_taxonomy_key?: string | null;
  role_group?: string | null;
  role_taxonomy_label?: string | null;
  role_title?: string | null;
  relationship_status?: string | null;
  is_decision_maker?: boolean | null;
  is_influencer?: boolean | null;
  is_primary_contact?: boolean | null;
  is_business_contact?: boolean | null;
  relationship_confidence?: string | null;
  relationship_evidence_summary?: string | null;
  source_urls?: string[] | null;
  contact_routes?: ContactRouteRow[] | null;
  has_preferred_route?: boolean | null;
  has_business_route?: boolean | null;
  has_direct_route?: boolean | null;
  latest_ghl_contact_id?: string | null;
  latest_ghl_sync_status?: string | null;
  latest_ghl_sync_at?: string | null;
  contact_book_group?: string | null;
  contact_book_label?: string | null;
};

type ExternalCollaboratorRow = {
  relationship_id?: string | null;
  relationship_type?: string | null;
  relationship_status?: string | null;
  confidence?: string | null;
  evidence_summary?: string | null;
  source_urls?: string[] | null;
  captured_at?: string | null;
  candidate_id?: string | null;
  candidate_name?: string | null;
  candidate_lane?: CollaboratorLane | null;
  candidate_type?: string | null;
  primary_url?: string | null;
  combined_reach?: number | string | null;
  shortlist_status?: string | null;
  collaboration_fit_score?: number | string | null;
};

type ActionabilityAnswerRow = {
  label?: string | null;
  short_label?: string | null;
  dashboard_card_group?: string | null;
  answer_status?: string | null;
  answer_value?: string | null;
  answer_json?: Record<string, unknown> | null;
  confidence?: string | null;
  evidence_summary?: string | null;
  source_urls?: string[] | null;
  display_order?: number | string | null;
};

type CandidateTaskRow = {
  task_id?: string | null;
  task_type?: string | null;
  label?: string | null;
  summary?: string | null;
  status?: string | null;
  priority?: string | null;
  blocker_reason?: string | null;
  follow_up_at?: string | null;
  completed_at?: string | null;
  crm_sync_eligible?: boolean | null;
  manual_review_required?: boolean | null;
  manual_reviewed?: boolean | null;
  manual_review_verdict?: string | null;
  manual_review_notes?: string | null;
  manual_reviewed_at?: string | null;
  manual_reviewed_by?: string | null;
  updated_at?: string | null;
  raw_public_payload?: Record<string, unknown> | null;
};

type ClearanceRunRow = {
  clearance_run_id?: string | null;
  platform?: string | null;
  source_url?: string | null;
  run_completed_at?: string | null;
  items_scanned?: number | string | null;
  subtitle_or_transcript_count?: number | string | null;
  keyword_hit_count?: number | string | null;
  confirmed_finding_count?: number | string | null;
  clearance_status?: string | null;
  blocked_reason?: string | null;
  reviewed_at?: string | null;
  evidence_confidence_score?: number | string | null;
  confirmed_findings?: string[] | null;
  false_positive_notes?: string[] | null;
  blockers?: string[] | null;
  raw_public_payload?: Record<string, unknown> | null;
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

function formatCount(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? new Intl.NumberFormat("en-US").format(value) : null;
  if (typeof value !== "string") return null;
  const compact = value.replace(/,/g, "").trim();
  if (!/^\d+(\.\d+)?$/.test(compact)) return null;
  const number = Number(compact);
  return Number.isFinite(number) ? new Intl.NumberFormat("en-US").format(number) : null;
}

function metricPiece(value: unknown, label: string) {
  const text = cleanString(value);
  if (!text) return null;
  if (/[a-z]/i.test(text)) return text;
  const count = formatCount(text);
  return count ? `${count} ${label}` : null;
}

function formatVisibleMetric(value: unknown) {
  const text = cleanString(value);
  if (!text) return null;
  if (!text.startsWith("{")) return text;

  try {
    const payload = JSON.parse(text) as Record<string, unknown>;
    const explicit = cleanString(payload.visible_metric);
    if (explicit) return explicit;

    const pieces = [
      metricPiece(payload.followers, "followers"),
      metricPiece(payload.subscribers, "subscribers"),
      metricPiece(payload.likes, "likes"),
      metricPiece(payload.talking_about, "talking about this"),
      metricPiece(payload.videos_count, "videos"),
      metricPiece(payload.posts_count, "posts"),
    ].filter(Boolean);

    return pieces.join(" + ") || "profile metadata captured";
  } catch {
    return text;
  }
}

function cleanDashboardText(value: unknown) {
  const text = cleanString(value);
  if (!text) return null;
  const withoutJsonPayloads = text
    .replace(/\s*\(\{[^()]*\}\)/g, "")
    .replace(/\s*\(\s*\)/g, "")
    .trim();
  return cleanString(withoutJsonPayloads);
}

function cleanEvidencePath(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "pending" || trimmed === "n/a") return null;
  if (/cookie|token|signed_url|api[_-]?key|secret/i.test(trimmed)) return null;
  const normalized = normalizeEvidencePath(trimmed);
  return normalized?.startsWith("media/") ? normalized : null;
}

function cleanList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean);
}

function cleanUrlList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const value of values) {
    const url = cleanString(value);
    if (!url || !/^https?:\/\//i.test(url) || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

function cleanPublicSourceUrlList(values: unknown): string[] {
  return cleanUrlList(values).filter((url) => {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") return false;
      if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.0\.0\.0)/i.test(parsed.hostname)) return false;
      return !/(automatic\.picturelle\.com|\/mnt\/|\/home\/|dev\/agents\/|cookie|token|signed_url|api[_-]?key|secret|minimax|hdd|provider)/i.test(url);
    } catch {
      return false;
    }
  });
}

export function projectTaskReviewMetadata(rawPublicPayload: Record<string, unknown> | null | undefined) {
  const payload =
    rawPublicPayload && typeof rawPublicPayload === "object" && !Array.isArray(rawPublicPayload) ? rawPublicPayload : {};
  const reviewUrl = safePublicUrl(payload.review_url);
  const rawContextUrls = [
    payload.source_url,
    payload.source_profile_url,
    ...(Array.isArray(payload.context_urls) ? payload.context_urls : []),
    ...(Array.isArray(payload.source_urls) ? payload.source_urls : []),
  ];
  const contextUrls = cleanPublicSourceUrlList(rawContextUrls).filter((url) => url !== reviewUrl);

  return {
    reviewTargetType: cleanString(payload.review_target_type),
    reviewTargetLabel: cleanString(payload.review_target_label) ?? cleanString(payload.target_title) ?? cleanString(payload.source_label),
    reviewUrl,
    contextUrls,
  };
}

function cleanUrlRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const output: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(value)) {
    const url = cleanString(rawValue);
    if (!url || !/^https?:\/\//i.test(url)) continue;
    output[key] = url;
  }
  return output;
}

function cleanObjectArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) return [];
  return value.filter(hasMeaningfulContent);
}

function candidateUrl(lane: CollaboratorLane | null | undefined, candidateId: string | null) {
  if (!lane || !candidateId) return null;
  return `/collaborators/${lane}/${candidateId}`;
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
    visibleMetric: formatVisibleMetric(row.visible_metric_text),
    verificationStatus: cleanString(row.verification_status),
    followers: numberOrNull(row.followers_count),
    subscribers: numberOrNull(row.subscribers_count),
    likes: numberOrNull(row.likes_count),
    capturedAt: row.captured_at,
    bioLinks: cleanUrlList(row.bio_links),
    bioLinkAudits: projectSocialBioLinkAudits(row.raw_public_payload),
  };
}

function projectSocialBioLinkAudits(rawPublicPayload: Record<string, unknown> | null | undefined) {
  const auditPayload = rawPublicPayload?.bio_link_audit_v1;
  if (!auditPayload || typeof auditPayload !== "object" || Array.isArray(auditPayload)) return [];
  const payload = auditPayload as { audits?: unknown; absence_receipt?: unknown };
  const audits = Array.isArray(payload.audits) ? payload.audits : [];
  const projectedAudits = audits
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const value = item as Record<string, unknown>;
      return {
        rawUrl: safePublicUrl(value.bio_link_raw),
        resolvedUrl: safePublicUrl(value.bio_link_resolved),
        bioText: cleanString(value.bio_text),
        destinationType: cleanString(value.destination_type),
        destinationOwner: cleanString(value.destination_owner_guess),
        destinationTitle: cleanString(value.destination_title),
        relationshipSignal: cleanString(value.relationship_signal),
        analysisNote: cleanString(value.analysis_note),
        capturedAt: cleanString(value.captured_at),
      };
    })
    .filter((item) => item && hasMeaningfulContent(item)) as SocialProfileProjection["bioLinkAudits"];
  const absenceReceipt = payload.absence_receipt;
  if (!absenceReceipt || typeof absenceReceipt !== "object" || Array.isArray(absenceReceipt)) return projectedAudits;
  const absenceValue = absenceReceipt as Record<string, unknown>;
  const projectedAbsence = {
    bioText: cleanString(absenceValue.bio_text),
    destinationType: cleanString(absenceValue.bio_link_status) ?? "no_public_bio_link_visible",
    destinationTitle: "No public bio/link visible",
    relationshipSignal: cleanString(absenceValue.relationship_signal),
    analysisNote: cleanString(absenceValue.analysis_note),
    capturedAt: cleanString(absenceValue.captured_at),
    isAbsenceReceipt: true,
  };
  if (!hasMeaningfulContent(projectedAbsence)) return projectedAudits;
  return [...projectedAudits, projectedAbsence];
}

function safePublicUrl(value: unknown) {
  const url = cleanString(value);
  if (!url || !/^https?:\/\//i.test(url)) return null;
  if (/cookie|token|signed_url|api[_-]?key|secret/i.test(url)) return null;
  return url;
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
    socialLinks: cleanUrlRecord(row.social_links),
    contactRoutes: cleanObjectArray(row.contact_routes),
    reviewLinks: cleanObjectArray(row.review_links),
    joinLinks: cleanObjectArray(row.join_links),
    screenshots: projectWebsiteScreenshots(row.screenshot_manifest, url),
  };
}

function resolveEvidenceImage(sourcePath: string | null): EvidenceImageProjection | null {
  const normalizedPath = cleanEvidencePath(sourcePath);
  if (!normalizedPath) return null;
  const derivative = mediaDerivatives[normalizedPath];
  const thumb = derivative?.variants?.thumb;
  const detail = derivative?.variants?.detail;
  if (!thumb?.url || !detail?.url) return null;
  return {
    kind: cleanString(derivative.kind),
    thumbUrl: thumb.url,
    detailUrl: detail.url,
    thumbWidth: numberOrNull(thumb.width),
    thumbHeight: numberOrNull(thumb.height),
    detailWidth: numberOrNull(detail.width),
    detailHeight: numberOrNull(detail.height),
    thumbByteSize: numberOrNull(thumb.byteSize),
    detailByteSize: numberOrNull(detail.byteSize),
  };
}

function projectWebsiteScreenshots(manifest: unknown, websiteUrl: string): WebsiteScreenshotProjection[] {
  if (!Array.isArray(manifest)) return [];
  const screenshots: WebsiteScreenshotProjection[] = [];
  for (const item of manifest) {
    if (typeof item === "string") {
      const path = cleanEvidencePath(item);
      if (!path) continue;
      const image = resolveEvidenceImage(path);
      if (!image) continue;
      screenshots.push({
        id: `${websiteUrl}-screenshot-${screenshots.length}`,
        label: `Screenshot ${screenshots.length + 1}`,
        path,
        image,
      });
      continue;
    }
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    for (const [key, value] of Object.entries(item)) {
      const path = cleanEvidencePath(value);
      if (!path) continue;
      const image = resolveEvidenceImage(path);
      if (!image) continue;
      screenshots.push({
        id: `${websiteUrl}-${key}-${screenshots.length}`,
        label: humanizeQuestionKey(key),
        path,
        image,
      });
    }
  }
  return screenshots;
}

function projectMedia(row: MediaRow): MediaEvidenceProjection {
  const contactSheetPath = cleanEvidencePath(row.contact_sheet_path);
  const representativeScreenshotPath = cleanEvidencePath(row.representative_screenshot_path);
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
    contactSheetPath,
    representativeScreenshotPath,
    contactSheet: resolveEvidenceImage(contactSheetPath),
    representativeScreenshot: resolveEvidenceImage(representativeScreenshotPath),
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

function projectContactRoute(row: ContactRouteRow): ContactRouteProjection | null {
  const id = cleanString(row.person_contact_route_id);
  const value = cleanString(row.value);
  const url = cleanString(row.url);
  if (!id || (!value && !url)) return null;
  return {
    id,
    type: cleanString(row.type),
    value,
    url,
    label: cleanString(row.label),
    isPreferred: Boolean(row.is_preferred),
    isDirect: Boolean(row.is_direct),
    isBusinessRoute: Boolean(row.is_business_route),
    verificationStatus: cleanString(row.verification_status),
    confidence: cleanString(row.confidence),
    sourceUrl: cleanString(row.source_url),
    capturedAt: cleanString(row.captured_at),
    latestGhlSyncStatus: cleanString(row.ghl_sync_status),
    latestGhlContactIdPresent: Boolean(cleanString(row.ghl_contact_id)),
  };
}

function visibleContactRoute(route: ContactRouteProjection | null): route is ContactRouteProjection {
  if (!route) return false;
  const status = cleanString(route.verificationStatus)?.toLowerCase() ?? "";
  return !status.startsWith("superseded") && !status.startsWith("duplicate");
}

function projectContactBook(row: ContactBookRow): ContactBookProjection | null {
  const personId = cleanString(row.person_id);
  const name = cleanString(row.full_name);
  if (!personId || !name) return null;
  const routes = (row.contact_routes ?? []).map(projectContactRoute).filter(visibleContactRoute);
  return {
    rank: numberOrNull(row.contact_book_rank),
    personId,
    name,
    headline: cleanString(row.headline),
    biographySummary: cleanString(row.biography_summary),
    geography: cleanString(row.geography),
    primaryPublicUrl: cleanString(row.primary_public_url),
    tags: cleanList(row.category_tags),
    relationshipId: cleanString(row.relationship_id),
    relationshipType: cleanString(row.relationship_type),
    roleTaxonomyKey: cleanString(row.role_taxonomy_key),
    roleTaxonomyLabel: cleanString(row.role_taxonomy_label),
    roleGroup: cleanString(row.role_group),
    roleTitle: cleanString(row.role_title),
    relationshipStatus: cleanString(row.relationship_status),
    relationshipConfidence: cleanString(row.relationship_confidence),
    relationshipEvidenceSummary: cleanString(row.relationship_evidence_summary),
    sourceUrls: cleanUrlList(row.source_urls),
    group: cleanString(row.contact_book_group),
    label: cleanString(row.contact_book_label),
    isDecisionMaker: Boolean(row.is_decision_maker),
    isInfluencer: Boolean(row.is_influencer),
    isPrimaryContact: Boolean(row.is_primary_contact),
    isBusinessContact: Boolean(row.is_business_contact),
    hasPreferredRoute: Boolean(row.has_preferred_route),
    hasBusinessRoute: Boolean(row.has_business_route),
    hasDirectRoute: Boolean(row.has_direct_route),
    routes,
    latestGhlSyncStatus: cleanString(row.latest_ghl_sync_status),
    latestGhlSyncAt: cleanString(row.latest_ghl_sync_at),
    latestGhlContactIdPresent: Boolean(cleanString(row.latest_ghl_contact_id)),
  };
}

function projectExternalCollaborator(row: ExternalCollaboratorRow): ExternalCollaboratorProjection | null {
  const relationshipId = cleanString(row.relationship_id);
  const candidateId = cleanString(row.candidate_id);
  const candidateName = cleanString(row.candidate_name);
  const candidateLane = row.candidate_lane;
  const candidateType = cleanString(row.candidate_type);
  if (!relationshipId || !candidateId || !candidateName || !candidateLane || !candidateType) return null;
  return {
    relationshipId,
    relationshipType: cleanString(row.relationship_type),
    relationshipStatus: cleanString(row.relationship_status),
    confidence: cleanString(row.confidence),
    evidenceSummary: cleanString(row.evidence_summary),
    sourceUrls: cleanUrlList(row.source_urls),
    capturedAt: cleanString(row.captured_at),
    candidateId,
    candidateName,
    candidateLane,
    candidateType,
    primaryUrl: cleanString(row.primary_url) ?? candidateUrl(candidateLane, candidateId),
    totalReach: numberOrNull(row.combined_reach),
    shortlistStatus: cleanString(row.shortlist_status),
    score: numberOrNull(row.collaboration_fit_score),
  };
}

function answerJsonFallback(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  for (const key of ["summary", "answer", "status", "recommendation", "value"]) {
    const text = cleanString(record[key]);
    if (text) return text;
  }
  return null;
}

function cleanPayloadList(value: unknown) {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const output: string[] = [];
  for (const item of value) {
    const text = cleanDashboardText(item);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    output.push(text);
  }
  return output.slice(0, 8);
}

function payloadNumber(value: unknown) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  return numberOrNull(value);
}

function cleanPartnershipPricingPayload(value: unknown): CommercialPartnershipPricingProjection | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (cleanString(record.schema_version) !== "commercial_partnership_pricing_v1") return null;

  const rangeRecord =
    record.estimated_mention_range_usd && typeof record.estimated_mention_range_usd === "object" && !Array.isArray(record.estimated_mention_range_usd)
      ? (record.estimated_mention_range_usd as Record<string, unknown>)
      : null;
  const estimatedMentionRangeUsd = rangeRecord
    ? {
        low: payloadNumber(rangeRecord.low),
        high: payloadNumber(rangeRecord.high),
        label: cleanDashboardText(rangeRecord.label),
        deliverable: cleanDashboardText(rangeRecord.deliverable),
      }
    : null;

  const payload: CommercialPartnershipPricingProjection = {
    schemaVersion: cleanString(record.schema_version),
    knownPartnersOrBrands: cleanPayloadList(record.known_partners_or_brands),
    relationshipType: cleanDashboardText(record.relationship_type),
    commercialExperienceLevel: cleanDashboardText(record.commercial_experience_level),
    crmOrSoftwareConflictStatus: cleanDashboardText(record.crm_or_software_conflict_status),
    estimatedMentionRangeUsd,
    pricingBasis: cleanDashboardText(record.pricing_basis),
    confidence: cleanDashboardText(record.confidence),
    reviewNotes: cleanDashboardText(record.review_notes),
    evidenceUrls: cleanPublicSourceUrlList(record.evidence_urls),
  };

  return hasMeaningfulContent(payload) ? payload : null;
}

function projectActionabilityAnswers(answers: Record<string, ActionabilityAnswerRow> | null): ActionabilityAnswerProjection[] {
  if (!answers || typeof answers !== "object") return [];
  return Object.entries(answers)
    .filter(([key]) => key !== "missing_next_step")
    .map(([key, answer]) => {
      const partnershipPricing = key === PARTNERSHIP_PRICING_KEY ? cleanPartnershipPricingPayload(answer.answer_json) : null;
      return {
        key,
        label: cleanString(answer.label) ?? humanizeQuestionKey(key),
        shortLabel: cleanString(answer.short_label),
        group: cleanString(answer.dashboard_card_group),
        status: cleanString(answer.answer_status),
        value: cleanDashboardText(answer.answer_value) ?? answerJsonFallback(answer.answer_json),
        confidence: cleanString(answer.confidence),
        evidenceSummary: cleanDashboardText(answer.evidence_summary),
        sourceUrls: key === PARTNERSHIP_PRICING_KEY ? cleanPublicSourceUrlList(answer.source_urls) : cleanUrlList(answer.source_urls),
        displayOrder: numberOrNull(answer.display_order) ?? 999,
        partnershipPricing,
      };
    })
    .filter(
      (answer) =>
        hasMeaningfulContent(answer.value) ||
        hasMeaningfulContent(answer.evidenceSummary) ||
        hasMeaningfulContent(answer.status) ||
        hasMeaningfulContent(answer.partnershipPricing),
    )
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((answer) => ({
      key: answer.key,
      label: answer.label,
      shortLabel: answer.shortLabel,
      group: answer.group,
      status: answer.status,
      value: answer.value,
      confidence: answer.confidence,
      evidenceSummary: answer.evidenceSummary,
      sourceUrls: answer.sourceUrls,
      partnershipPricing: answer.partnershipPricing,
    }));
}

function projectCandidateTask(row: CandidateTaskRow): CandidateTaskProjection | null {
  const id = cleanString(row.task_id);
  const label = cleanString(row.label);
  if (!id || !label) return null;
  const rawVerdict = cleanString(row.manual_review_verdict);
  const manualReviewVerdict =
    rawVerdict === "no_conflict" || rawVerdict === "conflict" || rawVerdict === "needs_follow_up" || rawVerdict === "not_reviewed"
      ? rawVerdict
      : "not_reviewed";
  return {
    id,
    type: cleanString(row.task_type),
    label,
    summary: cleanString(row.summary),
    status: cleanString(row.status),
    priority: cleanString(row.priority),
    blockerReason: cleanString(row.blocker_reason),
    followUpAt: cleanString(row.follow_up_at),
    completedAt: cleanString(row.completed_at),
    ...projectTaskReviewMetadata(row.raw_public_payload),
    crmSyncEligible: Boolean(row.crm_sync_eligible),
    manualReviewRequired: Boolean(row.manual_review_required),
    manualReviewed: Boolean(row.manual_reviewed),
    manualReviewVerdict,
    manualReviewNotes: cleanString(row.manual_review_notes),
    manualReviewedAt: cleanString(row.manual_reviewed_at),
    manualReviewedBy: cleanString(row.manual_reviewed_by),
    updatedAt: cleanString(row.updated_at),
  };
}

function projectClearanceRun(row: ClearanceRunRow): ClearanceRunProjection | null {
  const id = cleanString(row.clearance_run_id);
  if (!id) return null;
  return {
    id,
    platform: cleanString(row.platform),
    sourceUrl: cleanString(row.source_url),
    status: cleanString(row.clearance_status),
    blockedReason: cleanString(row.blocked_reason),
    reviewedAt: cleanString(row.reviewed_at ?? row.run_completed_at),
    itemsScanned: numberOrNull(row.items_scanned),
    transcriptCount: numberOrNull(row.subtitle_or_transcript_count),
    keywordHits: numberOrNull(row.keyword_hit_count),
    confirmedFindings: numberOrNull(row.confirmed_finding_count),
    confidence: numberOrNull(row.evidence_confidence_score),
    findings: cleanList(row.confirmed_findings),
    notes: cleanList(row.false_positive_notes),
    blockers: cleanList(row.blockers),
    rawPublicPayload: row.raw_public_payload && typeof row.raw_public_payload === "object" ? row.raw_public_payload : null,
  };
}

function humanizeQuestionKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function firstWebsiteSummary(websites: WebsiteProjection[]) {
  for (const website of websites) {
    const summary = cleanString(website.summary);
    if (summary) return summary;
  }
  return null;
}

function isResearchProcessSummary(text: string | null) {
  if (!text) return false;
  return /\b(M3|yt-dlp|Bright Data|Profile 6|Profile 9|crawl|deep crawl|dry-run|download|transcript-backed|media evidence|evidence|verification|selected set|top-8|screenshots|comments captured|fallback|repair|analysis)\b/i.test(text);
}

function sentenceList(text: string | null) {
  if (!text) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function firstNonProcessSummary(...sources: (string | null | undefined)[]) {
  for (const source of sources) {
    const text = cleanString(source);
    if (text && !isResearchProcessSummary(text)) return text;
  }
  return null;
}

function extractHistoryFact(...sources: (string | null | undefined)[]) {
  for (const source of sources) {
    for (const sentence of sentenceList(cleanString(source))) {
      if (!isResearchProcessSummary(sentence) && /\b(since|founded|established|opened|started|operating|has been|[12][0-9]{3})\b/i.test(sentence)) {
        return sentence;
      }
    }
  }
  return null;
}

function typeLabel(type: string, lane: CollaboratorLane) {
  if (type === "school" || lane === "schools") return "contractor-licensing school or training provider";
  if (type === "creator") return "contractor-focused creator";
  if (type === "facebook_group") return "contractor community group";
  if (type === "community" || lane === "communities") return "contractor community";
  return "contractor-market collaborator prospect";
}

function reachPhrase(reach: number | null) {
  if (!reach) return null;
  return `Captured public reach is about ${new Intl.NumberFormat("en-US").format(reach)} across the verified profiles we have in the database.`;
}

function tagPhrase(tags: string[]) {
  const cleanTags = tags.slice(0, 3).map((tag) => tag.replace(/_/g, " "));
  if (!cleanTags.length) return null;
  return `Current signals: ${cleanTags.join(", ")}.`;
}

function buildCandidateOverview({
  name,
  type,
  lane,
  tags,
  reach,
  primaryUrl,
  captureSummary,
  rankReason,
  websiteSummary,
}: {
  name: string;
  type: string;
  lane: CollaboratorLane;
  tags: string[];
  reach: number | null;
  primaryUrl: string | null;
  captureSummary: string | null;
  rankReason: string | null;
  websiteSummary: string | null;
}) {
  const directSummary = firstNonProcessSummary(captureSummary, websiteSummary, rankReason);
  const historyFact = extractHistoryFact(captureSummary, websiteSummary, rankReason);
  if (directSummary) {
    return [directSummary, historyFact && historyFact !== directSummary ? historyFact : null].filter(Boolean).join(" ");
  }

  const pieces = [`${name} is a ${typeLabel(type, lane)}${primaryUrl ? " with a verified public web presence" : ""}.`];
  const history = historyFact;
  if (history) pieces.push(history);
  const tagsText = tagPhrase(tags);
  if (tagsText) pieces.push(tagsText);
  const reachText = reachPhrase(reach);
  if (reachText) pieces.push(reachText);
  return pieces.join(" ");
}

export function projectCandidate(row: RawCandidateRow): CollaboratorProjection {
  const score = numberOrNull(row.collaboration_fit_score);
  const media = (row.media_items ?? []).map(projectMedia).filter((item) => hasMeaningfulContent(item));
  const websites = (row.websites ?? []).map(projectWebsite).filter(Boolean) as WebsiteProjection[];
  const totalReach = numberOrNull(row.combined_reach);
  const tags = cleanList(row.category_tags);
  const captureSummary = cleanString(row.capture_summary);
  const rankReason = cleanString(row.rank_reason);
  const websiteSummary = firstWebsiteSummary(websites);
  const overviewSummary = buildCandidateOverview({
    name: row.canonical_name,
    type: row.candidate_type,
    lane: row.source_lane,
    tags,
    reach: totalReach,
    primaryUrl: cleanString(row.primary_url),
    captureSummary,
    rankReason,
    websiteSummary,
  });
  const fitSummary = cleanString(row.recommended_collaboration_angle) ?? cleanString(row.rank_reason);
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
    totalReach,
    tags,
    summary: overviewSummary,
    overviewSummary,
    fitSummary,
    recommendation: cleanString(row.recommended_collaboration_angle),
    opportunities: cleanList(row.opportunities),
    shortcomings: cleanList(row.shortcomings),
    risks: cleanList(row.risks),
    socialProfiles: (row.social_profiles ?? []).map(projectSocial).filter(Boolean) as SocialProfileProjection[],
    websites,
    media,
    contacts: (row.contact_intelligence ?? []).map(projectContact).filter((item) => hasMeaningfulContent(item)),
    contactBook: (row.contact_book ?? []).map(projectContactBook).filter(Boolean) as ContactBookProjection[],
    externalCollaborators: (row.external_collaborators ?? []).map(projectExternalCollaborator).filter(Boolean) as ExternalCollaboratorProjection[],
    actionabilityAnswers: projectActionabilityAnswers(row.actionability_answers),
    tasks: (row.public_tasks ?? []).map(projectCandidateTask).filter(Boolean) as CandidateTaskProjection[],
    manualReviewTasks: (row.manual_review_tasks ?? []).map(projectCandidateTask).filter(Boolean) as CandidateTaskProjection[],
    clearanceRuns: (row.clearance_runs ?? []).map(projectClearanceRun).filter(Boolean) as ClearanceRunProjection[],
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
