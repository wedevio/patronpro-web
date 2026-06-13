#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {
    input: "",
    out: "",
    jsonOut: "",
    url: "",
    outDir: "dev/agents/artifacts/doc/test/liverpool-digital/lighthouse",
    failOnBudget: false,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") args.input = argv[++i] ?? "";
    else if (arg === "--out") args.out = argv[++i] ?? "";
    else if (arg === "--json-out") args.jsonOut = argv[++i] ?? "";
    else if (arg === "--url") args.url = argv[++i] ?? "";
    else if (arg === "--out-dir") args.outDir = argv[++i] ?? args.outDir;
    else if (arg === "--fail-on-budget") args.failOnBudget = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function usage() {
  return `
Usage:
  node dev/agents/artifacts/script/patronpro-liverpool/lighthouse-analyze.mjs --input <file-or-dir> --out <summary.md> --json-out <summary.json>
  node dev/agents/artifacts/script/patronpro-liverpool/lighthouse-analyze.mjs --url <preview-url> --out-dir <dir> --out <summary.md> --json-out <summary.json>
  node dev/agents/artifacts/script/patronpro-liverpool/lighthouse-analyze.mjs --input <raw-json-dir> --fail-on-budget

Notes:
  --url runs mobile and desktop Lighthouse, stores the raw JSON in --out-dir, then analyzes it.
  --input only analyzes existing Lighthouse JSON files.
  --fail-on-budget exits non-zero after writing outputs when any budget check misses.
`.trim();
}

const KIB = 1024;
const BUDGETS = {
  mobile: {
    performanceMin: 70,
    lcpMs: 2500,
    targetLcpMs: 1000,
    imageTransferBytes: 200 * KIB,
    totalTransferBytes: 800 * KIB,
  },
  desktop: {
    performanceMin: 90,
    lcpMs: 1500,
    targetLcpMs: 1000,
    imageTransferBytes: 800 * KIB,
    totalTransferBytes: 1500 * KIB,
  },
  unknown: {
    performanceMin: 0,
    lcpMs: 2500,
    targetLcpMs: 1000,
    imageTransferBytes: 800 * KIB,
    totalTransferBytes: 1500 * KIB,
  },
};

function runLighthouse(url, outDir) {
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "Z");
  const runs = [
    { label: "mobile", file: path.join(outDir, `lighthouse-mobile-${stamp}.json`), extra: [] },
    { label: "desktop", file: path.join(outDir, `lighthouse-desktop-${stamp}.json`), extra: ["--preset=desktop"] },
  ];

  for (const run of runs) {
    const result = spawnSync(
      "lighthouse",
      [
        url,
        "--quiet",
        "--output=json",
        `--output-path=${run.file}`,
        "--chrome-flags=--headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage",
        ...run.extra,
      ],
      { stdio: "inherit", env: { ...process.env, CHROME_PATH: process.env.CHROME_PATH || "/usr/bin/google-chrome" } },
    );

    if (result.status !== 0) {
      throw new Error(`Lighthouse ${run.label} failed with exit ${result.status}`);
    }
  }

  return outDir;
}

function collectFiles(input) {
  if (!input) throw new Error("--input or --url is required");
  if (!existsSync(input)) throw new Error(`Input not found: ${input}`);
  if (statSync(input).isDirectory()) {
    const statFiles = [];
    const entries = readdirSync(input, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) continue;
      statFiles.push(path.join(input, entry.name));
    }
    return statFiles;
  }
  return [input];
}

function lighthouseJson(file) {
  const json = JSON.parse(readFileSync(file, "utf8"));
  if (!json.categories || !json.audits) return null;
  return json;
}

function score(category) {
  return Math.round((category?.score ?? 0) * 100);
}

function auditDisplay(lhr, id) {
  const audit = lhr.audits?.[id];
  return audit?.displayValue ?? "";
}

function auditNumeric(lhr, id) {
  const audit = lhr.audits?.[id];
  return typeof audit?.numericValue === "number" ? audit.numericValue : null;
}

function bytesToKib(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function formatBudgetValue(label, value) {
  if (value === null || value === undefined) return "n/a";
  if (label.includes("Bytes")) return bytesToKib(value);
  if (label.includes("Ms")) return `${Math.round(value)} ms`;
  return String(value);
}

function resourceSummary(lhr) {
  const items = lhr.audits?.["resource-summary"]?.details?.items ?? [];
  const total = items.find((item) => item.resourceType === "total")?.transferSize ?? 0;
  const image = items.find((item) => item.resourceType === "image")?.transferSize ?? 0;
  return {
    totalTransferBytes: total,
    imageTransferBytes: image,
    imagePercent: total ? Math.round((image / total) * 1000) / 10 : 0,
  };
}

function lcpElement(lhr) {
  const item = lhr.audits?.["largest-contentful-paint-element"]?.details?.items?.[0] ?? null;
  const node = item?.node ?? {};
  return {
    auditPresent: Boolean(item),
    snippet: node.snippet ?? item?.snippet ?? "",
    selector: node.selector ?? "",
    nodeLabel: node.nodeLabel ?? "",
    path: node.path ?? "",
    url: item?.url ?? node.url ?? "",
    boundingRect: node.boundingRect ?? item?.boundingRect ?? null,
  };
}

function lcpPhaseTimings(lhr) {
  const lcpAudit = lhr.audits?.["largest-contentful-paint"];
  const metricItem = lhr.audits?.metrics?.details?.items?.[0] ?? {};
  const detailItems = Array.isArray(lcpAudit?.details?.items) ? lcpAudit.details.items : [];
  const phases = detailItems
    .map((item) => ({
      phase: item.phase ?? item.label ?? item.group ?? item.name ?? "",
      timingMs: typeof item.timing === "number" ? item.timing : typeof item.duration === "number" ? item.duration : null,
      percent: typeof item.percent === "number" ? item.percent : null,
    }))
    .filter((item) => item.phase || item.timingMs !== null || item.percent !== null);

  return {
    auditNumericMs: auditNumeric(lhr, "largest-contentful-paint"),
    lcpResult: metricItem.lcpResult ?? metricItem.largestContentfulPaint ?? null,
    observedLargestContentfulPaint: metricItem.observedLargestContentfulPaint ?? null,
    observedLargestContentfulPaintTs: metricItem.observedLargestContentfulPaintTs ?? null,
    observedLoad: metricItem.observedLoad ?? null,
    phases,
  };
}

function imageRequests(lhr) {
  const items = lhr.audits?.["network-requests"]?.details?.items ?? [];
  return items
    .filter((item) => item.resourceType === "Image" || String(item.mimeType ?? "").startsWith("image/"))
    .map((item) => ({
      url: item.url,
      mimeType: item.mimeType,
      transferSize: item.transferSize ?? 0,
    }))
    .sort((a, b) => b.transferSize - a.transferSize)
    .slice(0, 10);
}

function budgetForFormFactor(formFactor) {
  return BUDGETS[formFactor] ?? BUDGETS.unknown;
}

function budgetCheck(label, actual, threshold, passesWhen = "<=") {
  const pass = typeof actual === "number" && (
    passesWhen === ">=" ? actual >= threshold : actual <= threshold
  );
  return {
    label,
    actual,
    threshold,
    operator: passesWhen,
    pass,
  };
}

function budgetStatus(run) {
  const thresholds = budgetForFormFactor(run.formFactor);
  const checks = [
    budgetCheck("performance", run.scores.performance, thresholds.performanceMin, ">="),
    budgetCheck("lcpMs", run.metrics.lcpMs, thresholds.lcpMs),
    budgetCheck("imageTransferBytes", run.resourceSummary.imageTransferBytes, thresholds.imageTransferBytes),
    budgetCheck("totalTransferBytes", run.resourceSummary.totalTransferBytes, thresholds.totalTransferBytes),
  ];
  const targetChecks = [
    budgetCheck("targetLcpMs", run.metrics.lcpMs, thresholds.targetLcpMs),
  ];
  return {
    formFactor: run.formFactor,
    thresholds,
    checks,
    pass: checks.every((check) => check.pass),
    targetChecks,
    targetPass: targetChecks.every((check) => check.pass),
  };
}

function opportunities(lhr) {
  const ids = [
    "largest-contentful-paint",
    "largest-contentful-paint-element",
    "uses-optimized-images",
    "modern-image-formats",
    "uses-responsive-images",
    "offscreen-images",
    "uses-rel-preload",
    "render-blocking-resources",
    "unminified-css",
    "unminified-javascript",
    "unused-css-rules",
    "unused-javascript",
  ];

  return ids
    .map((id) => {
      const audit = lhr.audits?.[id];
      if (!audit) return null;
      const scoreValue = audit.score;
      if (scoreValue === 1 && id !== "largest-contentful-paint" && id !== "largest-contentful-paint-element") return null;
      return {
        id,
        title: audit.title,
        score: scoreValue,
        displayValue: audit.displayValue ?? "",
        description: audit.description ?? "",
      };
    })
    .filter(Boolean);
}

function analyzeFile(file) {
  const lhr = lighthouseJson(file);
  if (!lhr) return null;
  const categories = lhr.categories ?? {};
  const settings = lhr.configSettings ?? {};
  const run = {
    file,
    finalUrl: lhr.finalDisplayedUrl ?? lhr.finalUrl ?? "",
    fetchTime: lhr.fetchTime ?? "",
    lighthouseVersion: lhr.lighthouseVersion ?? "",
    formFactor: settings.formFactor ?? "unknown",
    screenEmulation: settings.screenEmulation ?? null,
    scores: {
      performance: score(categories.performance),
      accessibility: score(categories.accessibility),
      bestPractices: score(categories["best-practices"]),
      seo: score(categories.seo),
    },
    metrics: {
      fcp: auditDisplay(lhr, "first-contentful-paint"),
      lcp: auditDisplay(lhr, "largest-contentful-paint"),
      lcpMs: auditNumeric(lhr, "largest-contentful-paint"),
      speedIndex: auditDisplay(lhr, "speed-index"),
      tbt: auditDisplay(lhr, "total-blocking-time"),
      cls: auditDisplay(lhr, "cumulative-layout-shift"),
      lcpElement: lcpElement(lhr),
      lcpPhases: lcpPhaseTimings(lhr),
    },
    resourceSummary: resourceSummary(lhr),
    imageRequests: imageRequests(lhr),
    opportunities: opportunities(lhr),
  };
  run.budget = budgetStatus(run);
  return run;
}

function markdownReport(summary) {
  const lines = [
    "# Lighthouse Automation Summary",
    "",
    `Generated: \`${summary.generatedAt}\``,
    "",
  ];

  for (const run of summary.runs) {
    lines.push(`## ${path.basename(run.file)}`);
    lines.push("");
    lines.push(`- URL: \`${run.finalUrl}\``);
    lines.push(`- Fetch time: \`${run.fetchTime}\``);
    lines.push(`- Lighthouse: \`${run.lighthouseVersion}\``);
    lines.push(`- Form factor: \`${run.formFactor}\``);
    if (run.screenEmulation) {
      lines.push(`- Screen emulation: mobile=\`${run.screenEmulation.mobile}\`, width=\`${run.screenEmulation.width}\`, height=\`${run.screenEmulation.height}\``);
    }
    lines.push(`- Scores: performance \`${run.scores.performance}\`, accessibility \`${run.scores.accessibility}\`, best practices \`${run.scores.bestPractices}\`, SEO \`${run.scores.seo}\``);
    lines.push(`- FCP: \`${run.metrics.fcp}\``);
    lines.push(`- LCP: \`${run.metrics.lcp}\``);
    lines.push(`- LCP element: \`${run.metrics.lcpElement.snippet || run.metrics.lcpElement.nodeLabel || "not reported"}\``);
    lines.push(`- LCP selector: \`${run.metrics.lcpElement.selector || "not reported"}\``);
    lines.push(`- LCP observed: \`${run.metrics.lcpPhases.observedLargestContentfulPaint ?? "not reported"}\`; phase rows: \`${run.metrics.lcpPhases.phases.length}\``);
    lines.push(`- Speed Index: \`${run.metrics.speedIndex}\``);
    lines.push(`- TBT: \`${run.metrics.tbt}\``);
    lines.push(`- CLS: \`${run.metrics.cls}\``);
    lines.push("");
    lines.push("### Payload");
    lines.push("");
    lines.push(`- Total transfer: \`${bytesToKib(run.resourceSummary.totalTransferBytes)}\``);
    lines.push(`- Image transfer: \`${bytesToKib(run.resourceSummary.imageTransferBytes)}\` (${run.resourceSummary.imagePercent}% of total)`);
    lines.push("");
    lines.push("### Budgets");
    lines.push("");
    lines.push(`- Current budget: \`${run.budget.pass ? "pass" : "fail"}\``);
    lines.push(`- Sub-second LCP target: \`${run.budget.targetPass ? "pass" : "fail"}\``);
    for (const check of run.budget.checks) {
      lines.push(`- \`${check.label}\`: ${formatBudgetValue(check.label, check.actual)} ${check.operator} ${formatBudgetValue(check.label, check.threshold)} -> \`${check.pass ? "pass" : "fail"}\``);
    }
    for (const check of run.budget.targetChecks) {
      lines.push(`- \`${check.label}\`: ${formatBudgetValue(check.label, check.actual)} ${check.operator} ${formatBudgetValue(check.label, check.threshold)} -> \`${check.pass ? "pass" : "fail"}\``);
    }
    lines.push("");
    lines.push("### Largest Image Requests");
    lines.push("");
    for (const request of run.imageRequests) {
      lines.push(`- \`${request.mimeType || "unknown"}\` \`${bytesToKib(request.transferSize)}\` - ${request.url}`);
    }
    lines.push("");
    lines.push("### Opportunities");
    lines.push("");
    for (const opp of run.opportunities) {
      lines.push(`- \`${opp.id}\` ${opp.displayValue ? `(${opp.displayValue}) ` : ""}- ${opp.title}`);
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    return;
  }

  const input = args.url ? runLighthouse(args.url, args.outDir) : args.input;
  const files = collectFiles(input);
  const runs = files.map(analyzeFile).filter(Boolean);
  if (!runs.length) throw new Error("No Lighthouse JSON files found");

  const summary = {
    generatedAt: new Date().toISOString(),
    input,
    runs,
  };

  if (args.jsonOut) {
    mkdirSync(path.dirname(args.jsonOut), { recursive: true });
    writeFileSync(args.jsonOut, `${JSON.stringify(summary, null, 2)}\n`);
  }
  if (args.out) {
    mkdirSync(path.dirname(args.out), { recursive: true });
    writeFileSync(args.out, markdownReport(summary));
  }

  const budgetFailures = runs.filter((run) => !run.budget.pass);
  console.log(JSON.stringify({
    runs: runs.length,
    out: args.out || null,
    jsonOut: args.jsonOut || null,
    budgetFailures: budgetFailures.map((run) => ({
      file: run.file,
      formFactor: run.formFactor,
      failed: run.budget.checks.filter((check) => !check.pass).map((check) => check.label),
    })),
  }, null, 2));
  if (args.failOnBudget && budgetFailures.length) {
    throw new Error(`Budget check failed for ${budgetFailures.length} run(s). Outputs were written before failure.`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
