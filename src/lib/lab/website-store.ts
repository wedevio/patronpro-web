import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { LAB_ACCOUNT_ID } from "./panel-lab";
import { runtimeEnv } from "@/lib/lab/runtime-env";
import type { WebsiteAssetManifest } from "@/lib/website/asset-optimizer";
import type { WebsiteImageVariant } from "@/lib/website/image-variants";

export interface LabWebsiteRecord {
  account_id: string;
  status: "pending" | "generating" | "ready" | "error";
  html: string | null;
  hero_image_url: string | null;
  about_image_url: string | null;
  contact_image_url: string | null;
  images_status: "pending" | "generating" | "ready" | "error" | null;
  asset_manifest?: WebsiteAssetManifest;
  asset_optimization_status?: "idle" | "running" | "optimized" | "partial" | "skipped" | "failed" | null;
  asset_optimization_error?: string | null;
  html_reference_status?: "current_merge_tags" | "refreshed" | "noop_unsupported" | null;
  html_last_refreshed_at?: string | null;
  html_snapshot?: unknown;
  generated_at: string | null;
  updated_at: string | null;
  error_message: string | null;
}

function labDataDir(): string {
  return runtimeEnv("LAB_PANEL_DATA_DIR") || path.join(process.cwd(), ".lab");
}

function publicBaseUrl(): string {
  return (runtimeEnv("NEXT_PUBLIC_APP_URL") || "http://127.0.0.1:3024").replace(/\/$/, "");
}

async function ensureLabDirs(): Promise<void> {
  await mkdir(labDataDir(), { recursive: true });
  await mkdir(path.join(process.cwd(), "public", "lab-assets"), { recursive: true });
}

function storePath(): string {
  return path.join(labDataDir(), "website-store.json");
}

export function defaultLabWebsite(): LabWebsiteRecord {
  const now = new Date().toISOString();
  return {
    account_id: LAB_ACCOUNT_ID,
    status: "pending",
    html: null,
    hero_image_url: null,
    about_image_url: null,
    contact_image_url: null,
    images_status: "pending",
    asset_manifest: undefined,
    asset_optimization_status: "idle",
    asset_optimization_error: null,
    html_reference_status: null,
    html_last_refreshed_at: null,
    generated_at: null,
    updated_at: now,
    error_message: null,
  };
}

export async function readLabWebsite(): Promise<LabWebsiteRecord> {
  await ensureLabDirs();
  try {
    const raw = await readFile(storePath(), "utf8");
    return { ...defaultLabWebsite(), ...(JSON.parse(raw) as Partial<LabWebsiteRecord>) };
  } catch {
    const website = defaultLabWebsite();
    await writeLabWebsite(website);
    return website;
  }
}

export async function writeLabWebsite(patch: Partial<LabWebsiteRecord>): Promise<LabWebsiteRecord> {
  await ensureLabDirs();
  const current = await readLabWebsiteSafe();
  const cleanPatch = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as Partial<LabWebsiteRecord>;
  const next: LabWebsiteRecord = {
    ...current,
    ...cleanPatch,
    account_id: LAB_ACCOUNT_ID,
    updated_at: new Date().toISOString(),
  };
  await writeFile(storePath(), JSON.stringify(next, null, 2));
  return next;
}

async function readLabWebsiteSafe(): Promise<LabWebsiteRecord> {
  try {
    const raw = await readFile(storePath(), "utf8");
    return { ...defaultLabWebsite(), ...(JSON.parse(raw) as Partial<LabWebsiteRecord>) };
  } catch {
    return defaultLabWebsite();
  }
}

export async function resetLabWebsite(): Promise<LabWebsiteRecord> {
  return writeLabWebsite(defaultLabWebsite());
}

export async function writeLabAsset(
  folder: string,
  asset: { filename: string; buffer: Buffer },
): Promise<string> {
  await ensureLabDirs();
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "-");
  const dir = path.join(process.cwd(), "public", "lab-assets", safeFolder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, asset.filename), asset.buffer);
  return `${publicBaseUrl()}/lab-assets/${safeFolder}/${asset.filename}`;
}

export async function writeLabVariant(
  folder: string,
  variant: WebsiteImageVariant,
): Promise<WebsiteImageVariant> {
  const publicUrl = await writeLabAsset(folder, variant);
  return { ...variant, publicUrl };
}

export async function readLabAssetBufferFromUrl(url: string): Promise<Buffer | null> {
  const parsed = url.startsWith("/") ? new URL(url, publicBaseUrl()) : new URL(url);
  const prefix = "/lab-assets/";
  if (!parsed.pathname.startsWith(prefix)) return null;
  const relative = parsed.pathname.slice(prefix.length).split("/").map(decodeURIComponent);
  if (relative.some((part) => part === ".." || part.includes(path.sep))) return null;
  try {
    return await readFile(path.join(process.cwd(), "public", "lab-assets", ...relative));
  } catch {
    return null;
  }
}
