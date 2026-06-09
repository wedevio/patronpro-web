#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";

const DEFAULTS = {
  locationId: "4cPIvLND9hFAIzWQ1ZbL",
  websiteId: "YJXYasKPALXkQkvezVyw",
  pageId: "JgrAMMXugg5Yi8QAnbDz",
  stepId: "e7b3ea2b-65fb-47a5-aa70-176674788e11",
  customCodeElementId: "custom-code-MTo38o_zdB",
  expectedSha256: "94e6e0a2830dafaf69a87d76c5a3375fa1ce6f89dd8949527e155cfbb0be69cd",
  expectedLength: 33116,
  cdp: "http://127.0.0.1:9222",
  sourceEndpoint: "https://www.getpatronpro.com/api/website/4cPIvLND9hFAIzWQ1ZbL",
  previewUrl: "https://api.getpatronpro.com/preview/JgrAMMXugg5Yi8QAnbDz",
  outDir: "dev/agents/artifacts/doc/test/liverpool-digital",
};

const SELECTORS = {
  customCodeElement: "#custom-code-MTo38o_zdB",
  settingsSidebar: ".hl-builder-settings-sidebar",
  openCodeEditorButton: "button.btn-open-editor",
  codeModal: "#hl-builder-custom-code-modal",
  codeMirror: "#hl-builder-custom-code-modal .CodeMirror",
  builderSaveButton: "#pg-website-builder__btn--save",
  publishButton: "#pg-website-builder__btn--publish",
};

const COORDINATES_1858_983 = {
  modalSaveButton: { x: 978, y: 755 },
  modalCancelButton: { x: 888, y: 755 },
  modalCloseIcon: { x: 1272, y: 219 },
  builderSaveIcon: { x: 1710, y: 29 },
  publishButton: { x: 1797, y: 29 },
};

function parseArgs(argv) {
  const first = argv[2];
  const args = {
    command: first && !first.startsWith("-") ? first : "map",
    out: "",
    outDir: DEFAULTS.outDir,
    screenshot: "",
    cdp: DEFAULTS.cdp,
    apply: false,
    coordinateFallback: false,
    sourceEndpoint: DEFAULTS.sourceEndpoint,
    expectedSha256: DEFAULTS.expectedSha256,
  };

  function readFlagValue(index, flag) {
    const value = argv[index + 1];
    if (!value || value.startsWith("-")) throw new Error(`${flag} requires a value.`);
    return value;
  }

  for (let i = first && !first.startsWith("-") ? 3 : 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") args.out = readFlagValue(i++, arg);
    else if (arg === "--out-dir") args.outDir = readFlagValue(i++, arg);
    else if (arg === "--screenshot") args.screenshot = readFlagValue(i++, arg);
    else if (arg === "--cdp") args.cdp = readFlagValue(i++, arg);
    else if (arg === "--source") args.sourceEndpoint = readFlagValue(i++, arg);
    else if (arg === "--expected-sha256") args.expectedSha256 = readFlagValue(i++, arg);
    else if (arg === "--apply") args.apply = true;
    else if (arg === "--coordinate-fallback") args.coordinateFallback = true;
    else if (arg === "--help" || arg === "-h") args.command = "help";
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

function cleanText(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function assertRepoOutPath(outPath) {
  const absolute = resolve(outPath);
  const repo = resolve(process.cwd());
  const rel = relative(repo, absolute);
  if (isAbsolute(outPath) && (rel.startsWith("..") || isAbsolute(rel))) {
    throw new Error(`Refusing to write outside this repo: ${outPath}`);
  }
  return absolute;
}

async function writeJson(outPath, data) {
  if (!outPath) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  const absolute = assertRepoOutPath(outPath);
  await mkdir(dirname(absolute), { recursive: true });
  await writeFile(absolute, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Wrote ${absolute}`);
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch (err) {
    throw new Error(
      `Playwright is not available to this Node runtime. Run this script with Windows Node from the authenticated Profile 9 host. Original error: ${err instanceof Error ? err.message : err}`,
    );
  }
}

async function connectPage(args) {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.connectOverCDP(args.cdp);
  const context = browser.contexts()[0];
  if (!context) throw new Error("No browser context found on CDP endpoint.");
  const pages = context.pages();
  const page =
    pages.find((candidate) => candidate.url().includes(`/page-builder/${DEFAULTS.pageId}`)) ??
    pages.find((candidate) => candidate.url().includes("gohighlevel")) ??
    pages[0];
  if (!page) throw new Error("No pages found in browser context.");
  return { browser, context, page };
}

async function findBuilderFrame(page, waitMs = 10_000) {
  const started = Date.now();
  let frame = null;
  while (Date.now() - started < waitMs) {
    frame = page.frames().find((candidate) => candidate.url().includes("page-builder.leadconnectorhq.com"));
    if (frame) return frame;
    await page.waitForTimeout(500);
  }
  return null;
}

async function snapshotPage(page, args) {
  if (!args.screenshot) return "";
  await page.screenshot({ path: args.screenshot, fullPage: true });
  return args.screenshot;
}

async function extractFrameMap(frame) {
  if (!frame) return { available: false, reason: "Builder frame not available over CDP." };
  return frame.evaluate((selectors) => {
    const rectOf = (el) => {
      const rect = el.getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };
    const visible = (el) => Boolean(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    const selectorState = Object.fromEntries(
      Object.entries(selectors).map(([key, selector]) => {
        const el = document.querySelector(selector);
        return [
          key,
          el
            ? {
                found: true,
                visible: visible(el),
                rect: rectOf(el),
                text: (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 300),
              }
            : { found: false },
        ];
      }),
    );
    return {
      available: true,
      url: location.href,
      bodyText: (document.body?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 1200),
      selectorState,
    };
  }, SELECTORS);
}

async function currentMap(args) {
  const { page } = await connectPage(args);
  const frame = await findBuilderFrame(page);
  const screenshot = await snapshotPage(page, args);
  return {
    command: "map",
    generatedAt: new Date().toISOString(),
    defaults: DEFAULTS,
    selectors: SELECTORS,
    coordinateFallbacks: COORDINATES_1858_983,
    page: {
      url: page.url(),
      title: await page.title().catch((err) => `ERROR: ${err.message}`),
      screenshot,
      frames: page.frames().map((candidate, index) => ({
        index,
        url: candidate.url(),
        name: candidate.name(),
      })),
      bodySnippet: cleanText(await page.locator("body").innerText({ timeout: 3000 }).catch(() => "")).slice(0, 1200),
    },
    frame: await extractFrameMap(frame),
    guardrails: [
      "Do not read or store cookies, headers, passwords, tokens, localStorage, or Google account state.",
      "Do not click Publish unless the operator explicitly approves live publication.",
      "Use coordinate fallback only when the headed browser visibly shows the expected control and selector access is unavailable.",
    ],
  };
}

async function fetchSourceHtml(args) {
  const res = await fetch(args.sourceEndpoint, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Source endpoint failed: ${res.status}`);
  const body = await res.json();
  const html = body?.website?.html;
  if (!html || typeof html !== "string") throw new Error("Source endpoint did not return website.html.");
  const hash = sha256(html);
  if (args.expectedSha256 && hash !== args.expectedSha256) {
    throw new Error(`Source HTML hash mismatch. Expected ${args.expectedSha256}; got ${hash}.`);
  }
  return {
    html,
    proof: {
      characters: html.length,
      utf8Bytes: Buffer.byteLength(html),
      sha256: hash,
      markers: {
        title: html.includes("{{custom_values.company_name}} | Roofing en Glendale"),
        hero: html.includes("Tu techo, reparado o reemplazado para durar"),
        landingForm: html.includes("{{custom_values.landing_form}}"),
        primary: html.includes("--primary:#471f23;"),
        accent: html.includes("--accent:#f69309;"),
      },
    },
  };
}

async function clickBuilderSave(page, frame, args, events) {
  if (frame) {
    const button = frame.locator(SELECTORS.builderSaveButton);
    if (await button.isVisible().catch(() => false)) {
      await button.click({ timeout: 10_000 });
      await page.waitForTimeout(5_000);
      return { path: "selector", selector: SELECTORS.builderSaveButton };
    }
  }
  if (!args.coordinateFallback) throw new Error("Builder save selector unavailable. Rerun with --coordinate-fallback only if the headed browser visibly shows the save icon.");
  await page.mouse.click(COORDINATES_1858_983.builderSaveIcon.x, COORDINATES_1858_983.builderSaveIcon.y);
  await page.waitForTimeout(5_000);
  events.push({ type: "coordinate-click", target: "builderSaveIcon", ...COORDINATES_1858_983.builderSaveIcon });
  return { path: "coordinate", target: "builderSaveIcon" };
}

async function saveVisibleModal(args) {
  if (!args.apply) {
    return {
      command: "save-visible-modal",
      dryRun: true,
      planned: [
        "If code modal is visible and hash matches expected HTML, click modal Save.",
        "Then click the builder save icon.",
      ],
      selectors: SELECTORS,
      coordinateFallbacks: COORDINATES_1858_983,
    };
  }

  const { page } = await connectPage(args);
  await page.bringToFront().catch(() => {});
  const frame = await findBuilderFrame(page);
  const events = [];
  const network = [];
  page.on("response", (response) => {
    const url = response.url();
    if (/backend\.leadconnectorhq\.com\/funnels\/builder/i.test(url)) {
      network.push({
        method: response.request().method(),
        status: response.status(),
        url: url.replace(/[?].*$/, "?..."),
      });
    }
  });

  let modal = { visible: false, path: "none" };
  if (frame) {
    const modalLocator = frame.locator(SELECTORS.codeModal);
    const visible = await modalLocator.isVisible().catch(() => false);
    if (visible) {
      const value = await frame.evaluate((selector) => {
        return document.querySelector(selector)?.CodeMirror?.getValue() || "";
      }, SELECTORS.codeMirror);
      const hash = sha256(value);
      if (hash !== args.expectedSha256) throw new Error(`Open modal content hash mismatch: ${hash}`);
      await frame.locator(SELECTORS.codeModal).locator("button").filter({ hasText: /^Save$/ }).last().click({ timeout: 10_000 });
      await page.waitForTimeout(2_000);
      modal = {
        visible: true,
        path: "selector",
        characters: value.length,
        sha256: hash,
      };
    }
  }

  if (!modal.visible && args.coordinateFallback) {
    await page.mouse.click(COORDINATES_1858_983.modalSaveButton.x, COORDINATES_1858_983.modalSaveButton.y);
    await page.waitForTimeout(2_000);
    events.push({ type: "coordinate-click", target: "modalSaveButton", ...COORDINATES_1858_983.modalSaveButton });
    modal = { visible: "assumed", path: "coordinate" };
  }

  const builderSave = await clickBuilderSave(page, frame, args, events);
  const screenshot = await snapshotPage(page, args);

  return {
    command: "save-visible-modal",
    dryRun: false,
    generatedAt: new Date().toISOString(),
    pageUrl: page.url(),
    frameUrl: frame?.url() ?? "",
    modal,
    builderSave,
    screenshot,
    events,
    network,
  };
}

async function saveHtml(args) {
  if (!args.apply) {
    return {
      command: "save-html",
      dryRun: true,
      planned: [
        "Fetch generated HTML from PatronPro public endpoint.",
        "Open existing GHL custom code element.",
        "Set CodeMirror content, click modal Save, then click builder Save.",
        "Reload and verify CodeMirror hash.",
      ],
      sourceEndpoint: args.sourceEndpoint,
      expectedSha256: args.expectedSha256,
    };
  }

  const { html, proof } = await fetchSourceHtml(args);
  const { page } = await connectPage(args);
  await page.bringToFront().catch(() => {});
  const frame = await findBuilderFrame(page, 20_000);
  if (!frame) throw new Error("Builder frame unavailable; cannot safely set CodeMirror content.");

  await frame.locator(SELECTORS.customCodeElement).click({ timeout: 15_000, force: true });
  await page.waitForTimeout(1_000);
  await frame.locator(SELECTORS.openCodeEditorButton).click({ timeout: 10_000 });
  await frame.locator(SELECTORS.codeModal).waitFor({ state: "visible", timeout: 10_000 });

  const setResult = await frame.evaluate(
    ({ codeMirrorSelector, htmlValue }) => {
      const cm = document.querySelector(codeMirrorSelector)?.CodeMirror;
      if (!cm) return { ok: false, reason: "CodeMirror instance not found." };
      cm.setValue(htmlValue);
      cm.save();
      cm.refresh();
      const textarea = document.querySelector("#hl-builder-custom-code-modal textarea.hl-custom-code-editor");
      if (textarea) {
        textarea.value = htmlValue;
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
        textarea.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return {
        ok: true,
        characters: cm.getValue().length,
        hasHero: cm.getValue().includes("Tu techo, reparado o reemplazado para durar"),
        hasLandingForm: cm.getValue().includes("{{custom_values.landing_form}}"),
      };
    },
    { codeMirrorSelector: SELECTORS.codeMirror, htmlValue: html },
  );
  if (!setResult.ok) throw new Error(setResult.reason);

  await frame.locator(SELECTORS.codeModal).locator("button").filter({ hasText: /^Save$/ }).last().click({ timeout: 10_000 });
  await page.waitForTimeout(2_000);
  const builderSave = await clickBuilderSave(page, frame, args, []);
  const screenshot = await snapshotPage(page, args);

  return {
    command: "save-html",
    dryRun: false,
    generatedAt: new Date().toISOString(),
    sourceProof: proof,
    setResult,
    builderSave,
    screenshot,
    publishClicked: false,
  };
}

async function previewQa() {
  const res = await fetch(DEFAULTS.previewUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
  const text = await res.text();
  return {
    command: "preview-qa",
    generatedAt: new Date().toISOString(),
    url: DEFAULTS.previewUrl,
    status: res.status,
    bytes: Buffer.byteLength(text),
    sha256: sha256(text),
    markers: {
      hero: text.includes("Tu techo, reparado o reemplazado para durar"),
      primary: text.includes("--primary:#471f23;"),
      accent: text.includes("--accent:#f69309;"),
      customHtmlPlaceholder: text.includes("Custom HTML/Javascript"),
      landingFormRawMergeTag: text.includes("{{custom_values.landing_form}}"),
    },
  };
}

function help() {
  return {
    usage: [
      "node dev/agents/artifacts/script/patronpro-liverpool/ghl-profile9-website-builder.mjs map --out dev/agents/artifacts/doc/test/liverpool-digital/browser-map.json",
      "node dev/agents/artifacts/script/patronpro-liverpool/ghl-profile9-website-builder.mjs save-visible-modal --apply --coordinate-fallback --screenshot C:\\\\Users\\\\alast\\\\AppData\\\\Local\\\\Temp\\\\after-save.png",
      "node dev/agents/artifacts/script/patronpro-liverpool/ghl-profile9-website-builder.mjs save-html --apply",
      "node dev/agents/artifacts/script/patronpro-liverpool/ghl-profile9-website-builder.mjs preview-qa --out dev/agents/artifacts/doc/test/liverpool-digital/preview-qa.json",
    ],
    commands: {
      map: "Read-only CDP map of current Profile 9 page-builder state.",
      "save-visible-modal": "Click modal Save if it is visible, then builder Save. Requires --apply.",
      "save-html": "Fetch PatronPro generated HTML and save it to the existing GHL Custom HTML block. Requires --apply.",
      "preview-qa": "Read-only public preview marker check.",
    },
    guardrails: [
      "Run from Windows Node via PowerShell when WSL cannot reach Chrome CDP.",
      "Do not click Publish from this script.",
      "Do not log cookies, headers, tokens, localStorage, passwords, or Google account state.",
    ],
  };
}

async function main() {
  const args = parseArgs(process.argv);
  let result;
  if (args.command === "help") result = help();
  else if (args.command === "map") result = await currentMap(args);
  else if (args.command === "save-visible-modal") result = await saveVisibleModal(args);
  else if (args.command === "save-html") result = await saveHtml(args);
  else if (args.command === "preview-qa") result = await previewQa(args);
  else throw new Error(`Unknown command: ${args.command}`);

  const defaultOut =
    args.command === "help"
      ? ""
      : `${args.outDir}/ghl-profile9-website-builder-${args.command}-${new Date().toISOString().slice(0, 10)}.json`;
  await writeJson(args.out || defaultOut, result);
}

main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(err instanceof Error ? err.stack : err);
  process.exit(1);
});
