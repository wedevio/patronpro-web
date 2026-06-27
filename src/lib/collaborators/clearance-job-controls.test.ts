import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  ClearanceControlError,
  adapterFor,
  parseClearanceJobControls,
  readPlatform,
  readScope,
} from "./clearance-job-controls";

const fixedNow = new Date("2026-06-27T12:00:00.000Z");

describe("clearance job controls", () => {
  test("validates platform and scope", () => {
    assert.equal(readPlatform("YouTube"), "youtube");
    assert.equal(readScope("youtube", "metadata_smoke"), "metadata_smoke");
    assert.equal(adapterFor("youtube", "metadata_smoke"), "youtube_subtitles_smoke");
    assert.throws(() => readPlatform("instagram"), ClearanceControlError);
    assert.throws(() => readScope("tiktok", "subtitle_smoke"), ClearanceControlError);
  });

  test("parses bounded custom date range and intent", () => {
    const controls = parseClearanceJobControls(
      {
        apply: true,
        maxRecords: 3,
        dateRangePreset: "custom",
        dateStart: "2026-05-01",
        dateEnd: "2026-05-31",
        intentPreset: "custom",
        customQuery: "CRM sponsor links in captions",
      },
      "youtube",
      fixedNow
    );
    assert.equal(controls.apply, true);
    assert.equal(controls.maxRecords, 3);
    assert.equal(controls.dateStart, "2026-05-01");
    assert.equal(controls.dateEnd, "2026-05-31");
    assert.equal(controls.customQuery, "CRM sponsor links in captions");
    assert.equal(controls.paidRouteEnabled, false);
    assert.equal(controls.outreachEnabled, false);
  });

  test("rejects unsafe paid routes and outreach", () => {
    assert.throws(() => parseClearanceJobControls({ paidRouteEnabled: true }, "tiktok", fixedNow), /paid routes/);
    assert.throws(() => parseClearanceJobControls({ sendOutreach: true }, "tiktok", fixedNow), /outreach/);
  });

  test("enforces max item caps and date bounds", () => {
    assert.throws(() => parseClearanceJobControls({ maxRecords: 26 }, "youtube", fixedNow), /between 1 and 25/);
    assert.throws(
      () =>
        parseClearanceJobControls(
          { dateRangePreset: "custom", dateStart: "2025-01-01", dateEnd: "2026-06-27" },
          "tiktok",
          fixedNow
        ),
      /366 days/
    );
  });
});
