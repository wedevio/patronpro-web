import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve(
  process.cwd(),
  "../patron-pro/dev/agents/artifacts/content/crm-provider-inspiration/20260708-case-study-rubric-web-captures",
);

const candidates = [
  {
    slug: "jobber",
    candidateId: "CRM-0013",
    name: "Jobber",
    url: "https://www.getjobber.com/",
  },
  {
    slug: "housecall-pro",
    candidateId: "CRM-0014",
    name: "Housecall Pro",
    url: "https://www.housecallpro.com/",
  },
  {
    slug: "servicetitan",
    candidateId: "CRM-0015",
    name: "ServiceTitan",
    url: "https://www.servicetitan.com/",
  },
  {
    slug: "thryv",
    candidateId: "CRM-0016",
    name: "Thryv",
    url: "https://www.thryv.com/",
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

const manifest = [];

for (const candidate of candidates) {
  const page = await context.newPage();
  const rawPng = path.join(outDir, `${candidate.slug}.full.png`);
  const detailWebp = path.join(outDir, `${candidate.slug}.detail.webp`);
  const thumbWebp = path.join(outDir, `${candidate.slug}.thumb.webp`);
  const textPath = path.join(outDir, `${candidate.slug}.text.txt`);
  const receipt = {
    ...candidate,
    captured_at: now,
    status: "pending",
    screenshot_detail: path.relative(outDir, detailWebp),
    screenshot_thumb: path.relative(outDir, thumbWebp),
    text_path: path.relative(outDir, textPath),
    error: null,
  };

  try {
    await page.goto(candidate.url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);

    for (const position of [0.2, 0.4, 0.65, 0.85, 1]) {
      await page.evaluate((scrollPosition) => {
        window.scrollTo(0, Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) * scrollPosition);
      }, position);
      await page.waitForTimeout(900);
    }

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1200);

    const text = await page.locator("body").innerText({ timeout: 15000 });
    await writeFile(textPath, text.replace(/\n{3,}/g, "\n\n"), "utf8");

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
    manifest.push(receipt);
    await page.close();
  }
}

await browser.close();

await writeFile(
  path.join(outDir, "capture-manifest.json"),
  `${JSON.stringify(
    {
      captured_at: now,
      out_dir: "dev/agents/artifacts/content/crm-provider-inspiration/20260708-case-study-rubric-web-captures",
      candidates: manifest,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Wrote ${manifest.length} benchmark capture receipts to ${outDir}`);
