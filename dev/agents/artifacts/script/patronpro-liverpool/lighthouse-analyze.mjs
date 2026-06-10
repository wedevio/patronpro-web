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
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--input") args.input = argv[++i] ?? "";
    else if (arg === "--out") args.out = argv[++i] ?? "";
    else if (arg === "--json-out") args.jsonOut = argv[++i] ?? "";
    else if (arg === "--url") args.url = argv[++i] ?? "";
    else if (arg === "--out-dir") args.outDir = argv[++i] ?? args.outDir;
    else if (arg === "--help" || arg === "-h") args.help = true;
  }

  return args;
}

function usage() {
  return `
Usage:
  node dev/agents/artifacts/script/patronpro-liverpool/lighthouse-analyze.mjs --input <file-or-dir> --out <summary.md> --json-out <summary.json>
  node dev/agents/artifacts/script/patronpro-liverpool/lighthouse-analyze.mjs --url <preview-url> --out-dir <dir> --out <summary.md> --json-out <summary.json>

Notes:
  --url runs mobile and desktop Lighthouse through bunx, then analyzes the resulting JSON.
  --input only analyzes existing Lighthouse JSON files.
`.trim();
}

function runLighthouse(url, outDir) {
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "Z");
  const runs = [
    { label: "mobile", file: path.join(outDir, `lighthouse-mobile-${stamp}.json`), extra: [] },
    { label: "desktop", file: path.join(outDir, `lighthouse-desktop-${stamp}.json`), extra: ["--preset=desktop"] },
  ];

  for (const run of runs) {
    const result = spawnSync(
      "bunx",
      [
        "lighthouse",
        url,
        "--quiet",
        "--output=json",
        `--output-path=${run.file}`,
        "--chrome-flags=--headless=new",
        ...run.extra,
      ],
      { stdio: "inherit" },
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
  return {
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
    },
    resourceSummary: resourceSummary(lhr),
    imageRequests: imageRequests(lhr),
    opportunities: opportunities(lhr),
  };
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
    lines.push(`- Speed Index: \`${run.metrics.speedIndex}\``);
    lines.push(`- TBT: \`${run.metrics.tbt}\``);
    lines.push(`- CLS: \`${run.metrics.cls}\``);
    lines.push("");
    lines.push("### Payload");
    lines.push("");
    lines.push(`- Total transfer: \`${bytesToKib(run.resourceSummary.totalTransferBytes)}\``);
    lines.push(`- Image transfer: \`${bytesToKib(run.resourceSummary.imageTransferBytes)}\` (${run.resourceSummary.imagePercent}% of total)`);
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

  console.log(JSON.stringify({
    runs: runs.length,
    out: args.out || null,
    jsonOut: args.jsonOut || null,
  }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
