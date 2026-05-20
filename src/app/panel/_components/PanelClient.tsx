"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Circle,
  X,
  Search,
  ChevronDown,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  CreditCard,
  Tag,
  Clock,
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
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "active")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-700">
        Activo
      </span>
    );
  if (s === "inactive")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700">
        Inactivo
      </span>
    );
  if (s === "trial")
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700">
        Trial
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-500">
      —
    </span>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ pct, width = "w-20" }: { pct: number; width?: string }) {
  const color =
    pct === 100 ? "#22c55e" : pct >= 50 ? "#F67D0A" : "#94a3b8";
  return (
    <div
      className={`${width} h-1.5 rounded-full bg-slate-200 overflow-hidden shrink-0`}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ─── Side Panel ───────────────────────────────────────────────────────────────

function SidePanel({
  account,
  onClose,
}: {
  account: EnrichedAccount;
  onClose: () => void;
}) {
  const { ghl, submission } = account;
  const [checklist, setChecklist] = useState(
    submission?.checklist ?? ({} as Record<ChecklistItemId, boolean>)
  );
  const [isPending, startTransition] = useTransition();

  const done = countDone(checklist);
  const pct = progressPct(checklist);

  async function toggle(itemId: ChecklistItemId) {
    const newVal = !checklist[itemId];
    setChecklist((prev) => ({ ...prev, [itemId]: newVal }));
    startTransition(async () => {
      try {
        const res = await fetch("/api/panel/checklist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locationId: account.locationId,
            itemId,
            checked: newVal,
          }),
        });
        if (!res.ok) {
          setChecklist((prev) => ({ ...prev, [itemId]: !newVal }));
        }
      } catch {
        setChecklist((prev) => ({ ...prev, [itemId]: !newVal }));
      }
    });
  }

  const DAYS: Array<[string, string]> = [
    ["monday", "Lunes"],
    ["tuesday", "Martes"],
    ["wednesday", "Miércoles"],
    ["thursday", "Jueves"],
    ["friday", "Viernes"],
    ["saturday", "Sábado"],
    ["sunday", "Domingo"],
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-[50vw] min-w-[400px] max-w-[700px] bg-white z-50 flex flex-col shadow-2xl">
        {/* Panel Header */}
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
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors p-1 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-6 py-6 space-y-8">

          {/* Section 1: GHL Data */}
          <section>
            <h3 className="font-bold text-[13px] uppercase tracking-widest text-slate-400 mb-3">
              Cuenta GHL
            </h3>
            <div className="grid gap-2 text-[13px]">
              <Row icon={<Building2 size={14} />} label="Nombre" value={ghl.name} />
              <Row icon={<MapPin size={14} />} label="Dirección" value={ghl.address} />
              <Row icon={<Phone size={14} />} label="Teléfono" value={ghl.phone} />
              <Row icon={<Mail size={14} />} label="Email" value={ghl.email} />
              <Row icon={<Globe size={14} />} label="Sitio web" value={ghl.website} />
              <Row icon={<Calendar size={14} />} label="Creado" value={formatDate(ghl.createdAt)} />
              <Row icon={<Tag size={14} />} label="Plan" value={ghl.planName} />
              <div className="flex gap-2 items-center">
                <span className="text-slate-400 w-[90px] shrink-0 flex items-center gap-1.5">
                  <CreditCard size={14} />
                  Estado
                </span>
                {statusBadge(ghl.planStatus)}
              </div>
              {ghl.mrr > 0 && (
                <Row
                  icon={<CreditCard size={14} />}
                  label="MRR"
                  value={`$${ghl.mrr.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                />
              )}
            </div>
          </section>

          {/* Section 2: Form Data */}
          {submission && submission.checklist.form && (
            <section>
              <h3 className="font-bold text-[13px] uppercase tracking-widest text-slate-400 mb-3">
                Datos del formulario
              </h3>
              <div className="grid gap-2 text-[13px]">
                <Row icon={<Building2 size={14} />} label="Negocio" value={submission.businessName} />
                <Row icon={<Building2 size={14} />} label="Nombre legal" value={submission.legalName} />
                <Row icon={<Mail size={14} />} label="Email" value={submission.email} />
                <Row icon={<Phone size={14} />} label="Teléfono" value={submission.phone} />
                <Row icon={<MapPin size={14} />} label="Dirección" value={[submission.address, submission.city, submission.state, submission.zip, submission.country].filter(Boolean).join(", ")} />
                {submission.ein && (
                  <Row icon={<Tag size={14} />} label="EIN" value={submission.ein} />
                )}

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-2">Dominio</p>
                  <Row icon={<Globe size={14} />} label="Tipo" value={submission.domainType === "existing" ? "Dominio existente" : submission.domainType === "new" ? "Dominio nuevo" : "Sin dominio"} />
                  {submission.domain && <Row icon={<Globe size={14} />} label="Dominio" value={submission.domain} />}
                  {submission.domainRegistrar && <Row icon={<Globe size={14} />} label="Registrar" value={submission.domainRegistrar} />}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-2">Marca</p>
                  {submission.letUsChooseColors ? (
                    <p className="text-slate-500 italic">PatronPro elige los colores</p>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <ColorSwatch label="Principal" color={submission.primaryColor} />
                      <ColorSwatch label="Acento" color={submission.secondaryColor} />
                      <ColorSwatch label="Complementario" color={submission.complementaryColor} />
                    </div>
                  )}
                </div>

                {submission.logoUrl && (
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-2">Logo</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={submission.logoUrl}
                      alt="Logo"
                      className="h-16 w-auto object-contain rounded border border-slate-200 bg-slate-50 p-1"
                    />
                  </div>
                )}

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
                                {day.open ? (
                                  <span className="text-green-600 font-medium">Abierto</span>
                                ) : (
                                  <span className="text-slate-400">Cerrado</span>
                                )}
                              </td>
                              <td className="py-1 text-slate-600">
                                {day.open ? `${day.from} – ${day.to}` : ""}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <Row icon={<Calendar size={14} />} label="Enviado" value={formatDate(submission.submittedAt)} />
              </div>
            </section>
          )}

          {/* Section 3: Checklist */}
          <section>
            <h3 className="font-bold text-[13px] uppercase tracking-widest text-slate-400 mb-3">
              Checklist de setup
            </h3>
            <div className="mb-3 flex items-center gap-3">
              <ProgressBar pct={pct} width="flex-1" />
              <span className="text-[12px] font-semibold text-slate-500 shrink-0">
                {done}/{CHECKLIST_ITEMS.length}
              </span>
            </div>
            <ul className="grid gap-1" style={{ opacity: isPending ? 0.6 : 1 }}>
              {CHECKLIST_ITEMS.map((item) => {
                const checked = checklist[item.id] ?? false;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => toggle(item.id)}
                      disabled={isPending}
                      className="flex items-center gap-3 w-full text-left cursor-pointer group py-1.5"
                    >
                      {checked ? (
                        <CheckCircle2 size={17} strokeWidth={2} className="text-green-500 shrink-0" />
                      ) : (
                        <Circle size={17} strokeWidth={1.5} className="text-slate-300 group-hover:text-[#F67D0A] shrink-0 transition-colors" />
                      )}
                      <span
                        className="text-[13px] leading-snug transition-colors"
                        style={{
                          color: checked ? "#94a3b8" : "#1E2C46",
                          textDecoration: checked ? "line-through" : "none",
                        }}
                      >
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

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-2 items-start">
      <span className="text-slate-400 w-[90px] shrink-0 flex items-center gap-1.5 pt-0.5">
        {icon}
        {label}
      </span>
      <span className="text-slate-700 break-all">{value || "—"}</span>
    </div>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  if (!color) return null;
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-5 h-5 rounded border border-slate-200 shrink-0"
        style={{ background: color }}
      />
      <span className="text-slate-500 text-[11px]">{label}</span>
      <span className="text-slate-400 text-[11px] font-mono">{color}</span>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

type FilterType = "all" | "active" | "inactive" | "no-onboarding";
type SortType = "date-desc" | "date-asc" | "name" | "plan";

export default function PanelClient({
  accounts,
}: {
  accounts: EnrichedAccount[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("date-desc");
  const [selected, setSelected] = useState<EnrichedAccount | null>(null);

  // Stats
  const total = accounts.length;
  const active = accounts.filter(
    (a) => a.ghl.planStatus.toLowerCase() === "active"
  ).length;
  const pendingSetup = accounts.filter(
    (a) => !a.submission?.checklist.form
  ).length;
  const completed = accounts.filter(
    (a) =>
      a.submission &&
      progressPct(a.submission.checklist) === 100
  ).length;

  // Filter + search
  const visible = accounts
    .filter((a) => {
      const q = search.toLowerCase();
      if (q) {
        const name = (a.submission?.businessName || a.ghl.name).toLowerCase();
        const email = (a.submission?.email || a.ghl.email).toLowerCase();
        if (!name.includes(q) && !email.includes(q)) return false;
      }
      if (filter === "active") return a.ghl.planStatus.toLowerCase() === "active";
      if (filter === "inactive") return a.ghl.planStatus.toLowerCase() === "inactive";
      if (filter === "no-onboarding") return !a.submission?.checklist.form;
      return true;
    })
    .sort((a, b) => {
      if (sort === "date-asc") {
        return (a.submission?.submittedAt ?? "").localeCompare(b.submission?.submittedAt ?? "");
      }
      if (sort === "date-desc") {
        return (b.submission?.submittedAt ?? "").localeCompare(a.submission?.submittedAt ?? "");
      }
      if (sort === "name") {
        const na = a.submission?.businessName || a.ghl.name;
        const nb = b.submission?.businessName || b.ghl.name;
        return na.localeCompare(nb);
      }
      if (sort === "plan") {
        return a.ghl.planName.localeCompare(b.ghl.planName);
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header style={{ background: "#1E2C46" }}>
        <div className="max-w-[1250px] mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Image
            src="/assets/PatronPro-white.png"
            width={140}
            height={36}
            alt="PatronPro"
            priority
          />
          <div className="flex items-center gap-3 flex-wrap justify-end">
            <Chip label="cuentas totales" value={total} color="white" />
            <Chip label="activas" value={active} color="#22c55e" />
            <Chip label="pendientes setup" value={pendingSetup} color="#F67D0A" />
            <Chip label="completadas" value={completed} color="#60a5fa" />
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1250px] mx-auto px-6 py-3 flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-[13px] border border-slate-200 rounded-md outline-none focus:border-[#1E2C46] bg-slate-50"
            />
          </div>

          {/* Filter */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="appearance-none pl-3 pr-8 py-2 text-[13px] border border-slate-200 rounded-md outline-none focus:border-[#1E2C46] bg-white cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="no-onboarding">Sin onboarding</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="appearance-none pl-3 pr-8 py-2 text-[13px] border border-slate-200 rounded-md outline-none focus:border-[#1E2C46] bg-white cursor-pointer"
            >
              <option value="date-desc">Fecha (reciente)</option>
              <option value="date-asc">Fecha (antigua)</option>
              <option value="name">Nombre A-Z</option>
              <option value="plan">Plan</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="max-w-[1250px] mx-auto px-6 py-6">
        {visible.length === 0 ? (
          <div className="text-center py-24 text-slate-400 text-[15px]">
            No se encontraron cuentas con esos filtros.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-[13px]">
              <thead>
                <tr
                  className="text-left border-b border-slate-100"
                  style={{ background: "#f8fafc" }}
                >
                  <Th>#</Th>
                  <Th>Negocio</Th>
                  <Th>Email</Th>
                  <Th>Dominio</Th>
                  <Th>Plan</Th>
                  <Th>Estado GHL</Th>
                  <Th>Onboarding</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((account, idx) => {
                  const sub = account.submission;
                  const name = sub?.businessName || account.ghl.name || "—";
                  const email = sub?.email || account.ghl.email || "—";
                  const domain = sub?.domain || account.ghl.website || "—";
                  const checklist = sub?.checklist ?? ({} as Record<ChecklistItemId, boolean>);
                  const done = countDone(checklist);
                  const pct = progressPct(checklist);
                  const isActive = account.ghl.planStatus.toLowerCase() === "active";

                  return (
                    <tr
                      key={account.locationId}
                      onClick={() => setSelected(account)}
                      className="border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors"
                      style={{ background: idx % 2 === 0 ? "white" : "#fafafa" }}
                    >
                      <td className="px-4 py-3 text-slate-400 text-[12px] w-10">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#1E2C46] leading-tight">{name}</p>
                        <p className="text-slate-400 text-[11px] mt-0.5 font-mono">{account.locationId}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{email}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {domain !== "—" ? (
                          <span className="font-mono text-[12px]">{domain}</span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {account.ghl.planName !== "—" ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold"
                            style={{
                              background: isActive ? "rgba(246,125,10,0.10)" : "#f1f5f9",
                              color: isActive ? "#F67D0A" : "#94a3b8",
                            }}
                          >
                            {account.ghl.planName}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{statusBadge(account.ghl.planStatus)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar pct={pct} />
                          <span className="text-[11px] text-slate-500 shrink-0">
                            {done}/{CHECKLIST_ITEMS.length}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(account);
                          }}
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

      {/* Side Panel */}
      {selected && (
        <SidePanel account={selected} onClose={() => setSelected(null)} />
      )}
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

function Chip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
      <span className="font-bold text-[15px]" style={{ color }}>
        {value}
      </span>
      <span className="text-white/60 text-[12px]">{label}</span>
    </div>
  );
}
