export type CollaboratorLane = "schools" | "influencers" | "communities";

export type SocialProfileProjection = {
  platform: string;
  url: string;
  handle?: string | null;
  status?: string | null;
  visibleMetric?: string | null;
  verificationStatus?: string | null;
  followers?: number | null;
  subscribers?: number | null;
  likes?: number | null;
  capturedAt?: string | null;
  bioLinks: string[];
  bioLinkAudits: SocialProfileBioLinkAuditProjection[];
};

export type SocialProfileBioLinkAuditProjection = {
  rawUrl?: string | null;
  resolvedUrl?: string | null;
  bioText?: string | null;
  destinationType?: string | null;
  destinationOwner?: string | null;
  destinationTitle?: string | null;
  relationshipSignal?: string | null;
  analysisNote?: string | null;
  capturedAt?: string | null;
  isAbsenceReceipt?: boolean;
};

export type WebsiteProjection = {
  url: string;
  crawlStatus?: string | null;
  clarityGrade?: string | null;
  persuasionGrade?: string | null;
  contactability?: string | null;
  commercialExchangeStatus?: string | null;
  locationsCount?: number | null;
  summary?: string | null;
  socialLinks: Record<string, string>;
  contactRoutes: unknown[];
  reviewLinks: unknown[];
  joinLinks: unknown[];
  screenshots: WebsiteScreenshotProjection[];
};

export type WebsiteScreenshotProjection = {
  id: string;
  label: string;
  path: string;
  image: EvidenceImageProjection;
};

export type EvidenceImageProjection = {
  kind?: string | null;
  thumbUrl: string;
  detailUrl: string;
  thumbWidth?: number | null;
  thumbHeight?: number | null;
  detailWidth?: number | null;
  detailHeight?: number | null;
  thumbByteSize?: number | null;
  detailByteSize?: number | null;
};

export type MediaEvidenceProjection = {
  id: string;
  platform?: string | null;
  url?: string | null;
  slot?: number | null;
  score?: number | null;
  comments?: number | null;
  likes?: number | null;
  views?: number | null;
  saves?: number | null;
  hook?: string | null;
  seminarPotential?: string | null;
  visualSummary?: string | null;
  audioSummary?: string | null;
  cta?: string | null;
  riskSummary?: string | null;
  contactSheetPath?: string | null;
  representativeScreenshotPath?: string | null;
  contactSheet?: EvidenceImageProjection | null;
  representativeScreenshot?: EvidenceImageProjection | null;
};

export type ContactProjection = {
  status?: string | null;
  preferredBusinessContact?: unknown;
  people?: unknown[];
  companyContext?: unknown;
};

export type ContactRouteProjection = {
  id: string;
  type?: string | null;
  value?: string | null;
  url?: string | null;
  label?: string | null;
  isPreferred: boolean;
  isDirect: boolean;
  isBusinessRoute: boolean;
  verificationStatus?: string | null;
  confidence?: string | null;
  sourceUrl?: string | null;
  capturedAt?: string | null;
  latestGhlSyncStatus?: string | null;
  latestGhlContactIdPresent: boolean;
};

export type ContactBookProjection = {
  rank?: number | null;
  personId: string;
  name: string;
  headline?: string | null;
  biographySummary?: string | null;
  geography?: string | null;
  primaryPublicUrl?: string | null;
  tags: string[];
  relationshipId?: string | null;
  relationshipType?: string | null;
  roleTaxonomyKey?: string | null;
  roleTaxonomyLabel?: string | null;
  roleGroup?: string | null;
  roleTitle?: string | null;
  relationshipStatus?: string | null;
  relationshipConfidence?: string | null;
  relationshipEvidenceSummary?: string | null;
  sourceUrls: string[];
  group?: string | null;
  label?: string | null;
  isDecisionMaker: boolean;
  isInfluencer: boolean;
  isPrimaryContact: boolean;
  isBusinessContact: boolean;
  hasPreferredRoute: boolean;
  hasBusinessRoute: boolean;
  hasDirectRoute: boolean;
  routes: ContactRouteProjection[];
  latestGhlSyncStatus?: string | null;
  latestGhlSyncAt?: string | null;
  latestGhlContactIdPresent: boolean;
};

export type ExternalCollaboratorProjection = {
  relationshipId: string;
  relationshipType?: string | null;
  relationshipStatus?: string | null;
  confidence?: string | null;
  evidenceSummary?: string | null;
  sourceUrls: string[];
  capturedAt?: string | null;
  candidateId: string;
  candidateName: string;
  candidateLane: CollaboratorLane;
  candidateType: string;
  primaryUrl?: string | null;
  totalReach?: number | null;
  shortlistStatus?: string | null;
  score?: number | null;
};

export type ActionabilityAnswerProjection = {
  key: string;
  label: string;
  shortLabel?: string | null;
  group?: string | null;
  status?: string | null;
  value?: string | null;
  confidence?: string | null;
  evidenceSummary?: string | null;
  sourceUrls: string[];
  partnershipPricing?: CommercialPartnershipPricingProjection | null;
};

export type CommercialPartnershipPricingProjection = {
  schemaVersion?: string | null;
  knownPartnersOrBrands: string[];
  relationshipType?: string | null;
  commercialExperienceLevel?: string | null;
  crmOrSoftwareConflictStatus?: string | null;
  estimatedMentionRangeUsd?: {
    low?: number | null;
    high?: number | null;
    label?: string | null;
    deliverable?: string | null;
  } | null;
  pricingBasis?: string | null;
  confidence?: string | null;
  reviewNotes?: string | null;
  evidenceUrls: string[];
};

export type CandidateTaskProjection = {
  id: string;
  type?: string | null;
  label: string;
  summary?: string | null;
  status?: string | null;
  priority?: string | null;
  blockerReason?: string | null;
  followUpAt?: string | null;
  completedAt?: string | null;
  crmSyncEligible: boolean;
};

export type ClearanceRunProjection = {
  id: string;
  platform?: string | null;
  sourceUrl?: string | null;
  status?: string | null;
  blockedReason?: string | null;
  reviewedAt?: string | null;
  itemsScanned?: number | null;
  transcriptCount?: number | null;
  keywordHits?: number | null;
  confirmedFindings?: number | null;
  confidence?: number | null;
  findings: string[];
  notes: string[];
  blockers: string[];
  rawPublicPayload?: Record<string, unknown> | null;
};

export type CollaboratorProjection = {
  id: string;
  lane: CollaboratorLane;
  type: string;
  name: string;
  status?: string | null;
  primaryUrl?: string | null;
  score?: number | null;
  evidenceConfidence?: number | null;
  scoreVersion?: string | null;
  reviewedAt?: string | null;
  shortlistStatus?: string | null;
  opportunityTier?: string | null;
  scoreInputs?: Record<string, unknown> | null;
  evidenceIds: string[];
  totalReach?: number | null;
  tags: string[];
  summary?: string | null;
  overviewSummary?: string | null;
  fitSummary?: string | null;
  recommendation?: string | null;
  opportunities: string[];
  shortcomings: string[];
  risks: string[];
  socialProfiles: SocialProfileProjection[];
  websites: WebsiteProjection[];
  media: MediaEvidenceProjection[];
  contacts: ContactProjection[];
  contactBook: ContactBookProjection[];
  externalCollaborators: ExternalCollaboratorProjection[];
  actionabilityAnswers: ActionabilityAnswerProjection[];
  tasks: CandidateTaskProjection[];
  clearanceRuns: ClearanceRunProjection[];
  missingFields: string[];
  nextAction?: string | null;
};

export type DashboardSummary = {
  total: number;
  byLane: Record<CollaboratorLane, number>;
  readyForReview: number;
  missingFieldRows: number;
  totalMedia: number;
};
