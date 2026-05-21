import { chromium } from "@playwright/test";

const BASE = "https://www.getpatronpro.com";
const EMAIL = "claude@getpatronpro.com";
const PASSWORD = "Test1234!";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`${BASE}/login`);
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/panel`, { timeout: 15000 });
  await page.waitForSelector("table tbody tr", { timeout: 20000 });

  const rows = await page.$$("table tbody tr");
  console.log(`✓ ${rows.length} accounts\n`);

  // Capture SMS column value for each row
  const tableData = await page.evaluate(() => {
    const rows = document.querySelectorAll("table tbody tr");
    return Array.from(rows).map((row) => {
      const cells = row.querySelectorAll("td");
      return {
        name: cells[1]?.textContent?.trim().slice(0, 40) ?? "?",
        plan: cells[2]?.textContent?.trim() ?? "?",
        estado: cells[3]?.textContent?.trim() ?? "?",
        twilio: cells[4]?.textContent?.trim() ?? "?",
        stripe: cells[5]?.textContent?.trim() ?? "?",
        sms: cells[6]?.textContent?.trim() ?? "?",
        cita: cells[7]?.textContent?.trim() ?? "?",
      };
    });
  });

  console.log("NAME                                     | TWILIO | STRIPE | SMS      | CITA");
  console.log("-".repeat(95));
  for (const r of tableData) {
    console.log(
      `${r.name.padEnd(40)} | ${r.twilio.padEnd(6)} | ${r.stripe.padEnd(6)} | ${r.sms.padEnd(8)} | ${r.cita}`
    );
  }

  // Click first account with actual data and inspect side panel
  await rows[0].click();
  await page.waitForTimeout(2000);

  const sidePanel = await page.evaluate(() => {
    // Find side panel — look for the fixed overlay
    const panels = document.querySelectorAll('[class*="fixed"]');
    for (const p of panels) {
      if (p.textContent?.includes("CUENTA GHL")) return p.textContent?.trim().slice(0, 1000);
    }
    return "Side panel not found";
  });

  console.log("\n── SIDE PANEL (first account) ──");
  console.log(sidePanel);

  await page.screenshot({ path: "tests/panel-full.png", fullPage: false });
  console.log("\n✓ Screenshot → tests/panel-full.png");

  await browser.close();
}

main().catch(console.error);
