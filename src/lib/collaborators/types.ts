export type CollaboratorLane = "schools" | "influencers" | "communities";

export type SocialProfileProjection = {
  platform: string;
  url: string;
  handle?: string | null;
  status?: string | null;
  followers?: number | null;
  subscribers?: number | null;
  likes?: number | null;
  capturedAt?: string | null;
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
