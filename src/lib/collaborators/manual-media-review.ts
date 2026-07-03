import type { CandidateTaskProjection } from "./types";

export type ManualMediaReviewInput = {
  mediaUrl: string;
  commercialAlliance: boolean;
  crmMention: boolean;
  screenshotUrls: string[];
  analysis: string;
};

const HEADER = "Manual media review";

function publicUrl(value: string | null | undefined) {
  const text = (value ?? "").trim();
  if (!/^https?:\/\//i.test(text)) return "";
  return text;
}

function yes(value: boolean) {
  return value ? "yes" : "no";
}

export function parseManualMediaReviewNotes(notes?: string | null, fallbackUrl = ""): ManualMediaReviewInput {
  const text = (notes ?? "").trim();
  if (!text.startsWith(HEADER)) {
    return {
      mediaUrl: publicUrl(fallbackUrl),
      commercialAlliance: false,
      crmMention: false,
      screenshotUrls: [],
      analysis: text,
    };
  }

  const analysis = text.split(/\nAnalysis:\n/i).slice(1).join("\nAnalysis:\n").trim();
  const beforeAnalysis = text.split(/\nAnalysis:\n/i)[0] ?? "";
  const mediaUrl = publicUrl(beforeAnalysis.match(/^URL:\s*(.+)$/im)?.[1]) || publicUrl(fallbackUrl);
  const screenshotBlock = beforeAnalysis.split(/^Screenshot URLs:\s*$/im)[1] ?? "";
  const screenshotUrls = [...screenshotBlock.matchAll(/https?:\/\/\S+/gi)].map((match) => publicUrl(match[0])).filter(Boolean);

  return {
    mediaUrl,
    commercialAlliance: /^Commercial alliance:\s*yes$/im.test(beforeAnalysis),
    crmMention: /^CRM\/software mention:\s*yes$/im.test(beforeAnalysis),
    screenshotUrls: [...new Set(screenshotUrls)],
    analysis,
  };
}

export function formatManualMediaReviewNotes(input: ManualMediaReviewInput) {
  const screenshotLines = input.screenshotUrls.map((url) => `- ${url}`).join("\n") || "-";
  return [
    HEADER,
    `URL: ${publicUrl(input.mediaUrl)}`,
    `Commercial alliance: ${yes(input.commercialAlliance)}`,
    `CRM/software mention: ${yes(input.crmMention)}`,
    "Screenshot URLs:",
    screenshotLines,
    "Analysis:",
    input.analysis.trim(),
  ].join("\n");
}

export function isManualMediaReviewTask(task: CandidateTaskProjection) {
  const review = parseManualMediaReviewNotes(task.manualReviewNotes, task.reviewUrl ?? "");
  const url = review.mediaUrl || task.reviewUrl || "";
  if (!task.manualReviewed || !url) return false;
  if ((task.manualReviewNotes ?? "").trim().startsWith(HEADER)) return true;
  return /(instagram\.com|tiktok\.com|youtube\.com|youtu\.be|facebook\.com|x\.com)/i.test(url);
}
