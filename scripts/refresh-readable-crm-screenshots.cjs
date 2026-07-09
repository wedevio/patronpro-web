#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const sharp = require("sharp");

const WEB_ROOT = path.resolve(__dirname, "..");
const SOURCE_ROOT = path.resolve(WEB_ROOT, "..");
const PATRON_PRO_ROOT = path.join(SOURCE_ROOT, "patron-pro");
const WORKSPACE_ROOT = path.resolve(SOURCE_ROOT, "..");
const CRM_ARTIFACT_ROOT = path.join(
  PATRON_PRO_ROOT,
  "dev/agents/artifacts/content/crm-provider-inspiration",
);
const REFRESH_ROOT = path.join(CRM_ARTIFACT_ROOT, "20260709-readable-screenshot-refresh");
const OLD_ROOT = path.join(REFRESH_ROOT, "old");
const BLOCKED_ROOT = path.join(REFRESH_ROOT, "blocked");
const PUBLIC_JOBBER_STRATEGY_ROOT = path.join(
  WEB_ROOT,
  "public/crm-provider-evidence/jobber/strategy",
);
const STORAGE_STATE = path.join(
  process.env.HOME || "",
  ".config/patronpro-automation/profile9-headless-storage-state.json",
);

const PUBLIC_JOBBER_FILES = new Set([
  "hypeauditor-instagram-audit-tool.detail.webp",
  "hypeauditor-instagram-audit-tool.thumb.webp",
  "jobber-website.detail.webp",
  "jobber-website.thumb.webp",
  "meta-ad-library-jobber-keyword.detail.webp",
  "meta-ad-library-jobber-keyword.thumb.webp",
  "modash-jobber-examples.detail.webp",
  "modash-jobber-examples.thumb.webp",
  "modash-jobber-influencers.detail.webp",
  "modash-jobber-influencers.thumb.webp",
]);
const WEBP_MAX_DIMENSION = 16380;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function writeText(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, value || "", "utf8");
}

function exists(file) {
  return Boolean(file) && fs.existsSync(file);
}

function artifactPathToAbs(value) {
  if (!value) return "";
  let rel = String(value).replaceAll("\\", "/");
  if (path.isAbsolute(rel)) return rel;
  if (rel.startsWith("dev/agents/artifacts/")) {
    return path.join(PATRON_PRO_ROOT, rel);
  }
  return path.join(PATRON_PRO_ROOT, rel);
}

function relToWorkspace(file) {
  return path.relative(WORKSPACE_ROOT, file).replaceAll(path.sep, "/");
}

function safeSlug(value) {
  return String(value || "capture")
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "capture";
}

function normalizeFacebookAdLibraryUrl(raw) {
  if (!/facebook\.com\/ads\/library/i.test(raw || "")) return raw;
  const url = new URL(raw);
  url.searchParams.set("sort_data[mode]", "total_impressions");
  url.searchParams.set("sort_data[direction]", "desc");
  return url.toString();
}

async function imageMeta(file) {
  if (!exists(file)) return null;
  const meta = await sharp(file).metadata();
  return {
    width: meta.width || null,
    height: meta.height || null,
    byteSize: fs.statSync(file).size,
  };
}

async function webpSafeDetailMeta(pngBuffer) {
  const meta = await sharp(pngBuffer).metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (!width || !height) return { width: null, height: null, scale: 1 };
  const scale = Math.min(1, WEBP_MAX_DIMENSION / width, WEBP_MAX_DIMENSION / height);
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
    scale,
  };
}

function detailPipeline(pngBuffer, meta) {
  let pipeline = sharp(pngBuffer).rotate();
  if (meta.scale && meta.scale < 1) {
    pipeline = pipeline.resize({
      width: meta.width,
      height: meta.height,
      fit: "fill",
      kernel: "lanczos3",
    });
  }
  return pipeline.webp({ quality: 92, effort: 6 });
}

function publicCopiesForTarget(target) {
  const copies = [];
  const detailBase = path.basename(target.detailPath || "");
  const thumbBase = path.basename(target.thumbPath || "");

  if (target.category === "case-study-rubric" && target.slug === "jobber") {
    copies.push({
      sourceRole: "detail",
      path: path.join(PUBLIC_JOBBER_STRATEGY_ROOT, "jobber-website.detail.webp"),
    });
    copies.push({
      sourceRole: "thumb",
      path: path.join(PUBLIC_JOBBER_STRATEGY_ROOT, "jobber-website.thumb.webp"),
    });
    return copies;
  }

  if (PUBLIC_JOBBER_FILES.has(detailBase)) {
    copies.push({ sourceRole: "detail", path: path.join(PUBLIC_JOBBER_STRATEGY_ROOT, detailBase) });
  }
  if (PUBLIC_JOBBER_FILES.has(thumbBase)) {
    copies.push({ sourceRole: "thumb", path: path.join(PUBLIC_JOBBER_STRATEGY_ROOT, thumbBase) });
  }
  return copies;
}

function archiveExisting(file) {
  if (!exists(file)) return null;
  const rel = relToWorkspace(file);
  const archived = path.join(OLD_ROOT, rel);
  ensureDir(path.dirname(archived));
  if (!exists(archived)) fs.copyFileSync(file, archived);
  return archived;
}

function buildProviderEvidenceTargets() {
  const dir = path.join(CRM_ARTIFACT_ROOT, "20260708-provider-public-evidence");
  const receipts = readJson(path.join(dir, "provider-public-evidence.receipts.json"));
  const rows = [...(receipts.items || []), ...(receipts.blockers || [])];
  return rows.flatMap((row) => {
    const entry = Array.isArray(row.screenshot_manifest) ? row.screenshot_manifest[0] : null;
    if (!entry?.detail_webp_artifact) return [];
    const detailPath = artifactPathToAbs(entry.detail_webp_artifact);
    const thumbPath = artifactPathToAbs(entry.thumb_webp_artifact);
    const textPath = artifactPathToAbs(entry.text_extract_artifact);
    if (!exists(detailPath)) return [];
    const slug = path.basename(detailPath).replace(/\.detail\.webp$/, "");
    return [{
      slug,
      name: row.brand_name || slug,
      url: normalizeFacebookAdLibraryUrl(row.provider_page_url),
      category: "provider-public-evidence",
      detailPath,
      thumbPath,
      textPath,
      sourceConfidence: row.source_confidence || null,
      note: row.blocker_reason || null,
    }];
  });
}

function buildCaseStudyTargets() {
  const dir = path.join(CRM_ARTIFACT_ROOT, "20260708-case-study-rubric-web-captures");
  const seed = readJson(path.join(
    CRM_ARTIFACT_ROOT,
    "20260708-case-study-rubric/crm-provider-case-study-benchmarks.seed.json",
  ));
  return (seed.candidates || []).flatMap((candidate) => {
    const slug = candidate.website?.capture_slug || safeSlug(candidate.name);
    const detailPath = path.join(dir, `${slug}.detail.webp`);
    if (!exists(detailPath)) return [];
    return [{
      slug,
      name: candidate.name || slug,
      url: candidate.primary_url || candidate.website?.url,
      category: "case-study-rubric",
      detailPath,
      thumbPath: path.join(dir, `${slug}.thumb.webp`),
      textPath: path.join(dir, `${slug}.text.txt`),
      sourceConfidence: null,
      note: null,
    }];
  });
}

function buildWebCaptureTargets() {
  const dir = path.join(CRM_ARTIFACT_ROOT, "20260708-web-captures");
  const manifest = readJson(path.join(dir, "capture-manifest.json"));
  return (manifest.candidates || []).flatMap((candidate) => {
    if (!candidate.screenshot_detail || !candidate.url) return [];
    const detailPath = path.join(dir, candidate.screenshot_detail);
    if (!exists(detailPath)) return [];
    return [{
      slug: candidate.slug || safeSlug(candidate.name || candidate.url),
      name: candidate.name || candidate.slug || candidate.url,
      url: candidate.url,
      category: "ghl-web-captures",
      detailPath,
      thumbPath: path.join(dir, candidate.screenshot_thumb || ""),
      textPath: path.join(dir, candidate.text_path || ""),
      sourceConfidence: null,
      note: null,
    }];
  });
}

function buildTargets() {
  const map = new Map();
  for (const target of [
    ...buildProviderEvidenceTargets(),
    ...buildCaseStudyTargets(),
    ...buildWebCaptureTargets(),
  ]) {
    if (!target.url || !target.detailPath) continue;
    map.set(target.detailPath, target);
  }
  let targets = [...map.values()].sort((a, b) => `${a.category}:${a.slug}`.localeCompare(`${b.category}:${b.slug}`));
  const only = new Set(String(process.env.TARGET_SLUGS || "").split(",").map((item) => item.trim()).filter(Boolean));
  if (only.size) {
    targets = targets.filter((target) => only.has(target.slug) || only.has(`${target.category}/${target.slug}`));
  }
  return targets;
}

async function dismissCommonBanners(page) {
  const labels = [
    "Accept all",
    "Accept",
    "I agree",
    "Agree",
    "Allow all",
    "Aceptar",
    "Aceptar todo",
    "Got it",
    "OK",
  ];
  for (const label of labels) {
    const button = page.getByRole("button", { name: new RegExp(`^${label}$`, "i") }).first();
    if (await button.isVisible({ timeout: 750 }).catch(() => false)) {
      await button.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(500);
      return;
    }
  }
}

async function scrollForLazyAssets(page) {
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let previousHeight = 0;
    for (let pass = 0; pass < 4; pass += 1) {
      const height = Math.max(
        document.body?.scrollHeight || 0,
        document.documentElement?.scrollHeight || 0,
      );
      for (let y = 0; y <= height; y += 900) {
        window.scrollTo(0, y);
        await wait(120);
      }
      await wait(350);
      const currentHeight = Math.max(
        document.body?.scrollHeight || 0,
        document.documentElement?.scrollHeight || 0,
      );
      if (currentHeight <= previousHeight + 50) break;
      previousHeight = currentHeight;
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(700);
}

async function pageHealth(page, response) {
  const title = await page.title().catch(() => "");
  const finalUrl = page.url();
  const text = await page.locator("body").innerText({ timeout: 5000 }).catch(() => "");
  const sample = `${title}\n${text.slice(0, 4000)}`.toLowerCase();
  const reasons = [];
  const status = response ? response.status() : null;

  if (status && [401, 403, 404, 410, 429, 500, 502, 503].includes(status)) {
    reasons.push(`http_${status}`);
  }
  if (/captcha|verify you are human|are you a human|unusual traffic|robot check|attention required/.test(sample)) {
    reasons.push("captcha_or_bot_check");
  }
  if (/access denied|request blocked|temporarily blocked|forbidden/.test(sample)) {
    reasons.push("access_blocked");
  }
  if (/page not found|404 not found|this page is not available|this content isn't available/.test(sample)) {
    reasons.push("not_found");
  }
  if (text.trim().length < 120) {
    reasons.push("thin_rendered_text");
  }

  return {
    status,
    title,
    finalUrl,
    text,
    textChars: text.length,
    blocked: reasons.length > 0,
    blockedReasons: [...new Set(reasons)],
  };
}

async function fullPagePng(page) {
  try {
    return await page.screenshot({ type: "png", fullPage: true, timeout: 120000 });
  } catch (error) {
    const viewport = page.viewportSize() || { width: 1920, height: 1500 };
    const layout = await page.evaluate(() => ({
      width: Math.max(document.documentElement.clientWidth, document.body?.clientWidth || 0),
      height: Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0),
      dpr: window.devicePixelRatio || 1,
    }));
    const chunks = [];
    for (let y = 0; y < layout.height; y += viewport.height) {
      const chunkHeight = Math.min(viewport.height, layout.height - y);
      const buffer = await page.screenshot({
        type: "png",
        clip: { x: 0, y, width: viewport.width, height: chunkHeight },
        timeout: 60000,
      });
      chunks.push({
        input: buffer,
        top: Math.round(y * layout.dpr),
        left: 0,
      });
    }
    return sharp({
      create: {
        width: Math.round(viewport.width * layout.dpr),
        height: Math.round(layout.height * layout.dpr),
        channels: 3,
        background: "#ffffff",
      },
    }).composite(chunks).png().toBuffer();
  }
}

function replacementIsBetter(oldMeta, newMeta) {
  if (!oldMeta) return true;
  if (!newMeta?.width || !newMeta?.height) return false;
  if (newMeta.width < 1400 && oldMeta.width >= 1400) return false;
  if (newMeta.width >= Math.max(oldMeta.width * 1.25, 1400)) return true;
  if (oldMeta.width < 900 && newMeta.width >= 1400) return true;
  return false;
}

async function writeReplacementImages(target, pngBuffer) {
  const oldDetailMeta = await imageMeta(target.detailPath);
  const safeDetailMeta = await webpSafeDetailMeta(pngBuffer);
  const proposedMeta = {
    width: safeDetailMeta.width,
    height: safeDetailMeta.height,
    byteSize: pngBuffer.length,
  };

  if (!replacementIsBetter(oldDetailMeta, proposedMeta)) {
    return {
      replaced: false,
      reason: "new_capture_not_materially_better",
      oldDetailMeta,
      newDetailMeta: proposedMeta,
      archives: [],
    };
  }

  const archives = [];
  const allDestinations = [
    { role: "detail", path: target.detailPath },
    { role: "thumb", path: target.thumbPath },
    ...publicCopiesForTarget(target),
  ].filter((item) => item.path && item.path.endsWith(".webp"));

  for (const dest of allDestinations) {
    const archived = archiveExisting(dest.path);
    if (archived) archives.push({ role: dest.role, original: dest.path, archive: archived });
  }

  ensureDir(path.dirname(target.detailPath));
  const detailInfo = await detailPipeline(pngBuffer, safeDetailMeta).toFile(target.detailPath);
  if (target.thumbPath) {
    ensureDir(path.dirname(target.thumbPath));
    await sharp(pngBuffer)
      .resize({ width: 640, height: 1200, fit: "inside", withoutEnlargement: false })
      .webp({ quality: 82, effort: 6 })
      .toFile(target.thumbPath);
  }

  for (const copy of publicCopiesForTarget(target)) {
    const src = copy.sourceRole === "thumb" ? target.thumbPath : target.detailPath;
    if (exists(src)) {
      ensureDir(path.dirname(copy.path));
      fs.copyFileSync(src, copy.path);
    }
  }

  return {
    replaced: true,
    reason: "new_capture_wider",
    oldDetailMeta,
    newDetailMeta: {
      width: detailInfo.width || safeDetailMeta.width,
      height: detailInfo.height || safeDetailMeta.height,
      byteSize: detailInfo.size || fs.statSync(target.detailPath).size,
      scale: safeDetailMeta.scale,
    },
    archives,
  };
}

async function captureTarget(context, target) {
  const page = await context.newPage();
  const startedAt = new Date().toISOString();
  let response = null;
  try {
    response = await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 70000 });
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await dismissCommonBanners(page);
    await scrollForLazyAssets(page);
    const health = await pageHealth(page, response);
    const pngBuffer = await fullPagePng(page);

    if (health.blocked) {
      const blockedPath = path.join(BLOCKED_ROOT, `${target.category}-${target.slug}.webp`);
      ensureDir(path.dirname(blockedPath));
      const safeBlockedMeta = await webpSafeDetailMeta(pngBuffer);
      await detailPipeline(pngBuffer, safeBlockedMeta).toFile(blockedPath);
      return {
        target,
        status: "blocked",
        startedAt,
        completedAt: new Date().toISOString(),
        health: { ...health, text: undefined },
        blockedScreenshot: blockedPath,
      };
    }

    const writeResult = await writeReplacementImages(target, pngBuffer);
    if (target.textPath) writeText(target.textPath, health.text);
    return {
      target,
      status: writeResult.replaced ? "replaced" : "kept_existing",
      startedAt,
      completedAt: new Date().toISOString(),
      health: { ...health, text: undefined },
      writeResult,
    };
  } catch (error) {
    return {
      target,
      status: "failed",
      startedAt,
      completedAt: new Date().toISOString(),
      error: error && error.stack ? error.stack : String(error),
    };
  } finally {
    await page.close().catch(() => {});
  }
}

function buildManualCaptureMarkdown(results, remoteTallItems) {
  const lines = [
    "# Screenshot Refresh Manual Capture List",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Pages Not Replaced",
    "",
  ];
  const manual = results.filter((item) => ["blocked", "failed", "kept_existing"].includes(item.status));
  if (!manual.length) {
    lines.push("- None from the local CRM capture pass.");
  } else {
    for (const item of manual) {
      const t = item.target;
      const reason =
        item.status === "blocked"
          ? (item.health?.blockedReasons || []).join(", ")
          : item.status === "kept_existing"
            ? item.writeResult?.reason
            : (item.error || "failed").split("\n")[0];
      lines.push(`- ${t.category} / ${t.slug}: ${t.url}`);
      lines.push(`  - Status: ${item.status}`);
      lines.push(`  - Reason: ${reason || "unknown"}`);
      if (item.blockedScreenshot) lines.push(`  - Blocked screenshot: ${relToWorkspace(item.blockedScreenshot)}`);
    }
  }
  lines.push("");
  lines.push("## Remote Cross-Lane Derivatives Needing Regeneration");
  lines.push("");
  lines.push("These schools/influencers/communities entries are in `media-derivatives.generated.json`, but their original media files are not present in this macOS checkout and `code2` is not resolvable from this shell. Regenerate them from the NAS/media root with the readable text-screenshot policy, or capture the source pages manually.");
  lines.push("");
  if (!remoteTallItems.length) {
    lines.push("- None detected.");
  } else {
    for (const item of remoteTallItems.slice(0, 120)) {
      lines.push(`- ${item.key}`);
      lines.push(`  - Source: ${item.sourceWidth}x${item.sourceHeight}`);
      lines.push(`  - Current detail: ${item.detailWidth}x${item.detailHeight}`);
      lines.push(`  - Current URL: ${item.detailUrl}`);
    }
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function remoteTallManifestItems() {
  const file = path.join(WEB_ROOT, "src/lib/collaborators/media-derivatives.generated.json");
  if (!exists(file)) return [];
  const manifest = readJson(file);
  const rows = [];
  for (const [key, value] of Object.entries(manifest)) {
    if (value?.kind !== "text_screenshot") continue;
    const sourceWidth = Number(value.sourceWidth || 0);
    const sourceHeight = Number(value.sourceHeight || 0);
    const detail = value.variants?.detail || {};
    const detailWidth = Number(detail.width || 0);
    const detailHeight = Number(detail.height || 0);
    if (
      sourceHeight >= 3000 ||
      (sourceWidth && sourceHeight / sourceWidth >= 2.8) ||
      (detailWidth && detailHeight / detailWidth >= 2.8) ||
      detailWidth < 1200
    ) {
      rows.push({
        key,
        sourceWidth,
        sourceHeight,
        detailWidth,
        detailHeight,
        detailUrl: detail.url || null,
      });
    }
  }
  return rows.sort((a, b) => (b.sourceHeight / Math.max(1, b.sourceWidth)) - (a.sourceHeight / Math.max(1, a.sourceWidth)));
}

async function main() {
  ensureDir(REFRESH_ROOT);
  const reportBase = process.env.REPORT_BASENAME || "readable-screenshot-refresh";
  const captureTargetsName = reportBase === "readable-screenshot-refresh"
    ? "capture-targets.json"
    : `${reportBase}-capture-targets.json`;
  const targets = buildTargets();
  writeJson(path.join(REFRESH_ROOT, captureTargetsName), {
    generatedAt: new Date().toISOString(),
    targetCount: targets.length,
    targets: targets.map((target) => ({
      ...target,
      detailPath: relToWorkspace(target.detailPath),
      thumbPath: relToWorkspace(target.thumbPath),
      textPath: relToWorkspace(target.textPath),
    })),
  });

  const contextOptions = {
    viewport: {
      width: Number(process.env.CAPTURE_WIDTH || 1920),
      height: Number(process.env.CAPTURE_HEIGHT || 1500),
    },
    deviceScaleFactor: Number(process.env.DEVICE_SCALE_FACTOR || 1.5),
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    locale: "en-US",
    timezoneId: "America/Los_Angeles",
  };
  if (exists(STORAGE_STATE)) {
    contextOptions.storageState = STORAGE_STATE;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(contextOptions);
  context.setDefaultTimeout(20000);

  const results = [];
  try {
    for (const target of targets) {
      process.stderr.write(`[capture] ${target.category}/${target.slug} ${target.url}\n`);
      const result = await captureTarget(context, target);
      results.push(result);
      process.stderr.write(`[${result.status}] ${target.slug}\n`);
    }
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }

  const remoteTallItems = remoteTallManifestItems();
  const report = {
    generatedAt: new Date().toISOString(),
    viewport: contextOptions.viewport,
    deviceScaleFactor: contextOptions.deviceScaleFactor,
    targetCount: targets.length,
    replacedCount: results.filter((item) => item.status === "replaced").length,
    blockedCount: results.filter((item) => item.status === "blocked").length,
    failedCount: results.filter((item) => item.status === "failed").length,
    keptExistingCount: results.filter((item) => item.status === "kept_existing").length,
    oldArchiveRoot: relToWorkspace(OLD_ROOT),
    blockedRoot: relToWorkspace(BLOCKED_ROOT),
    remoteTallDerivativeCount: remoteTallItems.length,
    results: results.map((result) => ({
      ...result,
      target: {
        ...result.target,
        detailPath: relToWorkspace(result.target.detailPath),
        thumbPath: relToWorkspace(result.target.thumbPath),
        textPath: relToWorkspace(result.target.textPath),
      },
      blockedScreenshot: result.blockedScreenshot ? relToWorkspace(result.blockedScreenshot) : undefined,
      writeResult: result.writeResult ? {
        ...result.writeResult,
        archives: (result.writeResult.archives || []).map((archive) => ({
          ...archive,
          original: relToWorkspace(archive.original),
          archive: relToWorkspace(archive.archive),
        })),
      } : undefined,
    })),
    remoteTallItems,
  };
  const reportPath = path.join(REFRESH_ROOT, `${reportBase}-report.json`);
  const manualPath = path.join(REFRESH_ROOT, `${reportBase}-manual-capture-needed.md`);
  writeJson(reportPath, report);
  writeText(
    manualPath,
    buildManualCaptureMarkdown(results, remoteTallItems),
  );
  console.log(JSON.stringify({
    report: relToWorkspace(reportPath),
    manualCapture: relToWorkspace(manualPath),
    targetCount: report.targetCount,
    replacedCount: report.replacedCount,
    blockedCount: report.blockedCount,
    failedCount: report.failedCount,
    keptExistingCount: report.keptExistingCount,
    remoteTallDerivativeCount: report.remoteTallDerivativeCount,
  }, null, 2));
}

main().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exit(1);
});
