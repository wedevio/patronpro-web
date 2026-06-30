import { createHash } from "node:crypto";
import type { WebsiteAssetManifest } from "./asset-optimizer";

export type HtmlReferenceStatus = "current_merge_tags" | "refreshed" | "noop_unsupported";

export interface HtmlRefreshResult {
  html: string;
  status: HtmlReferenceStatus;
  changed: boolean;
  snapshot?: {
    html: string;
    hash: string;
    mode: "refresh";
    createdAt: string;
  };
}

const WEBSITE_MERGE_TAG_PATTERN = /\{\{\s*custom_values\.website_/;

function hashHtml(html: string): string {
  return createHash("sha256").update(html, "utf8").digest("hex");
}

function preferredDerivativeUrl(item: NonNullable<WebsiteAssetManifest["assets"][keyof WebsiteAssetManifest["assets"]]>): string | null {
  return (
    item.derivatives.find((derivative) => derivative.format === "webp" && derivative.width === 960)?.url ??
    item.derivatives.find((derivative) => derivative.format === "webp")?.url ??
    item.derivatives.find((derivative) => derivative.format === "jpg")?.url ??
    item.derivatives[0]?.url ??
    null
  );
}

export function refreshHtmlImageReferences(
  html: string,
  manifest: WebsiteAssetManifest,
): HtmlRefreshResult {
  if (!html) {
    return { html, status: "noop_unsupported", changed: false };
  }

  if (WEBSITE_MERGE_TAG_PATTERN.test(html)) {
    return { html, status: "current_merge_tags", changed: false };
  }

  let nextHtml = html;
  for (const item of Object.values(manifest.assets)) {
    if (!item?.sourceUrl) continue;
    const replacement = preferredDerivativeUrl(item);
    if (!replacement || replacement === item.sourceUrl) continue;
    nextHtml = nextHtml.split(item.sourceUrl).join(replacement);
  }

  if (nextHtml === html) {
    return { html, status: "noop_unsupported", changed: false };
  }

  return {
    html: nextHtml,
    status: "refreshed",
    changed: true,
    snapshot: {
      html,
      hash: hashHtml(html),
      mode: "refresh",
      createdAt: new Date().toISOString(),
    },
  };
}
