import type { PanelSubmission } from "@/lib/panel/store";
import { ghlFetch } from "./client";

export type PostOnboardingSetupMode = "inspect" | "apply" | "verify" | "reset";
export type SetupStatus = "pass" | "updated" | "warning" | "blocked" | "failed" | "skipped" | "needs_browser";

export interface SetupStepResult {
  id: string;
  label: string;
  status: SetupStatus;
  details?: unknown;
  error?: string;
}

export interface PostOnboardingSetupResult {
  mode: PostOnboardingSetupMode;
  locationId: string;
  dryRun: boolean;
  ok: boolean;
  steps: SetupStepResult[];
}

export interface PostOnboardingSetupInput {
  mode: PostOnboardingSetupMode;
  locationId: string;
  token: string;
  submission: PanelSubmission | null;
  resetText?: string;
  resetLocationId?: string;
}

interface GhlCustomValue {
  id: string;
  name: string;
  fieldKey: string;
  value?: string;
}

interface GhlUser {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
}

interface GhlCalendar {
  id?: string;
  name?: string;
  isActive?: boolean;
  teamMembers?: Array<{ userId?: string }>;
  timezone?: string;
  timeZone?: string;
  calendarTimezone?: string;
  allowBookingAfter?: number | string;
  allowBookingAfterUnit?: string;
  preBuffer?: number | string;
  preBufferUnit?: string;
  slotBuffer?: number | string;
  slotBufferUnit?: string;
  appoinmentPerDay?: number | string;
  appointmentPerDay?: number | string;
}

interface BrandBoardColor {
  id: string;
  label: string;
  hex: string;
  hexa: string;
  rgb: string;
  rgba: string;
}

interface BrandBoard {
  id?: string;
  _id?: string;
  name?: string;
  default?: boolean;
  isDefault?: boolean;
  colors?: Array<{ id?: string; label?: string; hex?: string; value?: string; hexa?: string; rgb?: string; rgba?: string }>;
}

const GHL_BRAND_BOARD_VERSION = "2023-02-21";
const LIVERPOOL_DIGITAL_LOCATION_ID = "4cPIvLND9hFAIzWQ1ZbL";
const LIVERPOOL_DIGITAL_BRAND_BOARD_NAME = "Liverpool Digital";

const DEFAULT_BRAND_COLORS = [
  { id: "main", label: "Main", hex: "#471F23" },
  { id: "accent", label: "Accent", hex: "#F69309" },
  { id: "complementary", label: "Complementary", hex: "#2F1417" },
];

function step(id: string, label: string, status: SetupStatus, details?: unknown, error?: string): SetupStepResult {
  return { id, label, status, ...(details === undefined ? {} : { details }), ...(error ? { error } : {}) };
}

export function normalizeHexColor(value: string | undefined, fallback = ""): string {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^#?([0-9a-fA-F]{6})$/);
  return match ? `#${match[1].toUpperCase()}` : fallback;
}

function rgbFromHex(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function colorObject(color: { id: string; label: string; hex: string }): BrandBoardColor | null {
  const hex = normalizeHexColor(color.hex);
  const rgb = rgbFromHex(hex);
  if (!hex || !rgb) return null;
  return {
    id: color.id,
    label: color.label,
    hex,
    hexa: `${hex}FF`,
    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
  };
}

export function buildBrandPalette(submission: PanelSubmission | null): BrandBoardColor[] {
  const source = submission?.letUsChooseColors
    ? DEFAULT_BRAND_COLORS
    : [
        { id: "main", label: "Main", hex: submission?.primaryColor || DEFAULT_BRAND_COLORS[0].hex },
        { id: "accent", label: "Accent", hex: submission?.secondaryColor || DEFAULT_BRAND_COLORS[1].hex },
        { id: "complementary", label: "Complementary", hex: submission?.complementaryColor || DEFAULT_BRAND_COLORS[2].hex },
      ];
  return source.map(colorObject).filter((item): item is BrandBoardColor => Boolean(item));
}

async function readJson<T>(path: string, token: string, init: RequestInit & { version?: string } = {}): Promise<{ ok: boolean; status: number; body: T | null; text: string }> {
  const { version, headers, ...rest } = init;
  const res = await ghlFetch(path, {
    ...rest,
    token,
    headers: {
      ...(version ? { Version: version } : {}),
      ...headers,
    },
  });
  const text = await res.text();
  let body: T | null = null;
  try {
    body = text ? JSON.parse(text) as T : null;
  } catch {
    body = null;
  }
  return { ok: res.ok, status: res.status, body, text };
}

function customValuesFromBody(body: unknown): GhlCustomValue[] {
  const values = (body as { customValues?: GhlCustomValue[] } | null)?.customValues;
  return Array.isArray(values) ? values : [];
}

async function listCustomValues(locationId: string, token: string): Promise<GhlCustomValue[]> {
  const result = await readJson<{ customValues?: GhlCustomValue[] }>(`/locations/${encodeURIComponent(locationId)}/customValues`, token);
  return result.ok ? customValuesFromBody(result.body) : [];
}

function findCustomValue(values: GhlCustomValue[], fieldKey: string): GhlCustomValue | undefined {
  return values.find((item) => item.fieldKey?.includes(fieldKey) || item.name === fieldKey);
}

async function upsertCustomValue(locationId: string, token: string, values: GhlCustomValue[], fieldKey: string, value: string): Promise<SetupStepResult> {
  const existing = findCustomValue(values, fieldKey);
  if (existing?.value === value) {
    return step(`custom_value_${fieldKey}`, `Custom value ${fieldKey}`, "pass", { value });
  }

  const path = existing
    ? `/locations/${encodeURIComponent(locationId)}/customValues/${encodeURIComponent(existing.id)}`
    : `/locations/${encodeURIComponent(locationId)}/customValues`;
  const body = existing
    ? { name: existing.name, value }
    : { name: fieldKey, value };
  const result = await readJson(path, token, {
    method: existing ? "PUT" : "POST",
    body: JSON.stringify(body),
  });

  return result.ok
    ? step(`custom_value_${fieldKey}`, `Custom value ${fieldKey}`, "updated", { value })
    : step(`custom_value_${fieldKey}`, `Custom value ${fieldKey}`, "failed", { status: result.status }, result.text);
}

function fullAddress(submission: PanelSubmission): string {
  return [submission.address, submission.city, submission.state, submission.zip, submission.country].filter(Boolean).join(", ");
}

function customValueTargets(submission: PanelSubmission): Array<[string, string]> {
  return [
    ["company_name", submission.businessName],
    ["company_phone", submission.phone],
    ["company_address", fullAddress(submission)],
    ["dominio_web", submission.domain],
    ["preferred_platform_language", submission.preferredPlatformLanguage ?? ""],
    ["customer_communication_language", submission.customerCommunicationLanguage ?? ""],
  ].filter(([, value]) => value) as Array<[string, string]>;
}

async function handleCustomValues(input: PostOnboardingSetupInput): Promise<SetupStepResult[]> {
  if (!input.submission) return [step("custom_values", "Custom values", "blocked", undefined, "No onboarding submission found.")];
  const values = await listCustomValues(input.locationId, input.token);
  const targets = customValueTargets(input.submission);

  if (input.mode === "apply") {
    return Promise.all(targets.map(([fieldKey, value]) => upsertCustomValue(input.locationId, input.token, values, fieldKey, value)));
  }

  if (input.mode === "reset") {
    return [
      step("custom_values_reset", "Custom values reset", "skipped", {
        reason: "Reset does not blank customer-submitted values.",
      }),
    ];
  }

  return targets.map(([fieldKey, value]) => {
    const existing = findCustomValue(values, fieldKey);
    return existing?.value === value
      ? step(`custom_value_${fieldKey}`, `Custom value ${fieldKey}`, "pass", { value })
      : step(`custom_value_${fieldKey}`, `Custom value ${fieldKey}`, input.mode === "verify" ? "failed" : "warning", {
          expected: value,
          current: existing?.value ?? null,
        });
  });
}

function brandBoardId(board: BrandBoard | null | undefined): string {
  return board?._id ?? board?.id ?? "";
}

function boardHexes(board: BrandBoard): string[] {
  return (Array.isArray(board.colors) ? board.colors : [])
    .map((item) => normalizeHexColor(item.hex ?? item.value ?? item.hexa ?? ""))
    .filter(Boolean);
}

function boardHasPalette(board: BrandBoard, palette: BrandBoardColor[]): boolean {
  const hexes = new Set(boardHexes(board));
  return palette.every((color) => hexes.has(color.hex));
}

function boardIsDefault(board: BrandBoard): boolean {
  return board.default === true || board.isDefault === true;
}

function boardSummary(board: BrandBoard) {
  return {
    id: brandBoardId(board),
    name: board.name ?? "",
    default: boardIsDefault(board),
    colors: boardHexes(board),
  };
}

function brandBoardsFromBody(body: unknown): BrandBoard[] {
  const payload = body as { brandBoards?: BrandBoard[]; boards?: BrandBoard[]; data?: BrandBoard[] } | BrandBoard[] | null;
  const boards = Array.isArray(payload)
    ? payload
    : payload?.brandBoards ?? payload?.boards ?? payload?.data ?? [];
  return Array.isArray(boards) ? boards : [];
}

async function fetchBrandBoards(locationId: string, token: string): Promise<BrandBoard[]> {
  const list = await readJson(`/brand-boards/${encodeURIComponent(locationId)}?limit=20&offset=0`, token, {
    version: GHL_BRAND_BOARD_VERSION,
  });
  if (!list.ok) return [];
  const boards = brandBoardsFromBody(list.body);
  const hydrated = await Promise.all(boards.map(async (board) => {
    const id = brandBoardId(board);
    if (!id) return board;
    const detail = await readJson<BrandBoard>(`/brand-boards/${encodeURIComponent(locationId)}/${encodeURIComponent(id)}`, token, {
      version: GHL_BRAND_BOARD_VERSION,
    });
    return detail.ok && detail.body ? detail.body : board;
  }));
  return hydrated;
}

async function handleBrandBoard(input: PostOnboardingSetupInput): Promise<SetupStepResult> {
  const palette = buildBrandPalette(input.submission);
  if (palette.length !== 3) return step("brand_board", "Brand Board", "blocked", undefined, "Missing brand colors.");

  const boards = await fetchBrandBoards(input.locationId, input.token);
  const expectedName = input.locationId === LIVERPOOL_DIGITAL_LOCATION_ID
    ? LIVERPOOL_DIGITAL_BRAND_BOARD_NAME
    : input.submission?.businessName || "PatronPro Brand";
  const matching = boards.find((board) => boardHasPalette(board, palette) && boardIsDefault(board));
  const target = matching ?? boards.find((board) => board.name?.trim().toLowerCase() === expectedName.toLowerCase()) ?? boards[0] ?? null;

  if (input.mode === "reset") {
    return step("brand_board_reset", "Brand Board reset", "needs_browser", {
      boards: boards.map(boardSummary),
      reason: "Original Liverpool state had no Brand Board, but a supported delete endpoint was not proven.",
    });
  }

  if (matching) {
    return step("brand_board", "Brand Board", "pass", { board: boardSummary(matching), palette });
  }

  const action = target ? "update" : "create";
  const payload = target
    ? { name: target.name || expectedName, colors: palette, default: true }
    : { locationId: input.locationId, name: expectedName, colors: palette, default: true };

  if (input.mode !== "apply") {
    return step("brand_board", "Brand Board", input.mode === "verify" ? "failed" : "warning", {
      action,
      target: target ? boardSummary(target) : null,
      payload,
    });
  }

  const path = target
    ? `/brand-boards/${encodeURIComponent(input.locationId)}/${encodeURIComponent(brandBoardId(target))}`
    : "/brand-boards/";
  const result = await readJson(path, input.token, {
    method: target ? "PATCH" : "POST",
    version: GHL_BRAND_BOARD_VERSION,
    body: JSON.stringify(payload),
  });
  if (!result.ok) return step("brand_board", "Brand Board", "failed", { action, status: result.status }, result.text);

  const verified = (await fetchBrandBoards(input.locationId, input.token)).find((board) => boardHasPalette(board, palette) && boardIsDefault(board));
  return verified
    ? step("brand_board", "Brand Board", "updated", { action, board: boardSummary(verified), palette })
    : step("brand_board", "Brand Board", "failed", { action }, "Brand Board write returned OK, but readback did not match.");
}

function handleGlobalColors(input: PostOnboardingSetupInput): SetupStepResult {
  return step("global_colors", "Global Colors", "needs_browser", {
    profile: "WSL Chrome Profile 9",
    route: "Marketing > Brand Boards > Global settings > Custom colors",
    expected: input.mode === "reset"
      ? "Restore or manually review GHL Global Colors for the Liverpool test account"
      : "Apply submitted brand colors to GHL Global Colors, then verify by screenshot/readback",
    browserScript: "dev/agents/artifacts/script/patronpro-liverpool/ghl-profile9-global-colors.mjs",
    endpointObservedInUi: {
      write: "POST /brand-boards/custom-colors/",
      read: "GET /brand-boards/custom-colors/{locationId}?offset=0&limit=10&includeDeleted=false",
    },
    proof: [
      "dev/agents/artifacts/doc/test/liverpool-digital/global-colors-ui-save-main-capture-2026-06-24.json",
      "dev/agents/artifacts/doc/test/liverpool-digital/global-colors-ui-apply-remaining-capture-2026-06-24.json",
      "dev/agents/artifacts/doc/test/liverpool-digital/global-colors-ui-apply-remaining-capture-2026-06-24.png",
    ],
    reason: "Carlos's finding says Global Colors are the primary GHL color surface. The UI endpoint was proven, but the Liverpool Private Integration Token returned 401 for direct custom-colors read/write, so this remains a Profile 9 browser step until a supported public API scope is proven.",
  });
}

async function fetchLocationCompanyId(locationId: string, token: string): Promise<string> {
  const result = await readJson<{ location?: { companyId?: string }; companyId?: string }>(`/locations/${encodeURIComponent(locationId)}`, token);
  return result.body?.location?.companyId ?? result.body?.companyId ?? "";
}

async function fetchUsers(companyId: string, locationId: string, token: string): Promise<GhlUser[]> {
  if (!companyId) return [];
  const result = await readJson<{ users?: GhlUser[]; data?: GhlUser[] }>(
    `/users/search?companyId=${encodeURIComponent(companyId)}&locationId=${encodeURIComponent(locationId)}`,
    token,
  );
  return result.ok ? result.body?.users ?? result.body?.data ?? [] : [];
}

function calendarsFromBody(body: unknown): GhlCalendar[] {
  const calendars = (body as { calendars?: GhlCalendar[]; data?: GhlCalendar[] } | null)?.calendars
    ?? (body as { data?: GhlCalendar[] } | null)?.data
    ?? [];
  return Array.isArray(calendars) ? calendars : [];
}

async function fetchCalendars(locationId: string, token: string): Promise<GhlCalendar[]> {
  const result = await readJson<{ calendars?: GhlCalendar[]; data?: GhlCalendar[] }>(`/calendars/?locationId=${encodeURIComponent(locationId)}`, token);
  return result.ok ? calendarsFromBody(result.body) : [];
}

function calendarIdFromBookingUrl(value: string | undefined): string {
  return String(value ?? "").match(/\/booking\/([^/?#\s]+)/)?.[1] ?? "";
}

function targetCalendarIds(values: GhlCustomValue[]): string[] {
  return [
    calendarIdFromBookingUrl(findCustomValue(values, "free_consultation_calendar")?.value),
    calendarIdFromBookingUrl(findCustomValue(values, "on_site_visit_calendar")?.value),
  ].filter(Boolean);
}

function targetCalendars(calendars: GhlCalendar[], values: GhlCustomValue[]): GhlCalendar[] {
  const ids = new Set(targetCalendarIds(values));
  if (ids.size) return calendars.filter((calendar) => ids.has(String(calendar.id ?? "")));
  return calendars.filter((calendar) => /on[- ]?site|consultation|consulta/i.test(String(calendar.name ?? "")));
}

function teamMemberIds(calendar: GhlCalendar): string[] {
  return Array.isArray(calendar.teamMembers) ? calendar.teamMembers.map((item) => item.userId).filter((id): id is string => Boolean(id)) : [];
}

function calendarKind(calendar: GhlCalendar): "free" | "onsite" | "unknown" {
  const name = String(calendar.name ?? "");
  if (/consultation|consulta/i.test(name)) return "free";
  if (/on[- ]?site/i.test(name)) return "onsite";
  return "unknown";
}

function bookingRulePayload(calendar: GhlCalendar): Record<string, number | string> {
  const onsite = calendarKind(calendar) === "onsite";
  const buffer = onsite ? 45 : 15;
  const maxPerDay = onsite ? 4 : 8;
  return {
    allowBookingAfter: 1,
    allowBookingAfterUnit: "days",
    preBuffer: buffer,
    preBufferUnit: "mins",
    slotBuffer: buffer,
    slotBufferUnit: "mins",
    appoinmentPerDay: maxPerDay,
    appointmentPerDay: maxPerDay,
  };
}

function calendarSummary(calendar: GhlCalendar) {
  return {
    id: calendar.id ?? "",
    name: calendar.name ?? "",
    isActive: calendar.isActive === true,
    teamMemberIds: teamMemberIds(calendar),
    allowBookingAfter: calendar.allowBookingAfter ?? null,
    preBuffer: calendar.preBuffer ?? null,
    slotBuffer: calendar.slotBuffer ?? null,
    appointmentPerDay: calendar.appointmentPerDay ?? calendar.appoinmentPerDay ?? null,
  };
}

async function updateCalendar(calendarId: string, token: string, body: Record<string, unknown>): Promise<{ ok: boolean; status: number; text: string }> {
  const result = await readJson(`/calendars/${encodeURIComponent(calendarId)}`, token, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return { ok: result.ok, status: result.status, text: result.text };
}

async function handleCalendars(input: PostOnboardingSetupInput): Promise<SetupStepResult> {
  const [values, calendars, companyId] = await Promise.all([
    listCustomValues(input.locationId, input.token),
    fetchCalendars(input.locationId, input.token),
    fetchLocationCompanyId(input.locationId, input.token),
  ]);
  const targets = targetCalendars(calendars, values);
  const users = await fetchUsers(companyId, input.locationId, input.token);
  const mainUser = users.length === 1 ? users[0] : null;
  const mainUserId = mainUser?.id ?? "";

  if (targets.length < 2) {
    return step("calendars", "Calendars", "blocked", { targetCount: targets.length }, "Expected two onboarding calendars.");
  }

  if (input.mode === "reset") {
    if (input.locationId !== LIVERPOOL_DIGITAL_LOCATION_ID) {
      return step("calendars_reset", "Calendars reset", "blocked", undefined, "Reset is only enabled for Liverpool Digital test account.");
    }
    const updates = [];
    for (const calendar of targets) {
      if (!calendar.id) continue;
      const result = await updateCalendar(calendar.id, input.token, { isActive: false, teamMembers: [] });
      updates.push({ id: calendar.id, name: calendar.name, status: result.ok ? "updated" : "failed", statusCode: result.status });
    }
    return step("calendars_reset", "Calendars reset", updates.every((item) => item.status === "updated") ? "updated" : "failed", {
      updates,
      note: "Booking-rule reset skipped because exact original scheduling was not fully captured.",
    });
  }

  const ready = mainUserId && targets.every((calendar) => teamMemberIds(calendar).length === 1 && teamMemberIds(calendar)[0] === mainUserId && calendar.isActive === true);
  if (input.mode !== "apply") {
    return step("calendars", "Calendars", ready ? "pass" : input.mode === "verify" ? "failed" : "warning", {
      userCount: users.length,
      mainUserId: mainUserId || null,
      calendars: targets.map(calendarSummary),
    });
  }

  if (!mainUserId) {
    return step("calendars", "Calendars", "blocked", { userCount: users.length }, "Expected exactly one GHL user before assigning calendars.");
  }

  const updates = [];
  for (const calendar of targets) {
    if (!calendar.id) continue;
    const body = {
      teamMembers: [{ userId: mainUserId }],
      isActive: true,
      ...bookingRulePayload(calendar),
    };
    const result = await updateCalendar(calendar.id, input.token, body);
    updates.push({ id: calendar.id, name: calendar.name, status: result.ok ? "updated" : "failed", statusCode: result.status });
  }
  const verifiedTargets = targetCalendars(await fetchCalendars(input.locationId, input.token), values);
  const verified = verifiedTargets.length >= 2 && verifiedTargets.every((calendar) => {
    const ids = teamMemberIds(calendar);
    return calendar.isActive === true && ids.length === 1 && ids[0] === mainUserId;
  });

  return step("calendars", "Calendars", verified ? "updated" : "failed", {
    updates,
    readback: verifiedTargets.map(calendarSummary),
  }, verified ? undefined : "Calendar readback did not match expected active/owner state.");
}

async function handleContactLanguage(input: PostOnboardingSetupInput): Promise<SetupStepResult> {
  if (!input.submission?.contactId) return step("contact_language", "Contact language", "skipped", undefined, "No client contact id.");
  const target = input.submission.customerCommunicationLanguage ?? input.submission.preferredPlatformLanguage ?? "";
  if (!target) return step("contact_language", "Contact language", "skipped", undefined, "No language value in submission.");
  const current = await readJson<{ contact?: { language?: string }; language?: string }>(`/contacts/${encodeURIComponent(input.submission.contactId)}`, input.token);
  if (!current.ok) {
    return step("contact_language", "Contact language", "failed", { status: current.status }, current.text);
  }
  const currentLanguage = current.body?.contact?.language ?? current.body?.language ?? "";
  if (currentLanguage === target) return step("contact_language", "Contact language", "pass", { value: target });
  return step("contact_language", "Contact language", "blocked", {
    expected: target,
    current: currentLanguage || null,
    reason: "Contact language write payload still needs a dedicated test-contact proof.",
  });
}

function handleAddContactLayout(input: PostOnboardingSetupInput): SetupStepResult {
  return step("add_contact_layout", "Add Contact Language/DND layout", "needs_browser", {
    profile: "WSL Chrome Profile 9",
    expected: input.mode === "reset"
      ? "Language removed from Add Contact view and DND Channels restored"
      : "Language required and DND Channels absent",
    proof: [
      "dev/agents/artifacts/doc/test/liverpool-digital/contact-form-profile9-add-contact-panel-map-2026-06-10.json",
      "dev/agents/artifacts/doc/test/liverpool-digital/contact-form-profile9-add-contact-final-qa-map-2026-06-10.json",
    ],
  });
}

export async function runPostOnboardingSetup(input: PostOnboardingSetupInput): Promise<PostOnboardingSetupResult> {
  if (input.mode === "reset") {
    if (input.locationId !== LIVERPOOL_DIGITAL_LOCATION_ID || input.resetLocationId !== input.locationId || input.resetText !== "reset") {
      return {
        mode: input.mode,
        locationId: input.locationId,
        dryRun: false,
        ok: false,
        steps: [step("reset_guard", "Reset guard", "blocked", undefined, "Reset requires Liverpool Digital locationId and typed reset confirmation.")],
      };
    }
  }

  const steps: SetupStepResult[] = [
    ...(await handleCustomValues(input)),
    handleGlobalColors(input),
    await handleBrandBoard(input),
    await handleCalendars(input),
    await handleContactLanguage(input),
    handleAddContactLayout(input),
  ];
  const ok = steps.every((item) => item.status === "pass" || item.status === "updated" || item.status === "skipped");
  return {
    mode: input.mode,
    locationId: input.locationId,
    dryRun: input.mode === "inspect" || input.mode === "verify",
    ok,
    steps,
  };
}
