import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve(
  process.cwd(),
  "../patron-pro/dev/agents/artifacts/content/crm-provider-inspiration/20260708-provider-public-evidence",
);

const pages = [
  {
    slug: "modash-jobber-examples",
    label: "Modash Jobber sponsored content examples",
    url: "https://www.modash.io/content-library/brands/jobber-examples",
  },
  {
    slug: "modash-jobber-influencers",
    label: "Modash Jobber influencer collaborators",
    url: "https://www.modash.io/content-library/brands/jobber-examples/influencers",
  },
  {
    slug: "workiz-partners",
    label: "Workiz partner and influencer program",
    url: "https://fsm.workiz.com/p/partners",
  },
  {
    slug: "hypeauditor-instagram-audit-tool",
    label: "HypeAuditor free Instagram audit tool",
    url: "https://hypeauditor.com/free-tools/instagram-audit/",
  },
  {
    slug: "meta-ad-library-jobber-keyword",
    label: "Meta Ad Library keyword search for Jobber",
    url: "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=Jobber&search_type=keyword_unordered",
  },
  {
    slug: "meta-ad-library-housecall-pro-keyword",
    label: "Meta Ad Library keyword search for Housecall Pro",
    url: "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=Housecall%20Pro&search_type=keyword_unordered",
  },
  {
    slug: "meta-ad-library-servicetitan-keyword",
    label: "Meta Ad Library keyword search for ServiceTitan",
    url: "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=ServiceTitan&search_type=keyword_unordered",
  },
  {
    slug: "meta-ad-library-thryv-keyword",
    label: "Meta Ad Library keyword search for Thryv",
    url: "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=Thryv&search_type=keyword_unordered",
  },
  {
    slug: "meta-ad-library-workiz-keyword",
    label: "Meta Ad Library keyword search for Workiz",
    url: "https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=US&is_targeted_country=false&media_type=all&q=Workiz&search_type=keyword_unordered",
  },
];

const now = new Date().toISOString();

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1200 },
  deviceScaleFactor: 1,
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 PatronProResearchBot/1.0",
});

const receipts = [];

for (const pageSpec of pages) {
  const page = await context.newPage();
  const rawPng = path.join(outDir, `${pageSpec.slug}.full.png`);
  const detailWebp = path.join(outDir, `${pageSpec.slug}.detail.webp`);
  const thumbWebp = path.join(outDir, `${pageSpec.slug}.thumb.webp`);
  const textPath = path.join(outDir, `${pageSpec.slug}.text.txt`);
  const receipt = {
    ...pageSpec,
    captured_at: now,
    status: "pending",
    screenshot_detail: path.relative(outDir, detailWebp),
    screenshot_thumb: path.relative(outDir, thumbWebp),
    text_path: path.relative(outDir, textPath),
    error: null,
  };

  try {
    await page.goto(pageSpec.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3500);

    for (const position of [0.25, 0.5, 0.75, 1]) {
      await page.evaluate((scrollPosition) => {
        window.scrollTo(0, Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) * scrollPosition);
      }, position);
      await page.waitForTimeout(800);
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);

    const text = await page.locator("body").innerText({ timeout: 15000 }).catch(() => "");
    await writeFile(
      textPath,
      text
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n")
        .replace(/\n{3,}/g, "\n\n"),
      "utf8",
    );

    await page.screenshot({
      path: rawPng,
      fullPage: true,
      animations: "disabled",
    });

    const image = sharp(rawPng).rotate();
    await image
      .clone()
      .resize({ width: 1440, height: 2600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(detailWebp);
    await image
      .clone()
      .resize({ width: 480, height: 900, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 68, effort: 5 })
      .toFile(thumbWebp);
    await unlink(rawPng);

    receipt.status = "captured";
    receipt.title = await page.title();
    receipt.final_url = page.url();
    receipt.text_chars = text.length;
  } catch (error) {
    receipt.status = "blocked";
    receipt.error = error instanceof Error ? error.message : String(error);
  } finally {
    receipts.push(receipt);
    await page.close();
  }
}

await browser.close();

await writeFile(
  path.join(outDir, "capture-manifest.json"),
  `${JSON.stringify(
    {
      captured_at: now,
      out_dir: "dev/agents/artifacts/content/crm-provider-inspiration/20260708-provider-public-evidence",
      pages: receipts,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Wrote ${receipts.length} public evidence capture receipts to ${outDir}`);
