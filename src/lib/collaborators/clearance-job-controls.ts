import { createHash } from "crypto";

export type ClearancePlatform = "youtube" | "tiktok";
export type DateRangePreset = "all_time" | "last_30_days" | "last_90_days" | "current_year" | "custom";
export type IntentPreset = "commercial_signals" | "crm_software" | "sponsor_affiliate" | "product_endorsement" | "events_courses" | "custom";

export class ClearanceControlError extends Error {
  readonly status = 400;
}

export const ADAPTER_VERSION = "commercial-clearance-adapter-v1";
export const PLATFORM_CAPS: Record<ClearancePlatform, number> = {
  youtube: 25,
  tiktok: 20,
};

const DATE_PRESETS = new Set<DateRangePreset>(["all_time", "last_30_days", "last_90_days", "current_year", "custom"]);
const INTENT_PRESETS = new Set<IntentPreset>([
  "commercial_signals",
  "crm_software",
  "sponsor_affiliate",
  "product_endorsement",
  "events_courses",
  "custom",
]);

export type ClearanceJobControls = {
  apply: boolean;
  maxRecords: number;
  dateRangePreset: DateRangePreset;
  dateStart: string | null;
  dateEnd: string | null;
  intentPreset: IntentPreset;
  customQuery: string | null;
  paidRouteEnabled: false;
  outreachEnabled: false;
};

export function readString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export function readPlatform(value: unknown): ClearancePlatform {
  const platform = readString(value)?.toLowerCase();
  if (platform === "youtube" || platform === "tiktok") return platform;
  throw new ClearanceControlError("platform must be youtube or tiktok for this clearance slice");
}

export function readScope(platform: ClearancePlatform, value: unknown) {
  const fallback = platform === "youtube" ? "metadata_smoke" : "metadata_smoke";
  const scope = readString(value)?.toLowerCase() ?? fallback;
  if (platform === "youtube" && ["metadata_smoke", "subtitle_smoke", "smoke"].includes(scope)) return scope;
  if (platform === "tiktok" && ["metadata_smoke", "smoke"].includes(scope)) return scope;
  throw new ClearanceControlError(`unsupported ${platform} clearance scope`);
}

export function adapterFor(platform: ClearancePlatform, scope: string) {
  if (platform === "youtube" && ["metadata_smoke", "subtitle_smoke", "smoke"].includes(scope)) return "youtube_subtitles_smoke";
  if (platform === "tiktok" && ["metadata_smoke", "smoke"].includes(scope)) return "tiktok_public_metadata_smoke";
  throw new ClearanceControlError("unsupported clearance adapter");
}

export function stableJsonHash(payload: Record<string, unknown>) {
  const ordered = Object.keys(payload)
    .sort()
    .reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = payload[key];
      return acc;
    }, {});
  return createHash("sha256").update(JSON.stringify(ordered)).digest("hex");
}

export function canonicalizeUrl(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ClearanceControlError("sourceUrl must be an absolute URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) throw new ClearanceControlError("sourceUrl must be http(s)");
  let host = parsed.hostname.toLowerCase();
  if (host.startsWith("www.")) host = host.slice(4);
  if (host.startsWith("m.")) host = host.slice(2);
  const path = parsed.pathname.replace(/\/+/g, "/").replace(/\/+$/, "");
  return `https://${host}${path}`;
}

export function matchKey(platform: ClearancePlatform, url: string) {
  const canonical = canonicalizeUrl(url).toLowerCase();
  if (platform === "youtube") return canonical.replace(/\/videos$/, "");
  return canonical;
}

export function clearanceRunId(
  candidateId: string,
  platform: ClearancePlatform,
  adapter: string,
  canonicalUrl: string,
  scope: string,
  controls: ClearanceJobControls
) {
  return `clear_${candidateId.toLowerCase()}_${platform}_${stableJsonHash({
    adapter,
    candidateId,
    canonicalUrl,
    controls: idempotentControls(controls),
    platform,
    scope,
  }).slice(0, 16)}`;
}

export function idempotentControls(controls: ClearanceJobControls) {
  return {
    maxRecords: controls.maxRecords,
    dateRangePreset: controls.dateRangePreset,
    dateStart: controls.dateStart,
    dateEnd: controls.dateEnd,
    intentPreset: controls.intentPreset,
    customQuery: controls.customQuery,
    paidRouteEnabled: false,
    outreachEnabled: false,
  };
}

function readDate(value: unknown, label: string) {
  const text = readString(value);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new ClearanceControlError(`${label} must be YYYY-MM-DD`);
  const date = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    throw new ClearanceControlError(`${label} must be a valid date`);
  }
  return text;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addUtcDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function parseDateRange(body: Record<string, unknown>, now: Date): Pick<ClearanceJobControls, "dateRangePreset" | "dateStart" | "dateEnd"> {
  const rawPreset = (readString(body.dateRangePreset) ?? "all_time").toLowerCase();
  if (!DATE_PRESETS.has(rawPreset as DateRangePreset)) throw new ClearanceControlError("unsupported dateRangePreset");
  const dateRangePreset = rawPreset as DateRangePreset;
  if (dateRangePreset === "all_time") return { dateRangePreset, dateStart: null, dateEnd: null };
  if (dateRangePreset === "last_30_days") return { dateRangePreset, dateStart: isoDate(addUtcDays(now, -30)), dateEnd: isoDate(now) };
  if (dateRangePreset === "last_90_days") return { dateRangePreset, dateStart: isoDate(addUtcDays(now, -90)), dateEnd: isoDate(now) };
  if (dateRangePreset === "current_year") return { dateRangePreset, dateStart: `${now.getUTCFullYear()}-01-01`, dateEnd: isoDate(now) };

  const dateStart = readDate(body.dateStart, "dateStart");
  const dateEnd = readDate(body.dateEnd, "dateEnd");
  if (!dateStart || !dateEnd) throw new ClearanceControlError("custom date range requires dateStart and dateEnd");
  if (dateStart > dateEnd) throw new ClearanceControlError("dateStart must be before or equal to dateEnd");
  const spanDays = Math.round((new Date(`${dateEnd}T00:00:00.000Z`).getTime() - new Date(`${dateStart}T00:00:00.000Z`).getTime()) / 86400000) + 1;
  if (spanDays > 366) throw new ClearanceControlError("custom date range must be 366 days or less");
  return { dateRangePreset, dateStart, dateEnd };
}

function parseMaxRecords(body: Record<string, unknown>, platform: ClearancePlatform) {
  const fallback = PLATFORM_CAPS[platform];
  const raw = body.maxRecords ?? fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || Math.floor(value) !== value) throw new ClearanceControlError("maxRecords must be an integer");
  if (value < 1 || value > PLATFORM_CAPS[platform]) throw new ClearanceControlError(`maxRecords must be between 1 and ${PLATFORM_CAPS[platform]} for ${platform}`);
  return value;
}

function parseIntent(body: Record<string, unknown>): Pick<ClearanceJobControls, "intentPreset" | "customQuery"> {
  const rawPreset = (readString(body.intentPreset) ?? "commercial_signals").toLowerCase();
  if (!INTENT_PRESETS.has(rawPreset as IntentPreset)) throw new ClearanceControlError("unsupported intentPreset");
  const intentPreset = rawPreset as IntentPreset;
  const customQuery = readString(body.customQuery);
  if (customQuery && customQuery.length > 180) throw new ClearanceControlError("customQuery must be 180 characters or less");
  if (intentPreset === "custom" && !customQuery) throw new ClearanceControlError("custom intent requires customQuery");
  return { intentPreset, customQuery: customQuery ?? null };
}

export function parseClearanceJobControls(body: Record<string, unknown>, platform: ClearancePlatform, now = new Date()): ClearanceJobControls {
  if (body.paidRoute === true || body.paidRouteEnabled === true) throw new ClearanceControlError("paid routes are disabled for clearance jobs");
  if (body.outreach === true || body.sendOutreach === true || body.outreachEnabled === true) throw new ClearanceControlError("outreach cannot be triggered by clearance jobs");
  return {
    apply: body.apply === true,
    maxRecords: parseMaxRecords(body, platform),
    ...parseDateRange(body, now),
    ...parseIntent(body),
    paidRouteEnabled: false,
    outreachEnabled: false,
  };
}
