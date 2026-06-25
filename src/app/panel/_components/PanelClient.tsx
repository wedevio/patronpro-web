"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  Circle,
  X,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  CreditCard,
  Tag,
  Clock,
  PhoneCall,
  BadgeCheck,
  CheckCheck,
  CalendarClock,
  Copy,
  Download,
  Check,
  Loader2,
  AlertCircle,
  Code2,
  RefreshCw,
  Sparkles,
  UserCheck,
} from "lucide-react";
import type { PanelSubmission, ChecklistItemId } from "@/lib/panel/store";
import { CHECKLIST_ITEMS } from "@/lib/panel/store";
import type { GHLLocationData } from "@/lib/panel/ghl-enrich";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EnrichedAccount {
  locationId: string;
  submission: PanelSubmission | null;
  ghl: GHLLocationData;
}

type SetupMode = "inspect" | "apply" | "verify" | "reset";
type SetupStatus = "pass" | "updated" | "warning" | "blocked" | "failed" | "skipped" | "needs_browser";
type ManualOnboardingLink = { link: string; expiresAt: string; generatedAt?: string | null };
interface SetupStepResult {
  id: string;
  label: string;
  status: SetupStatus;
  details?: unknown;
  error?: string;
}
interface SetupResult {
  mode: SetupMode;
  ok: boolean;
  steps: SetupStepResult[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countDone(checklist: Record<ChecklistItemId, boolean>): number {
  return CHECKLIST_ITEMS.filter((i) => checklist[i.id]).length;
}

function progressPct(checklist: Record<ChecklistItemId, boolean>): number {
  return Math.round((countDone(checklist) / CHECKLIST_ITEMS.length) * 100);
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "active" || s === "trialing")
    return <Badge color="green">{s === "trialing" ? "Trial" : "Activo"}</Badge>;
  if (s === "canceled" || s === "cancelled" || s === "inactive" || s === "suspended")
    return <Badge color="red">{s === "canceled" || s === "cancelled" ? "Cancelado" : "Inactivo"}</Badge>;
  if (s === "paused")
    return <Badge color="amber">Pausado</Badge>;
  if (s === "past_due")
    return <Badge color="amber">Vencido</Badge>;
  return <Badge color="gray">—</Badge>;
}

type BadgeColor = "green" | "red" | "amber" | "blue" | "gray" | "orange";

const BADGE_STYLES: Record<BadgeColor, string> = {
  green:  "bg-green-100 text-green-700",
  red:    "bg-red-100 text-red-700",
  amber:  "bg-amber-100 text-amber-700",
  blue:   "bg-blue-100 text-blue-700",
  gray:   "bg-slate-100 text-slate-400",
  orange: "bg-orange-100 text-orange-700",
};

function Badge({ color, children }: { color: BadgeColor; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap ${BADGE_STYLES[color]}`}>
      {children}
    </span>
  );
}

function YesNoBadge({ active, labelYes, labelNo }: { active: boolean; labelYes: string; labelNo: string }) {
  return active
    ? <Badge color="green"><BadgeCheck size={10} />{labelYes}</Badge>
    : <Badge color="gray">{labelNo}</Badge>;
}

function setupStatusColor(status: SetupStatus): BadgeColor {
  if (status === "pass" || status === "updated") return "green";
  if (status === "warning" || status === "needs_browser") return "amber";
  if (status === "failed" || status === "blocked") return "red";
  return "gray";
}

function setupStatusLabel(status: SetupStatus): string {
  const labels: Record<SetupStatus, string> = {
    pass: "OK",
    updated: "Actualizado",
    warning: "Revisar",
    blocked: "Bloqueado",
    failed: "Falló",
    skipped: "Omitido",
    needs_browser: "Navegador",
  };
  return labels[status];
}

function setupModeLabel(mode: SetupMode): string {
  const labels: Record<SetupMode, string> = {
    inspect: "Revisión",
    apply: "Configuración previa",
    verify: "Verificación",
    reset: "Reset test",
  };
  return labels[mode];
}

const LIVERPOOL_DIGITAL_LOCATION_ID = "4cPIvLND9hFAIzWQ1ZbL";

function onboardingLinkFromSubmission(submission: PanelSubmission | null): ManualOnboardingLink | null {
  if (!submission?.onboardingLink || !submission.onboardingLinkExpiresAt) return null;
  return {
    link: submission.onboardingLink,
    expiresAt: submission.onboardingLinkExpiresAt,
    generatedAt: submission.onboardingLinkGeneratedAt,
  };
}

function onboardingLinkIsActive(link: ManualOnboardingLink | null): boolean {
  const timestamp = Date.parse(link?.expiresAt ?? "");
  return !Number.isNaN(timestamp) && timestamp > Date.now();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ pct, width = "w-20" }: { pct: number; width?: string }) {
  const color = pct === 100 ? "#22c55e" : pct >= 50 ? "#F67D0A" : "#94a3b8";
  return (
    <div className={`${width} h-1.5 rounded-full bg-slate-200 overflow-hidden shrink-0`}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ─── Website Section ──────────────────────────────────────────────────────────

interface WebsiteData {
  status: "pending" | "generating" | "ready" | "error";
  html: string | null;
  hero_image_url: string | null;
  about_image_url: string | null;
  contact_image_url: string | null;
  images_status: "pending" | "generating" | "ready" | "error" | null;
  asset_manifest?: unknown;
  asset_optimization_status?: "idle" | "running" | "optimized" | "partial" | "skipped" | "failed" | null;
  asset_optimization_error?: string | null;
  html_reference_status?: "current_merge_tags" | "refreshed" | "noop_unsupported" | null;
  html_last_refreshed_at?: string | null;
  generated_at: string | null;
  updated_at: string | null;
  error_message: string | null;
}

type WebsiteImageRole = "hero" | "about" | "contact";
type WebsiteAssetRole = WebsiteImageRole | "logo" | "logo_square";
type WebsiteImagePreview = { role: WebsiteImageRole; label: string; sourceUrl: string; url: string };
type LogoTarget = { role: "logo" | "logo_square"; label: string; sourceUrl: string };
type ManifestDerivative = { width?: number; format?: string; url?: string };
type ManifestAsset = { sourceUrl?: string; status?: string; derivatives?: ManifestDerivative[] };

const WEBSITE_IMAGE_ROLES: Array<{ role: WebsiteImageRole; label: string }> = [
  { role: "hero", label: "Hero" },
  { role: "about", label: "Nosotros" },
  { role: "contact", label: "Contacto" },
];
const WEBSITE_IMAGE_MERGE_TAG_PATTERN = /\{\{\s*custom_values\.website_/;

function sourceUrlForRole(data: WebsiteData, role: WebsiteImageRole): string | null {
  if (role === "hero") return data.hero_image_url;
  if (role === "about") return data.about_image_url;
  return data.contact_image_url;
}

function manifestAsset(data: WebsiteData, role: WebsiteAssetRole): ManifestAsset | null {
  const manifest = data.asset_manifest;
  if (!manifest || typeof manifest !== "object" || !("assets" in manifest)) return null;
  const assets = (manifest as { assets?: Record<string, unknown> }).assets;
  const asset = assets?.[role];
  return asset && typeof asset === "object" ? asset as ManifestAsset : null;
}

function preferredDerivative(asset: ManifestAsset | null): string | null {
  const derivatives = Array.isArray(asset?.derivatives) ? asset.derivatives : [];
  return (
    derivatives.find((item) => item.format === "webp" && item.width === 960)?.url ??
    derivatives.find((item) => item.format === "webp")?.url ??
    derivatives.find((item) => item.format === "jpg")?.url ??
    derivatives[0]?.url ??
    null
  );
}

function preferredLogoDerivative(asset: ManifestAsset | null): string | null {
  const derivatives = Array.isArray(asset?.derivatives) ? asset.derivatives : [];
  return (
    derivatives.find((item) => item.format === "webp" && item.width === 360)?.url ??
    derivatives.find((item) => item.format === "webp")?.url ??
    derivatives[0]?.url ??
    null
  );
}

function optimizedUrlForAsset(
  data: WebsiteData,
  role: WebsiteAssetRole,
  sourceUrl: string | null,
  preferred: (asset: ManifestAsset | null) => string | null
): string | null {
  const asset = manifestAsset(data, role);
  if (!sourceUrl || asset?.status !== "optimized" || asset.sourceUrl !== sourceUrl) return null;
  return preferred(asset);
}

function optimizedUrlForRole(data: WebsiteData, role: WebsiteImageRole): string | null {
  const sourceUrl = sourceUrlForRole(data, role);
  return optimizedUrlForAsset(data, role, sourceUrl, preferredDerivative);
}

function imagePreviews(data: WebsiteData): WebsiteImagePreview[] {
  return WEBSITE_IMAGE_ROLES.flatMap(({ role, label }) => {
    const sourceUrl = sourceUrlForRole(data, role);
    if (!sourceUrl) return [];
    return [{ role, label, sourceUrl, url: optimizedUrlForRole(data, role) ?? sourceUrl }];
  });
}

function imagesAreOptimized(data: WebsiteData): boolean {
  const previews = imagePreviews(data);
  return previews.length > 0 && previews.every((item) => Boolean(optimizedUrlForRole(data, item.role)));
}

function unoptimizedImageCount(data: WebsiteData): number {
  return imagePreviews(data).filter((item) => !optimizedUrlForRole(data, item.role)).length;
}

function logoTargets(submission: PanelSubmission | null): LogoTarget[] {
  const logoUrl = submission?.logoUrl?.trim();
  if (!logoUrl) return [];
  const logoSquareUrl = submission?.logoSquareUrl?.trim() || logoUrl;
  return [
    { role: "logo", label: "Logo", sourceUrl: logoUrl },
    { role: "logo_square", label: "Logo cuadrado", sourceUrl: logoSquareUrl },
  ];
}

function optimizedUrlForLogoTarget(data: WebsiteData, target: LogoTarget): string | null {
  return optimizedUrlForAsset(data, target.role, target.sourceUrl, preferredLogoDerivative);
}

function logosAreOptimized(data: WebsiteData, submission: PanelSubmission | null): boolean {
  const targets = logoTargets(submission);
  return targets.length > 0 && targets.every((target) => Boolean(optimizedUrlForLogoTarget(data, target)));
}

function unoptimizedLogoCount(data: WebsiteData, submission: PanelSubmission | null): number {
  return logoTargets(submission).filter((target) => !optimizedUrlForLogoTarget(data, target)).length;
}

function optimizableAssetCount(data: WebsiteData, submission: PanelSubmission | null): number {
  return imagePreviews(data).length + logoTargets(submission).length;
}

function unoptimizedAssetCount(data: WebsiteData, submission: PanelSubmission | null): number {
  return unoptimizedImageCount(data) + unoptimizedLogoCount(data, submission);
}

function optimizableAssetsAreOptimized(data: WebsiteData, submission: PanelSubmission | null): boolean {
  const total = optimizableAssetCount(data, submission);
  return total > 0 && unoptimizedAssetCount(data, submission) === 0;
}

function htmlHasImageReferences(data: WebsiteData): boolean {
  const html = data.html ?? "";
  if (!html) return false;
  if (WEBSITE_IMAGE_MERGE_TAG_PATTERN.test(html)) return true;
  return imagePreviews(data).some((item) => {
    const optimizedUrl = optimizedUrlForRole(data, item.role);
    return html.includes(item.sourceUrl) || Boolean(optimizedUrl && html.includes(optimizedUrl));
  });
}

function htmlUsesOptimizedImages(data: WebsiteData): boolean {
  const html = data.html ?? "";
  if (!html) return false;
  if (WEBSITE_IMAGE_MERGE_TAG_PATTERN.test(html)) return imagesAreOptimized(data);
  return imagePreviews(data).some((item) => {
    const optimizedUrl = optimizedUrlForRole(data, item.role);
    return Boolean(optimizedUrl && html.includes(optimizedUrl));
  });
}

function imageStatusDisplay(data: WebsiteData): { label: string; color: BadgeColor } {
  if (data.images_status === "generating") return { label: "Creando imágenes", color: "amber" };
  if (data.images_status === "error") return { label: "Error en imágenes", color: "red" };
  const previews = imagePreviews(data);
  if (!previews.length) return { label: "Por crear", color: "gray" };
  if (data.asset_optimization_status === "running") return { label: "Optimizando imágenes", color: "amber" };
  const pending = unoptimizedImageCount(data);
  if (pending === 0) return { label: "Optimizadas", color: "green" };
  if (pending === previews.length) return { label: "Imágenes originales", color: "blue" };
  return { label: `${pending} ${pending === 1 ? "imagen" : "imágenes"} por optimizar`, color: "amber" };
}

function logoStatusDisplay(data: WebsiteData, submission: PanelSubmission | null): { label: string; color: BadgeColor } {
  const targets = logoTargets(submission);
  if (!targets.length) return { label: "Por subir", color: "gray" };
  if (data.asset_optimization_status === "running") return { label: "Optimizando logo", color: "amber" };
  if (logosAreOptimized(data, submission)) return { label: "Logo optimizado", color: "green" };

  const pending = unoptimizedLogoCount(data, submission);
  const failed = targets.some((target) => {
    const asset = manifestAsset(data, target.role);
    return asset?.status === "failed" && asset.sourceUrl === target.sourceUrl;
  });

  if (failed && pending === targets.length) return { label: "Error en logo", color: "red" };
  if (pending < targets.length) return { label: `${pending} ${pending === 1 ? "variante" : "variantes"} por optimizar`, color: "amber" };
  return { label: "Logo original", color: "blue" };
}

function htmlStatusDisplay(data: WebsiteData): { label: string; color: BadgeColor } {
  if (data.status === "generating") return { label: "Generando HTML", color: "amber" };
  if (data.status === "error") return { label: "Error en HTML", color: "red" };
  if (!data.html) return { label: "Por generar", color: "gray" };
  if (!htmlHasImageReferences(data)) return { label: "Página sin imágenes", color: "blue" };
  return htmlUsesOptimizedImages(data)
    ? { label: "Página con imágenes optimizadas", color: "green" }
    : { label: "Página con imágenes originales", color: "blue" };
}

function withCacheToken(url: string, token: string): string {
  try {
    const next = new URL(url, window.location.origin);
    next.searchParams.set("t", token);
    return next.toString();
  } catch {
    return url;
  }
}

function WebsiteSection({ locationId, submission }: { locationId: string; submission: PanelSubmission | null }) {
  const [data, setData]         = useState<WebsiteData | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [optimizingAssets, setOptimizingAssets] = useState(false);
  const [imageFlashing, setImageFlashing] = useState(false);
  const [selectedImageRole, setSelectedImageRole] = useState<WebsiteImageRole | null>(null);
  const [regeneratingImage, setRegeneratingImage] = useState<WebsiteImageRole | null>(null);

  const selectAdjacentImage = useCallback((step: number) => {
    setSelectedImageRole((current) => {
      if (!data || !current) return current;
      const items = imagePreviews(data);
      if (!items.length) return current;
      const index = items.findIndex((item) => item.role === current);
      const nextIndex = ((index < 0 ? 0 : index) + step + items.length) % items.length;
      return items[nextIndex]?.role ?? current;
    });
  }, [data]);

  const load = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    try {
      const res = await fetch(`/api/website/${locationId}`);
      const json = await res.json() as { website: WebsiteData | null; accountId: string | null };
      setData(json.website);
      if (json.accountId) setAccountId(json.accountId);
    } catch {
      setData(null);
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    const id = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(id);
  }, [load]);

  // Auto-poll while generating
  useEffect(() => {
    if (data?.status !== "generating") return;
    const id = setInterval(() => { void load(false); }, 5000);
    return () => clearInterval(id);
  }, [data?.status, load]);

  // Auto-poll while generating images
  useEffect(() => {
    if (data?.images_status !== "generating") return;
    const id = setInterval(() => { void load(false); }, 5000);
    return () => clearInterval(id);
  }, [data?.images_status, load]);

  // Auto-poll while optimizing assets
  useEffect(() => {
    if (data?.asset_optimization_status !== "running") return;
    const id = setInterval(() => { void load(false); }, 5000);
    return () => clearInterval(id);
  }, [data?.asset_optimization_status, load]);

  useEffect(() => {
    if (!selectedImageRole) return;

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedImageRole(null);
      if (event.key === "ArrowRight" || event.key === "ArrowDown") selectAdjacentImage(1);
      if (event.key === "ArrowLeft" || event.key === "ArrowUp") selectAdjacentImage(-1);
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [selectedImageRole, selectAdjacentImage]);

  async function copyHtml() {
    if (!data?.html) return;
    await navigator.clipboard.writeText(data.html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function generateImages(assetKeys?: WebsiteImageRole[]) {
    if (!submission || !accountId) return;
    if (assetKeys?.length) setRegeneratingImage(assetKeys[0]);
    else setGeneratingImages(true);
    setImageFlashing(true);

    const domain = submission.domainType === "existing" || submission.domainType === "new"
      ? submission.domain
      : "";

    try {
      await fetch("/api/website/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          locationId,
          businessName:       submission.businessName,
          services:           submission.websiteServices ?? [],
          city:               submission.city,
          state:              submission.state,
          primaryColor:       submission.primaryColor || "#1E2C46",
          // Extra fields for auto HTML re-generation after images
          address:            submission.address,
          zip:                submission.zip,
          tagline:            submission.websiteTagline ?? "",
          secondaryColor:     submission.secondaryColor || "#F67D0A",
          complementaryColor: submission.complementaryColor || "#FFFFFF",
          domain,
          hoursOfOperation:   submission.hoursOfOperation ?? null,
          logoUrl:            submission.logoUrl ?? "",
          logoSquareUrl:      submission.logoSquareUrl ?? "",
          regenerateHtmlAfterImages: true,
          ...(assetKeys?.length ? { assetKeys } : {}),
        }),
      });
      await load(false);
    } catch (err) {
      console.error("generateImages failed:", err);
    } finally {
      setGeneratingImages(false);
      setRegeneratingImage(null);
      setImageFlashing(false);
    }
  }

  async function optimizeAssets() {
    if (!submission || !accountId || (data && optimizableAssetsAreOptimized(data, submission))) return;
    setOptimizingAssets(true);
    setImageFlashing(true);

    try {
      await fetch("/api/website/optimize-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          locationId,
          refreshHtml: Boolean(data?.html),
          logoUrl:       submission.logoUrl ?? "",
          logoSquareUrl: submission.logoSquareUrl ?? "",
        }),
      });
      await load(false);
    } catch (err) {
      console.error("optimizeAssets failed:", err);
    } finally {
      setOptimizingAssets(false);
      setImageFlashing(false);
    }
  }

  async function regenerate(mode?: "refresh" | "regenerate") {
    if (!submission || !accountId) return;
    setRegenerating(true);

    const domain = submission.domainType === "existing" || submission.domainType === "new"
      ? submission.domain
      : "";

    try {
      await fetch("/api/website/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          locationId,
          businessName:       submission.businessName,
          address:            submission.address,
          city:               submission.city,
          state:              submission.state,
          zip:                submission.zip,
          tagline:            submission.websiteTagline ?? "",
          services:           submission.websiteServices ?? [],
          primaryColor:       submission.primaryColor || "#1E2C46",
          secondaryColor:     submission.secondaryColor || "#F67D0A",
          complementaryColor: submission.complementaryColor || "#FFFFFF",
          domain,
          hoursOfOperation:   submission.hoursOfOperation ?? null,
          logoUrl:            submission.logoUrl ?? "",
          logoSquareUrl:      submission.logoSquareUrl ?? "",
          ...(mode ? { mode } : {}),
        }),
      });

      await load(false);
    } catch (err) {
      console.error("regenerate failed:", err);
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-[13px]">
        <Loader2 size={14} className="animate-spin" />
        Cargando...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <p className="text-[13px] text-slate-400 italic">
          No hay website generada. Se creará automáticamente tras el onboarding.
        </p>
        {submission && accountId && (
          <button type="button"
            onClick={() => regenerate()}
            disabled={regenerating}
            className="flex items-center gap-2 w-full justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: "#1E2C46" }}
          >
            {regenerating
              ? <><Loader2 size={14} className="animate-spin" />Iniciando generación...</>
              : <><RefreshCw size={14} />Generar HTML</>
            }
          </button>
        )}
      </div>
    );
  }

  const imageCacheToken = data.updated_at ?? data.generated_at ?? "preview";
  const hasHtml = Boolean(data.html);
  const previews = imagePreviews(data);
  const selectedImage = previews.find((item) => item.role === selectedImageRole) ?? null;
  const imageStatus = imageStatusDisplay(data);
  const logoStatus = logoStatusDisplay(data, submission);
  const htmlStatus = htmlStatusDisplay(data);
  const optimized = optimizableAssetsAreOptimized(data, submission);
  const unoptimizedCount = unoptimizedAssetCount(data, submission);
  const optimizeDisabled =
    optimizingAssets ||
    data.asset_optimization_status === "running" ||
    optimizableAssetCount(data, submission) === 0 ||
    optimized;

  function downloadImages(items: WebsiteImagePreview[]) {
    items.forEach((item, index) => {
      window.setTimeout(() => {
        const link = document.createElement("a");
        link.href = item.url;
        link.download = `${locationId}-${item.role}.jpg`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }, index * 120);
    });
  }

  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="flex items-center gap-2">
        {data.status === "ready" && (
          <Badge color="green"><BadgeCheck size={10} />Lista</Badge>
        )}
        {data.status === "generating" && (
          <Badge color="amber"><Loader2 size={10} className="animate-spin" />Generando...</Badge>
        )}
        {data.status === "pending" && (
          <Badge color="gray">Pendiente</Badge>
        )}
        {data.status === "error" && (
          <Badge color="red"><AlertCircle size={10} />Error</Badge>
        )}
        {data.generated_at && (
          <span className="text-[11px] text-slate-400">{formatDateTime(data.generated_at)}</span>
        )}
      </div>

      {/* Error message */}
      {data.status === "error" && data.error_message && (
        <p className="text-[12px] text-red-500 bg-red-50 rounded px-3 py-2">{data.error_message}</p>
      )}

      <div className="flex items-center justify-between gap-2 text-[12px] bg-slate-50 rounded-[10px] px-3 py-2">
        <span className="text-slate-500">HTML</span>
        <Badge color={htmlStatus.color}>{htmlStatus.label}</Badge>
      </div>

      <div className="flex items-center justify-between gap-2 text-[12px] bg-slate-50 rounded-[10px] px-3 py-2">
        <span className="text-slate-500">Imágenes</span>
        <Badge color={imageStatus.color}>{imageStatus.label}</Badge>
      </div>

      <div className="flex items-center justify-between gap-2 text-[12px] bg-slate-50 rounded-[10px] px-3 py-2">
        <span className="text-slate-500">Logo</span>
        <Badge color={logoStatus.color}>{logoStatus.label}</Badge>
      </div>

      {/* Hero image preview */}
      {previews.length > 0 && (
        <div className={`grid grid-cols-3 gap-1.5 transition-opacity duration-300 ${imageFlashing ? "opacity-35" : "opacity-100"}`}>
          {previews.map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() => setSelectedImageRole(item.role)}
                className="relative text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={withCacheToken(item.url, imageCacheToken)}
                  alt={item.label}
                  className="w-full h-16 object-cover rounded-lg border border-slate-200"
                />
                <span className="absolute bottom-1 left-1 text-[9px] font-semibold text-white bg-black/50 rounded px-1">
                  {item.label}
                </span>
              </button>
          ))}
        </div>
      )}

      {previews.length > 1 && (
        <button
          type="button"
          onClick={() => downloadImages(previews)}
          className="flex items-center gap-2 w-full justify-center rounded-[10px] px-4 py-2 text-xs font-semibold border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
        >
          <Download size={13} />Descargar las 3 imágenes
        </button>
      )}

      {/* Copy HTML button */}
      {data.status === "ready" && data.html && (
        <button
          type="button"
          onClick={copyHtml}
          className="flex items-center gap-2 w-full justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: copied ? "#22c55e" : "#1E2C46" }}
        >
          {copied
            ? <><Check size={15} />HTML copiado</>
            : <><Copy size={15} />Copiar HTML para GHL</>
          }
        </button>
      )}

      {/* Generate images button */}
      {data.status === "ready" && submission && accountId && data.images_status !== "generating" && (
        <button
          type="button"
          onClick={() => generateImages()}
          disabled={generatingImages}
          className="flex items-center gap-2 w-full justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ backgroundColor: "#F67D0A" }}
        >
          {generatingImages
            ? <><Loader2 size={14} className="animate-spin" />Iniciando generación...</>
            : <><Sparkles size={14} />{previews.length ? "Crear nuevas imágenes" : "Generar imágenes"}</>
          }
        </button>
      )}

      {/* Images generating badge */}
      {data.images_status === "generating" && (
        <div className="flex items-center gap-2 text-[13px] text-amber-600 bg-amber-50 rounded-[10px] px-4 py-2.5">
          <Loader2 size={14} className="animate-spin" />
          Generando imágenes con IA... (puede demorar 1-2 min)
        </div>
      )}

      {/* Optimize images button */}
      {submission && accountId && data.images_status !== "generating" && (
        <button
          type="button"
          onClick={optimizeAssets}
          disabled={optimizeDisabled}
          className="flex items-center gap-2 w-full justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold border transition-colors disabled:opacity-50"
          style={optimized
            ? { borderColor: "#cbd5e1", color: "#64748b", backgroundColor: "#f8fafc" }
            : { borderColor: "#F67D0A", color: "#C46300", backgroundColor: "#fff7ed" }
          }
        >
          {optimizingAssets || data.asset_optimization_status === "running"
            ? <><Loader2 size={14} className="animate-spin" />Optimizando imágenes...</>
            : optimized
              ? <><Check size={14} />Imágenes y logo optimizados</>
            : <><Sparkles size={14} />{unoptimizedCount ? `Optimizar ${unoptimizedCount} ${unoptimizedCount === 1 ? "recurso" : "recursos"} pendiente${unoptimizedCount === 1 ? "" : "s"}` : "Optimizar imágenes"}</>
          }
        </button>
      )}

      {/* HTML mode buttons */}
      {submission && accountId && data.status !== "generating" && (
        hasHtml ? (
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => regenerate("refresh")}
              disabled={regenerating}
              className="flex items-center gap-2 w-full justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold border transition-colors disabled:opacity-50"
              style={{ borderColor: "#1E2C46", color: "#1E2C46" }}
            >
              {regenerating
                ? <><Loader2 size={14} className="animate-spin" />Actualizando...</>
                : <><RefreshCw size={14} />Actualizar HTML con imágenes</>
              }
            </button>
            <button
              type="button"
              onClick={() => regenerate("regenerate")}
              disabled={regenerating}
              className="flex items-center gap-2 w-full justify-center rounded-[10px] px-4 py-2.5 text-sm font-medium border transition-colors disabled:opacity-50"
              style={{ borderColor: "#e5e7eb", color: "#5f6f88" }}
            >
              {regenerating
                ? <><Loader2 size={14} className="animate-spin" />Iniciando regeneración...</>
                : <><RefreshCw size={14} />Regenerar desde cero</>
              }
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => regenerate()}
            disabled={regenerating}
            className="flex items-center gap-2 w-full justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: "#1E2C46" }}
          >
            {regenerating
              ? <><Loader2 size={14} className="animate-spin" />Iniciando generación...</>
              : <><RefreshCw size={14} />Generar HTML</>
            }
          </button>
        )
      )}

      {/* HTML preview hint */}
      {data.status === "ready" && data.html && (
        <p className="text-[11px] text-slate-400 text-center flex items-center gap-1 justify-center">
          <Code2 size={11} />
          {(data.html.length / 1024).toFixed(0)} KB · Pegá en un bloque Custom HTML de GHL
        </p>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/75 px-4 py-6 flex items-center justify-center"
          onClick={() => setSelectedImageRole(null)}
          onWheel={(event) => {
            if (Math.abs(event.deltaY) < 10) return;
            event.preventDefault();
            selectAdjacentImage(event.deltaY > 0 ? 1 : -1);
          }}
        >
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <strong className="text-sm text-[#1E2C46]">
                {selectedImage.label}
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {previews.findIndex((item) => item.role === selectedImage.role) + 1}/{previews.length}
                </span>
              </strong>
              <button
                type="button"
                onClick={() => setSelectedImageRole(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="relative bg-slate-950">
              {previews.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => selectAdjacentImage(-1)}
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <button
                    type="button"
                    onClick={() => selectAdjacentImage(1)}
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-800 shadow"
                    aria-label="Siguiente imagen"
                  >
                    <ChevronRight size={22} />
                  </button>
                </>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={withCacheToken(selectedImage.url, imageCacheToken)}
                alt={selectedImage.label}
                className={`w-full max-h-[70vh] object-contain transition-opacity duration-300 ${imageFlashing ? "opacity-35" : "opacity-100"}`}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-4">
              <a
                href={selectedImage.url}
                download={`${locationId}-${selectedImage.role}.jpg`}
                className="flex items-center gap-2 justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold border border-slate-200 text-slate-700"
              >
                <Download size={14} />Descargar
              </a>
              <button
                type="button"
                onClick={() => generateImages([selectedImage.role])}
                disabled={Boolean(regeneratingImage)}
                className="flex items-center gap-2 justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: "#F67D0A" }}
              >
                {regeneratingImage === selectedImage.role
                  ? <><Loader2 size={14} className="animate-spin" />Creando...</>
                  : <><RefreshCw size={14} />Crear nueva versión</>
                }
              </button>
              <button
                type="button"
                onClick={() => downloadImages(previews)}
                className="flex items-center gap-2 justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold border border-slate-200 text-slate-700"
              >
                <Download size={14} />Descargar todas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Side Panel ───────────────────────────────────────────────────────────────

function SidePanel({ account, onClose, onApprove }: { account: EnrichedAccount; onClose: () => void; onApprove?: (locationId: string) => void }) {
  const { ghl, submission } = account;
  const [checklist, setChecklist] = useState(
    submission?.checklist ?? ({} as Record<ChecklistItemId, boolean>)
  );
  const [isPending, startTransition] = useTransition();
  const [approvedAt, setApprovedAt] = useState<string | null>(submission?.approvedAt ?? null);
  const [approving, setApproving] = useState(false);
  const [manualOnboardingLink, setManualOnboardingLink] = useState<ManualOnboardingLink | null>(
    onboardingLinkFromSubmission(submission)
  );
  const [manualLinkCopied, setManualLinkCopied] = useState(false);
  const [manualLinkLoading, setManualLinkLoading] = useState(false);
  const [manualLinkError, setManualLinkError] = useState<string | null>(null);
  const [setupMode, setSetupMode] = useState<SetupMode | null>(null);
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [resetText, setResetText] = useState("");

  const done = countDone(checklist);
  const pct  = progressPct(checklist);
  const canResetTestAccount = account.locationId === LIVERPOOL_DIGITAL_LOCATION_ID;
  const hasActiveManualLink = onboardingLinkIsActive(manualOnboardingLink);

  async function toggle(itemId: ChecklistItemId) {
    const newVal = !checklist[itemId];
    setChecklist((prev) => ({ ...prev, [itemId]: newVal }));
    startTransition(async () => {
      try {
        const res = await fetch("/api/panel/checklist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locationId: account.locationId, itemId, checked: newVal }),
        });
        if (!res.ok) {
          setChecklist((prev) => ({ ...prev, [itemId]: !newVal }));
        } else {
          const json = await res.json() as { checklist?: Record<ChecklistItemId, boolean> };
          if (json.checklist) setChecklist(json.checklist);
        }
      } catch {
        setChecklist((prev) => ({ ...prev, [itemId]: !newVal }));
      }
    });
  }

  async function approveAccount() {
    setApproving(true);
    try {
      const res = await fetch(`/api/panel/accounts/${account.locationId}/approve`, {
        method: "PATCH",
      });
      if (res.ok) {
        const now = new Date().toISOString();
        setApprovedAt(now);
        onApprove?.(account.locationId);
      }
    } catch {
      // silent — user can retry
    } finally {
      setApproving(false);
    }
  }

  async function generateManualOnboardingLink(force = false) {
    setManualLinkLoading(true);
    setManualLinkError(null);

    try {
      const res = await fetch(`/api/panel/accounts/${account.locationId}/onboarding-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: submission?.email ?? ghl.email,
          phone: submission?.phone ?? ghl.phone,
          businessName: submission?.businessName ?? ghl.name,
          force,
        }),
      });
      const json = await res.json() as { link?: string; expiresAt?: string; generatedAt?: string | null; error?: string };

      if (!res.ok || !json.link || !json.expiresAt) {
        throw new Error(json.error ?? "No se pudo generar el link de onboarding.");
      }

      const nextLink = {
        link: json.link,
        expiresAt: json.expiresAt,
        generatedAt: json.generatedAt,
      };
      setManualOnboardingLink(nextLink);
      await copyManualOnboardingLink(nextLink);
    } catch (err) {
      setManualLinkError(
        err instanceof Error ? err.message : "No se pudo generar el link de onboarding."
      );
    } finally {
      setManualLinkLoading(false);
    }
  }

  async function copyManualOnboardingLink(link = manualOnboardingLink) {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.link);
      setManualLinkCopied(true);
      setTimeout(() => setManualLinkCopied(false), 2000);
    } catch {
      setManualLinkCopied(false);
    }
  }

  async function runSetup(mode: SetupMode) {
    if (mode === "reset" && (resetText !== "reset" || !window.confirm("Resetear solo la configuración de prueba de Liverpool Digital?"))) {
      return;
    }

    setSetupMode(mode);
    setSetupError(null);
    try {
      const res = await fetch(`/api/panel/accounts/${account.locationId}/post-onboarding-setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          ...(mode === "reset" ? { resetText, resetLocationId: account.locationId } : {}),
        }),
      });
      const json = await res.json() as SetupResult & { error?: string };
      if (!json.steps) throw new Error(json.error ?? "No se pudo ejecutar el setup.");
      setSetupResult(json);
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : "No se pudo ejecutar el setup.");
    } finally {
      setSetupMode(null);
    }
  }

  const DAYS: Array<[string, string]> = [
    ["monday",    "Lunes"],
    ["tuesday",   "Martes"],
    ["wednesday", "Miércoles"],
    ["thursday",  "Jueves"],
    ["friday",    "Viernes"],
    ["saturday",  "Sábado"],
    ["sunday",    "Domingo"],
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full sm:w-[50vw] sm:min-w-[400px] sm:max-w-[700px] bg-white z-50 flex flex-col shadow-2xl">
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ background: "#1E2C46", borderColor: "rgba(255,255,255,0.1)" }}
        >
          <div>
            <p className="text-white font-bold text-[16px] leading-tight">
              {submission?.businessName || ghl.name || account.locationId}
            </p>
            <p className="text-white/50 text-[12px] mt-0.5">{account.locationId}</p>
          </div>
          <div className="flex items-center gap-2">
            {submission && approvedAt === null && (
              <button type="button"
                onClick={approveAccount}
                disabled={approving}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-md bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-50"
              >
                {approving
                  ? <Loader2 size={12} className="animate-spin" />
                  : <UserCheck size={12} />}
                Aprobar cuenta
              </button>
            )}
            <button type="button" onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1 rounded">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-8">

          <section>
            <h3 className="font-bold text-[13px] uppercase tracking-widest text-slate-400 mb-3">Onboarding manual</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 text-[12px] bg-slate-50 rounded-[10px] px-3 py-2">
                <span className="text-slate-500">Link del formulario</span>
                {hasActiveManualLink
                  ? <Badge color="green">Activo</Badge>
                  : manualOnboardingLink
                    ? <Badge color="red">Expirado</Badge>
                    : <Badge color="gray">Sin link</Badge>}
              </div>

              {manualOnboardingLink && (
                <p className="text-[12px] text-slate-500">
                  Expira: <span className="font-semibold text-slate-700">{formatDateTime(manualOnboardingLink.expiresAt)}</span>
                </p>
              )}

              {manualLinkError && (
                <p className="text-[12px] text-red-500 bg-red-50 rounded px-3 py-2">{manualLinkError}</p>
              )}

              {hasActiveManualLink && manualOnboardingLink ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 space-y-2">
                  <div className="flex items-center gap-2 rounded-md bg-white border border-slate-200 px-2 py-2">
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-500">
                      {manualOnboardingLink.link}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyManualOnboardingLink()}
                      className="shrink-0 rounded p-1.5 text-slate-500 hover:text-[#1E2C46] hover:bg-slate-100"
                      aria-label="Copiar link de onboarding"
                      title="Copiar link"
                    >
                      {manualLinkCopied ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <a
                      href={manualOnboardingLink.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-[12px] font-semibold text-[#1E2C46] hover:underline"
                    >
                      Abrir onboarding
                    </a>
                    <button
                      type="button"
                      onClick={() => generateManualOnboardingLink(true)}
                      disabled={manualLinkLoading}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-slate-600 hover:text-[#1E2C46] disabled:opacity-50"
                    >
                      {manualLinkLoading
                        ? <><Loader2 size={12} className="animate-spin" />Rotando...</>
                        : <><RefreshCw size={12} />Rotar link</>}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button"
                  onClick={() => generateManualOnboardingLink()}
                  disabled={manualLinkLoading}
                  className="flex items-center gap-2 w-full justify-center rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: manualLinkCopied ? "#22c55e" : "#1E2C46" }}
                >
                  {manualLinkLoading
                    ? <><Loader2 size={14} className="animate-spin" />Generando link...</>
                    : manualLinkCopied
                      ? <><Check size={14} />Link copiado</>
                      : <><Copy size={14} />Generar link</>}
                </button>
              )}
            </div>
          </section>

          {submission && (
            <section>
              <h3 className="font-bold text-[13px] uppercase tracking-widest text-slate-400 mb-3">Configuración previa</h3>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 space-y-3">
                <button
                  type="button"
                  onClick={() => void runSetup("apply")}
                  disabled={setupMode !== null}
                  className="flex w-full items-center justify-center gap-2 rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: "#1E2C46" }}
                >
                  {setupMode === "apply"
                    ? <><Loader2 size={14} className="animate-spin" />Aplicando...</>
                    : <><RefreshCw size={14} />Aplicar configuración previa</>}
                </button>

                <p className="text-[12px] text-slate-500">
                  Ejecuta solo tareas de Fase 2 probadas por API: custom values, Brand Board y calendarios. Lo que aún requiera revisión manual aparecerá como pendiente.
                </p>

                <details className="rounded-md border border-slate-200 bg-white">
                  <summary className="cursor-pointer px-3 py-2 text-[12px] font-semibold text-slate-600">
                    Controles de prueba
                  </summary>

                  <div className="space-y-3 border-t border-slate-100 px-3 py-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {([
                        ["inspect", "Revisar estado"],
                        ["verify", "Verificar resultado"],
                      ] as Array<[SetupMode, string]>).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => void runSetup(mode)}
                          disabled={setupMode !== null}
                          className="flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 disabled:opacity-50"
                        >
                          {setupMode === mode ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-slate-200 pt-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-red-500 mb-2">Reset test Liverpool</p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          value={resetText}
                          onChange={(event) => setResetText(event.target.value)}
                          placeholder='Escribí "reset"'
                          className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-[12px] outline-none focus:border-red-300"
                        />
                        <button
                          type="button"
                          onClick={() => void runSetup("reset")}
                          disabled={setupMode !== null || resetText !== "reset" || !canResetTestAccount}
                          className="flex items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700 disabled:opacity-50"
                        >
                          {setupMode === "reset" ? <Loader2 size={13} className="animate-spin" /> : <AlertCircle size={13} />}
                          Reset
                        </button>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-500">
                        Solo Liverpool Digital. Revierte estados de prueba soportados por API. No borra mensajes, notas ni contactos.
                      </p>
                    </div>
                  </div>
                </details>

                {setupError && (
                  <p className="text-[12px] text-red-500 bg-red-50 rounded px-3 py-2">{setupError}</p>
                )}

                {setupResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-slate-600">Resultado: {setupModeLabel(setupResult.mode)}</span>
                      <Badge color={setupResult.ok ? "green" : "amber"}>{setupResult.ok ? "OK" : "Revisar"}</Badge>
                    </div>
                    <ul className="grid gap-2">
                      {setupResult.steps.map((item) => (
                        <li key={item.id} className="rounded border border-slate-200 bg-white px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[12px] font-semibold text-slate-700">{item.label}</span>
                            <Badge color={setupStatusColor(item.status)}>{setupStatusLabel(item.status)}</Badge>
                          </div>
                          {item.error && <p className="mt-1 text-[11px] text-red-500">{item.error}</p>}
                          {item.details !== undefined && (
                            <pre className="mt-2 max-h-28 overflow-auto rounded bg-slate-50 p-2 text-[10px] text-slate-500">
                              {JSON.stringify(item.details, null, 2)}
                            </pre>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* GHL Account */}
          <section>
            <h3 className="font-bold text-[13px] uppercase tracking-widest text-slate-400 mb-3">Cuenta GHL</h3>
            <div className="grid gap-2 text-[13px]">
              <Row icon={<Building2 size={14} />} label="Nombre"   value={ghl.name} />
              <Row icon={<MapPin size={14} />}    label="Dirección" value={ghl.address} />
              <Row icon={<Phone size={14} />}     label="Teléfono"  value={ghl.phone} />
              <Row icon={<Mail size={14} />}      label="Email"     value={ghl.email} />
              <Row icon={<Globe size={14} />}     label="Web"       value={ghl.website} />
              <Row icon={<Globe size={14} />}     label="Dominio"   value={ghl.customDomain || "—"} />
              <Row icon={<Calendar size={14} />}  label="Creado"    value={formatDateTime(ghl.createdAt)} />
              <Row icon={<Tag size={14} />}       label="Plan"      value={ghl.planName} />
              <div className="flex gap-2 items-center">
                <span className="text-slate-400 w-[90px] shrink-0 flex items-center gap-1.5">
                  <CreditCard size={14} />Estado
                </span>
                {statusBadge(ghl.planStatus)}
              </div>
              {ghl.mrr > 0 && (
                <Row icon={<CreditCard size={14} />} label="MRR"
                  value={`$${ghl.mrr.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
              )}
              {/* Phones list */}
              <div className="flex gap-2 items-center">
                <span className="text-slate-400 w-[90px] shrink-0 flex items-center gap-1.5">
                  <PhoneCall size={14} />Teléfonos
                </span>
                {ghl.phoneNumbers.length > 0 ? (
                  <div className="flex flex-col gap-0.5">
                    {ghl.phoneNumbers.map((n) => (
                      <span key={n} className="font-mono text-[12px] text-slate-700">{n}</span>
                    ))}
                  </div>
                ) : <span className="text-slate-400">—</span>}
              </div>
              {/* Integrations */}
              <PanelRow label="Twilio"><YesNoBadge active={ghl.twilioActive} labelYes="Activo" labelNo="Inactivo" /></PanelRow>
              <PanelRow label="Stripe"><YesNoBadge active={ghl.stripeConnected} labelYes="Conectado" labelNo="No conectado" /></PanelRow>
              <PanelRow label="SMS"><YesNoBadge active={ghl.smsSent} labelYes="Enviado" labelNo="Sin enviar" /></PanelRow>
              <PanelRow label="Cita">
                {ghl.appointmentDate
                  ? <Badge color={new Date(ghl.appointmentDate) < new Date() ? "green" : "blue"}><CalendarClock size={10} />{formatDate(ghl.appointmentDate)}</Badge>
                  : <Badge color="gray">Sin agendar</Badge>}
              </PanelRow>
            </div>
          </section>

          {/* Form Data */}
          {submission && submission.checklist.form && (
            <section>
              <h3 className="font-bold text-[13px] uppercase tracking-widest text-slate-400 mb-3">
                Datos del formulario
              </h3>
              <div className="grid gap-2 text-[13px]">

                {/* ── Campos NO enviados a GHL (requieren acción manual) ── */}
                <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 mb-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400 mb-2">
                    No sincronizados con GHL — requieren configuración manual
                  </p>
                  <div className="grid gap-1.5">
                    {submission.legalName && (
                      <Row icon={<Building2 size={14} />} label="Nombre legal" value={submission.legalName} />
                    )}
                    {submission.email && (
                      <Row icon={<Mail size={14} />} label="Email dueño" value={submission.email} />
                    )}
                    {submission.ein && (
                      <Row icon={<Tag size={14} />} label="EIN / Tax ID" value={submission.ein} />
                    )}
                    {submission.domainRegistrar && (
                      <Row icon={<Globe size={14} />} label="Registrar" value={submission.domainRegistrar} />
                    )}
                    {submission.city && (
                      <Row icon={<MapPin size={14} />} label="Ciudad" value={[submission.city, submission.state, submission.zip].filter(Boolean).join(", ")} />
                    )}
                    {submission.businessLegalStructure && (
                      <Row icon={<Building2 size={14} />} label="Estructura legal" value={{
                        llc: "LLC (Sociedad de Responsabilidad Limitada)",
                        corporation: "Corporación (Inc.)",
                        sole_proprietorship: "Empresa unipersonal (Sole Proprietor)",
                        partnership: "Sociedad / Partnership",
                        none: "Sin entidad legal creada",
                      }[submission.businessLegalStructure] ?? submission.businessLegalStructure} />
                    )}
                    {submission.teamSize && (
                      <Row icon={<Tag size={14} />} label="Equipo / usuarios" value={{
                        "solo": "Solo el dueño",
                        "2-5": "2 a 5 personas",
                        "6-15": "6 a 15 personas",
                        "16+": "Más de 15 personas",
                      }[submission.teamSize] ?? submission.teamSize} />
                    )}
                    {submission.hasStripeAccount !== undefined && (
                      <Row icon={<Tag size={14} />} label="Cuenta de Stripe" value={submission.hasStripeAccount ? "Sí" : "No"} />
                    )}
                    {submission.taxIdStatus && (
                      <Row icon={<Tag size={14} />} label="Identificación fiscal" value={{
                        ssn:  "Tiene SSN",
                        itin: "Tiene ITIN",
                        none: "Sin SSN ni ITIN",
                      }[submission.taxIdStatus] ?? submission.taxIdStatus} />
                    )}
                    {submission.preferredPlatformLanguage && (
                      <Row icon={<Tag size={14} />} label="Idioma preferido en la plataforma" value={{
                        es: "Español",
                        en: "Inglés",
                        bilingual: "Español e inglés",
                      }[submission.preferredPlatformLanguage as string] ?? submission.preferredPlatformLanguage} />
                    )}
                    {submission.customerCommunicationLanguage && (
                      <Row icon={<Tag size={14} />} label="Idioma para comunicarse con clientes" value={{
                        es: "Español",
                        en: "Inglés",
                        bilingual: "Español e inglés",
                      }[submission.customerCommunicationLanguage as string] ?? submission.customerCommunicationLanguage} />
                    )}
                  </div>
                </div>

                {/* ── Campos sincronizados con GHL ── */}
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-1 mb-1">
                  Sincronizados con GHL (Custom Values)
                </p>
                <Row icon={<Building2 size={14} />} label="Negocio"   value={submission.businessName} />
                <Row icon={<Phone size={14} />}     label="Teléfono"  value={submission.phone} />
                <Row icon={<MapPin size={14} />}    label="Dirección" value={[submission.address, submission.city, submission.state, submission.zip, submission.country].filter(Boolean).join(", ")} />

                {/* Dominio */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-2">Dominio</p>
                  <Row icon={<Globe size={14} />} label="Tipo"
                    value={submission.domainType === "existing" ? "Dominio existente"
                         : submission.domainType === "new" ? "Dominio nuevo"
                         : "Sin dominio"} />
                  {submission.domain && <Row icon={<Globe size={14} />} label="Dominio" value={submission.domain} />}
                </div>

                {/* Marca */}
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-2">Marca</p>
                  {submission.letUsChooseColors ? (
                    <p className="text-slate-500 italic text-[13px]">PatronPro elige los colores</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <ColorSwatch label="Principal"      color={submission.primaryColor} />
                      <ColorSwatch label="Acento"         color={submission.secondaryColor} />
                      <ColorSwatch label="Complementario" color={submission.complementaryColor} />
                    </div>
                  )}
                </div>

                {/* Logo */}
                {submission.logoUrl && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-2">Logo</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={submission.logoUrl} alt="Logo"
                      className="h-16 w-auto object-contain rounded border border-slate-200 bg-slate-50 p-1" />
                  </div>
                )}

                {/* Horario */}
                {submission.hoursOfOperation && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-2 flex items-center gap-1">
                      <Clock size={12} /> Horario
                    </p>
                    <table className="w-full text-[12px]">
                      <tbody>
                        {DAYS.map(([key, label]) => {
                          const day = submission.hoursOfOperation![key as keyof typeof submission.hoursOfOperation];
                          return (
                            <tr key={key} className="border-b border-slate-50 last:border-0">
                              <td className="py-1 pr-3 text-slate-500 w-24">{label}</td>
                              <td className="py-1 pr-3">
                                {day.open ? <span className="text-green-600 font-medium">Abierto</span>
                                          : <span className="text-slate-400">Cerrado</span>}
                              </td>
                              <td className="py-1 text-slate-600">{day.open ? `${day.from} – ${day.to}` : ""}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <Row icon={<Calendar size={14} />} label="Enviado" value={formatDateTime(submission.submittedAt)} />
              </div>
            </section>
          )}

          {/* Website generada */}
          {submission && submission.checklist.form && (
            <section>
              <h3 className="font-bold text-[13px] uppercase tracking-widest text-slate-400 mb-3">
                Website generada
              </h3>
              <WebsiteSection locationId={account.locationId} submission={submission} />
            </section>
          )}

          {/* Checklist */}
          <section>
            <h3 className="font-bold text-[13px] uppercase tracking-widest text-slate-400 mb-3">Checklist de setup</h3>
            <div className="mb-3 flex items-center gap-3">
              <ProgressBar pct={pct} width="flex-1" />
              <span className="text-[12px] font-semibold text-slate-500 shrink-0">{done}/{CHECKLIST_ITEMS.length}</span>
            </div>
            <ul className="grid gap-1" style={{ opacity: isPending ? 0.6 : 1 }}>
              {CHECKLIST_ITEMS.map((item) => {
                const checked = checklist[item.id] ?? false;
                return (
                  <li key={item.id}>
                    <button type="button"
                      onClick={() => toggle(item.id)}
                      disabled={isPending}
                      className="flex items-center gap-3 w-full text-left cursor-pointer group py-1.5"
                    >
                      {checked
                        ? <CheckCircle2 size={17} strokeWidth={2} className="text-green-500 shrink-0" />
                        : <Circle size={17} strokeWidth={1.5} className="text-slate-300 group-hover:text-[#F67D0A] shrink-0 transition-colors" />}
                      <span className="text-[13px] leading-snug transition-colors"
                        style={{ color: checked ? "#94a3b8" : "#1E2C46", textDecoration: checked ? "line-through" : "none" }}>
                        {item.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-slate-400 w-[90px] shrink-0 flex items-center gap-1.5 pt-0.5">{icon}{label}</span>
      <span className="text-slate-700 break-all">{value || "—"}</span>
    </div>
  );
}

function PanelRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2 items-center">
      <span className="text-slate-400 w-[90px] shrink-0 text-[13px]">{label}</span>
      {children}
    </div>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  if (!color) return null;
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-5 h-5 rounded border border-slate-200 shrink-0" style={{ background: color }} />
      <span className="text-slate-500 text-[11px]">{label}</span>
      <span className="text-slate-400 text-[11px] font-mono">{color}</span>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm flex items-center gap-3">
      <div className="w-2 h-8 rounded-full shrink-0" style={{ background: color }} />
      <div>
        <p className="text-[22px] font-bold text-slate-800 leading-none">{value}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

type FilterType = "all" | "active" | "inactive" | "no-onboarding" | "pending-approval";
type SortType   = "date-desc" | "date-asc" | "name";

export default function PanelClient({ accounts }: { accounts: EnrichedAccount[] }) {
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<FilterType>("all");
  const [sort,     setSort]     = useState<SortType>("date-desc");
  const [selected, setSelected] = useState<EnrichedAccount | null>(null);
  const [accountList, setAccountList] = useState<EnrichedAccount[]>(accounts);

  function handleApprove(locationId: string) {
    setAccountList((prev) =>
      prev.map((a) => {
        if (a.locationId !== locationId || !a.submission) return a;
        return {
          ...a,
          submission: { ...a.submission, approvedAt: new Date().toISOString() },
        };
      })
    );
    setSelected((prev) => {
      if (!prev || prev.locationId !== locationId || !prev.submission) return prev;
      return { ...prev, submission: { ...prev.submission, approvedAt: new Date().toISOString() } };
    });
  }

  const total        = accountList.length;
  const active       = accountList.filter((a) => a.ghl.planStatus.toLowerCase() === "active").length;
  const pendingSetup = accountList.filter((a) => !a.submission?.checklist.form).length;
  const completed    = accountList.filter((a) => a.submission && progressPct(a.submission.checklist) === 100).length;

  const visible = accountList
    .filter((a) => {
      const q = search.toLowerCase();
      if (q) {
        const name  = (a.submission?.businessName || a.ghl.name).toLowerCase();
        const email = (a.submission?.email        || a.ghl.email).toLowerCase();
        if (!name.includes(q) && !email.includes(q)) return false;
      }
      if (filter === "active")           return a.ghl.planStatus.toLowerCase() === "active";
      if (filter === "inactive")         return a.ghl.planStatus.toLowerCase() === "inactive";
      if (filter === "no-onboarding")    return !a.submission?.checklist.form;
      if (filter === "pending-approval") return a.submission?.approvedAt === null;
      return true;
    })
    .sort((a, b) => {
      if (sort === "date-asc")  return (a.submission?.submittedAt ?? "").localeCompare(b.submission?.submittedAt ?? "");
      if (sort === "date-desc") return (b.submission?.submittedAt ?? "").localeCompare(a.submission?.submittedAt ?? "");
      const na = a.submission?.businessName || a.ghl.name;
      const nb = b.submission?.businessName || b.ghl.name;
      return na.localeCompare(nb);
    });

  return (
    <div>
      {/* Stats */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Cuentas totales"  value={total}        color="#1E2C46" />
          <StatCard label="Activas"          value={active}       color="#22c55e" />
          <StatCard label="Pendientes setup" value={pendingSetup} color="#F67A0A" />
          <StatCard label="Completadas"      value={completed}    color="#60a5fa" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 mt-4">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-[13px] border border-slate-200 rounded-md outline-none focus:border-[#1E2C46] bg-slate-50"
            />
          </div>
          <div className="relative">
            <select value={filter} onChange={(e) => setFilter(e.target.value as FilterType)}
              className="appearance-none pl-3 pr-8 py-2 text-[13px] border border-slate-200 rounded-md outline-none focus:border-[#1E2C46] bg-white cursor-pointer">
              <option value="all">Todos</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="no-onboarding">Sin onboarding</option>
              <option value="pending-approval">Pendiente aprobación</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={sort} onChange={(e) => setSort(e.target.value as SortType)}
              className="appearance-none pl-3 pr-8 py-2 text-[13px] border border-slate-200 rounded-md outline-none focus:border-[#1E2C46] bg-white cursor-pointer">
              <option value="date-desc">Fecha (reciente)</option>
              <option value="date-asc">Fecha (antigua)</option>
              <option value="name">Nombre A-Z</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {visible.length === 0 ? (
          <div className="text-center py-24 text-slate-400 text-[15px]">No se encontraron cuentas.</div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left border-b border-slate-100" style={{ background: "#f8fafc" }}>
                  <Th>#</Th>
                  <Th>Negocio</Th>
                  <Th>Plan</Th>
                  <Th>Estado</Th>
                  <Th>Twilio</Th>
                  <Th>Stripe</Th>
                  <Th>SMS</Th>
                  <Th>Cita Onboarding</Th>
                  <Th>Onboarding</Th>
                  <Th>Registro</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((account, idx) => {
                  const sub       = account.submission;
                  const name      = sub?.businessName || account.ghl.name || "—";
                  const regDate   = sub?.submittedAt || account.ghl.createdAt;
                  const checklist = sub?.checklist ?? ({} as Record<ChecklistItemId, boolean>);
                  const done      = countDone(checklist);
                  const pct       = progressPct(checklist);
                  // F7: if account has never been approved, override displayed status to "paused"
                  const effectiveStatus = sub?.approvedAt === null ? "paused" : account.ghl.planStatus;

                  return (
                    <tr
                      key={account.locationId}
                      onClick={() => setSelected(account)}
                      className="border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors"
                      style={{ background: idx % 2 === 0 ? "white" : "#fafafa" }}
                    >
                      <td className="px-4 py-3 text-slate-400 text-[12px] w-8">{idx + 1}</td>

                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1E2C46] leading-tight whitespace-nowrap">{name}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5 font-mono">{account.locationId}</p>
                      </td>

                      <td className="px-4 py-3">
                        {account.ghl.planName !== "—"
                          ? <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-50 text-orange-600 whitespace-nowrap">{account.ghl.planName}</span>
                          : <span className="text-slate-300 text-[12px]">—</span>}
                      </td>

                      <td className="px-4 py-3">{statusBadge(effectiveStatus)}</td>

                      <td className="px-4 py-3">
                        <YesNoBadge active={account.ghl.twilioActive} labelYes="Activo" labelNo="—" />
                      </td>

                      <td className="px-4 py-3">
                        <YesNoBadge active={account.ghl.stripeConnected} labelYes="Sí" labelNo="—" />
                      </td>

                      <td className="px-4 py-3">
                        {account.ghl.smsSent
                          ? <Badge color="green"><CheckCheck size={10} />Enviado</Badge>
                          : <span className="text-slate-300 text-[12px]">—</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        {account.ghl.appointmentDate
                          ? <Badge color={new Date(account.ghl.appointmentDate) < new Date() ? "green" : "blue"}><CalendarClock size={10} />{formatDate(account.ghl.appointmentDate)}</Badge>
                          : <span className="text-slate-300 text-[12px]">—</span>}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar pct={pct} />
                          <span className="text-[11px] text-slate-500 shrink-0">{done}/{CHECKLIST_ITEMS.length}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-500 text-[12px] whitespace-nowrap">
                        {formatDate(regDate)}
                      </td>

                      <td className="px-4 py-3">
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); setSelected(account); }}
                          className="px-3 py-1.5 text-[12px] font-semibold rounded-md border border-slate-200 text-slate-600 hover:border-[#1E2C46] hover:text-[#1E2C46] transition-colors"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <SidePanel key={selected.locationId} account={selected} onClose={() => setSelected(null)} onApprove={handleApprove} />}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-[#1E2C46] whitespace-nowrap">
      {children}
    </th>
  );
}
