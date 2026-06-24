import type {
  CollaboratorLane,
  CollaboratorProjection,
  ContactBookProjection,
  ContactProjection,
  ContactRouteProjection,
  DashboardSummary,
  EvidenceImageProjection,
  ExternalCollaboratorProjection,
  ActionabilityAnswerProjection,
  MediaEvidenceProjection,
  SocialProfileProjection,
  WebsiteProjection,
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

function resolveEvidenceImage(sourcePath: string | null): EvidenceImageProjection | null {
  if (!sourcePath) return null;
  const derivative = mediaDerivatives[sourcePath];
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

function projectMedia(row: MediaRow): MediaEvidenceProjection {
  const contactSheetPath = cleanString(row.contact_sheet_path);
  const representativeScreenshotPath = cleanString(row.representative_screenshot_path);
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

function projectContactBook(row: ContactBookRow): ContactBookProjection | null {
  const personId = cleanString(row.person_id);
  const name = cleanString(row.full_name);
  if (!personId || !name) return null;
  const routes = (row.contact_routes ?? []).map(projectContactRoute).filter(Boolean) as ContactRouteProjection[];
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

function projectActionabilityAnswers(answers: Record<string, ActionabilityAnswerRow> | null): ActionabilityAnswerProjection[] {
  if (!answers || typeof answers !== "object") return [];
  return Object.entries(answers)
    .filter(([key]) => key !== "reliable_contact_routes")
    .map(([key, answer]) => ({
      key,
      label: cleanString(answer.label) ?? humanizeQuestionKey(key),
      shortLabel: cleanString(answer.short_label),
      group: cleanString(answer.dashboard_card_group),
      status: cleanString(answer.answer_status),
      value: cleanString(answer.answer_value) ?? answerJsonFallback(answer.answer_json),
      confidence: cleanString(answer.confidence),
      evidenceSummary: cleanString(answer.evidence_summary),
      sourceUrls: cleanUrlList(answer.source_urls),
      displayOrder: numberOrNull(answer.display_order) ?? 999,
    }))
    .filter((answer) => hasMeaningfulContent(answer.value) || hasMeaningfulContent(answer.evidenceSummary) || hasMeaningfulContent(answer.status))
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
    }));
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
