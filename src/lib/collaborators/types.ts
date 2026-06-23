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
};

export type ContactProjection = {
  status?: string | null;
  preferredBusinessContact?: unknown;
  people?: unknown[];
  companyContext?: unknown;
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
  totalReach?: number | null;
  tags: string[];
  summary?: string | null;
  recommendation?: string | null;
  opportunities: string[];
  shortcomings: string[];
  risks: string[];
  socialProfiles: SocialProfileProjection[];
  websites: WebsiteProjection[];
  media: MediaEvidenceProjection[];
  contacts: ContactProjection[];
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
