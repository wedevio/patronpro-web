import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { formatManualMediaReviewNotes, isManualMediaReviewTask, parseManualMediaReviewNotes } from "./manual-media-review";
import type { CandidateTaskProjection } from "./types";

describe("manual media review notes", () => {
  test("round-trips structured review fields", () => {
    const notes = formatManualMediaReviewNotes({
      mediaUrl: "https://www.instagram.com/p/demo/",
      commercialAlliance: true,
      crmMention: false,
      screenshotUrls: ["https://example.com/shot.webp"],
      analysis: "Mentions a tool sponsor, no CRM vendor named.",
    });

    assert.deepEqual(parseManualMediaReviewNotes(notes), {
      mediaUrl: "https://www.instagram.com/p/demo/",
      commercialAlliance: true,
      crmMention: false,
      screenshotUrls: ["https://example.com/shot.webp"],
      analysis: "Mentions a tool sponsor, no CRM vendor named.",
    });
  });

  test("classifies reviewed social URLs as manual media evidence", () => {
    const task = {
      id: "task",
      label: "Review media",
      reviewUrl: "https://www.youtube.com/watch?v=demo",
      contextUrls: [],
      crmSyncEligible: false,
      manualReviewed: true,
      manualReviewVerdict: "no_conflict",
    } satisfies CandidateTaskProjection;

    assert.equal(isManualMediaReviewTask(task), true);
  });
});
