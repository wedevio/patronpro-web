import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve(
  process.cwd(),
  "../patron-pro/dev/agents/artifacts/content/crm-provider-inspiration/20260708-web-captures",
);

const candidates = [
  {
    slug: "rd-mortgage-pro",
    name: "RD Mortgage Pro",
    url: "https://rdmarketingsolutions.com/rd-mortgage-pro",
  },
  {
    slug: "local-business-ranks-contractor-crm",
    name: "Local Business Ranks Contractor CRM",
    url: "https://localbusinessranks.com/contractor-crm/",
  },
  {
    slug: "upmotion-media-contractor-software",
    name: "UpMotion Media Contractor Software & CRM",
    url: "https://upmotionmedia.com/software/",
  },
  {
    slug: "lead2client-crm",
    name: "Lead2Client CRM",
    url: "https://www.lead2clientcrm.com/",
  },
  {
    slug: "crm-done-better",
    name: "CRM Done Better",
    url: "https://crmdonebetter.com/",
  },
  {
    slug: "automate-crm",
    name: "Automate CRM",
    url: "https://automatecrm.com.au/locat-mate-plan-9468",
  },
  {
    slug: "marketerm8",
    name: "MarketerM8",
    url: "https://www.marketerm8.com/",
  },
  {
    slug: "marketerm8-obm-article",
    name: "MarketerM8 OBM CRM Article",
    url: "https://www.marketerm8.com/post/all-in-one-crm-for-obms-and-clients",
  },
  {
    slug: "my-service-robot-checkout",
    name: "My Service Robot Checkout",
    url: "https://pricing.myservicerobot.com/checkout-home-service-lift-off",
  },
  {
    slug: "my-service-robot-yacdaddy",
    name: "My Service Robot Evidence Comparison",
    url: "https://www.yacdaddy.com/oby-reviews/my-service-robot-vs-highlevel/",
  },
  {
    slug: "agent-crm-highlevel-article",
    name: "Agent CRM HighLevel Article",
    url: "https://blog.agent-crm.com/the-best-way-to-use-high-level-gohighlevel-as-an-insurance-agent/",
  },
  {
    slug: "onyx-crm-highlevel-guide",
    name: "Onyx CRM HighLevel Guide",
    url: "https://blog.onyx-crm.com/highlevel-complete-guide-for-insurance-agents/",
  },
  {
    slug: "carefunnels-highlevel-comparison",
    name: "CareFunnels HighLevel Comparison",
    url: "https://www.carefunnels.com/highlevel-vs-carefunnels/",
  },
  {
    slug: "tradie-pulse-crm",
    name: "Tradie Pulse CRM",
    url: "https://leads-connector.com/",
  },
  {
    slug: "highlevel-gtm-model",
    name: "HighLevel Go-To-Market Model",
    url: "https://marketplace.gohighlevel.com/docs/oauth/AgencyVsSubAccount",
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
    await page.goto(candidate.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2500);
    for (const position of [0.25, 0.5, 0.75, 1]) {
      await page.evaluate((scrollPosition) => {
        window.scrollTo(0, document.body.scrollHeight * scrollPosition);
      }, position);
      await page.waitForTimeout(700);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(900);

    const text = await page.locator("body").innerText({ timeout: 10000 });
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
      out_dir: "dev/agents/artifacts/content/crm-provider-inspiration/20260708-web-captures",
      candidates: manifest,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(`Wrote ${manifest.length} capture receipts to ${outDir}`);
