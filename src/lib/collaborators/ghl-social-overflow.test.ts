import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  canonicalSocialUrlKey,
  extractUrlFromAdditionalSocialLine,
  mergeAdditionalSocialLines,
} from "./ghl-social-overflow";

describe("GHL additional social overflow merge", () => {
  test("preserves remote-only custom URLs while local research wins duplicates", () => {
    const result = mergeAdditionalSocialLines(
      [
        "YouTube duplicate: https://youtube.com/@samechannel",
        "Facebook community: https://facebook.com/groups/newgroup/",
      ],
      [
        "Manual CRM edit: https://facebook.com/groups/roofingpros",
        "Old duplicate: https://www.youtube.com/@samechannel/",
        "Remote note without URL",
      ].join("\n")
    );

    assert.deepEqual(result.value.split("\n"), [
      "YouTube duplicate: https://youtube.com/@samechannel",
      "Facebook community: https://facebook.com/groups/newgroup/",
      "Manual CRM edit: https://facebook.com/groups/roofingpros",
      "Remote note without URL",
    ]);
    assert.equal(result.localLineCount, 2);
    assert.equal(result.remotePreservedLineCount, 2);
    assert.equal(result.truncated, false);
  });

  test("keeps meaningful Facebook profile query ids while dropping tracking params", () => {
    assert.equal(
      canonicalSocialUrlKey("https://www.facebook.com/profile.php?id=123&utm_source=test"),
      "facebook.com/profile.php?id=123"
    );
    assert.equal(
      canonicalSocialUrlKey("https://facebook.com/profile.php?id=456"),
      "facebook.com/profile.php?id=456"
    );
  });

  test("extracts URLs from labeled overflow lines", () => {
    assert.equal(
      extractUrlFromAdditionalSocialLine("facebook community: https://facebook.com/groups/demo/."),
      "https://facebook.com/groups/demo/"
    );
  });
});
