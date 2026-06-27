export type AdditionalSocialMergeResult = {
  value: string;
  lineCount: number;
  localLineCount: number;
  remotePreservedLineCount: number;
  truncated: boolean;
};

const URL_PATTERN = /https?:\/\/[^\s<>()]+/i;
const TRACKING_PARAMS = new Set(["fbclid", "gclid", "igshid", "mc_cid", "mc_eid"]);

function readLine(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function extractUrlFromAdditionalSocialLine(line: string | null | undefined) {
  const match = readLine(line)?.match(URL_PATTERN)?.[0];
  return match?.replace(/[),.;]+$/g, "") ?? null;
}

export function canonicalSocialUrlKey(value: string | null | undefined) {
  const url = extractUrlFromAdditionalSocialLine(value) ?? readLine(value);
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    const path = parsed.pathname.replace(/\/+$/g, "").toLowerCase();
    const params = new URLSearchParams(parsed.search);
    for (const key of Array.from(params.keys())) {
      if (key.toLowerCase().startsWith("utm_") || TRACKING_PARAMS.has(key.toLowerCase())) {
        params.delete(key);
      }
    }
    params.sort();
    const query = params.toString();
    return `${host}${path}${query ? `?${query.toLowerCase()}` : ""}`;
  } catch {
    return url.toLowerCase().replace(/\/+$/g, "");
  }
}

function textLineKey(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function splitLines(value: string | null | undefined) {
  return (value ?? "").split(/\r?\n/g).map((line) => line.trim()).filter(Boolean);
}

function appendWithinLimit(lines: string[], maxChars: number) {
  const accepted: string[] = [];
  let truncated = false;
  for (const line of lines) {
    const candidate = [...accepted, line].join("\n");
    if (candidate.length <= maxChars) {
      accepted.push(line);
      continue;
    }
    truncated = true;
    if (!accepted.length && maxChars > 0) accepted.push(line.slice(0, maxChars));
    break;
  }
  return { value: accepted.join("\n"), lineCount: accepted.length, truncated };
}

export function mergeAdditionalSocialLines(
  localLines: string[],
  remoteValue: string | null | undefined,
  maxChars = 3500
): AdditionalSocialMergeResult {
  const merged: string[] = [];
  const seenUrlKeys = new Set<string>();
  const seenTextKeys = new Set<string>();
  let localLineCount = 0;
  let remotePreservedLineCount = 0;

  const pushLine = (line: string, source: "local" | "remote") => {
    const trimmed = readLine(line);
    if (!trimmed) return;
    const urlKey = canonicalSocialUrlKey(trimmed);
    if (urlKey) {
      if (seenUrlKeys.has(urlKey)) return;
      seenUrlKeys.add(urlKey);
    } else {
      const key = textLineKey(trimmed);
      if (seenTextKeys.has(key)) return;
      seenTextKeys.add(key);
    }
    merged.push(trimmed);
    if (source === "local") localLineCount += 1;
    else remotePreservedLineCount += 1;
  };

  for (const line of localLines) pushLine(line, "local");
  for (const line of splitLines(remoteValue)) pushLine(line, "remote");

  const limited = appendWithinLimit(merged, maxChars);
  return {
    value: limited.value,
    lineCount: limited.lineCount,
    localLineCount,
    remotePreservedLineCount,
    truncated: limited.truncated,
  };
}
