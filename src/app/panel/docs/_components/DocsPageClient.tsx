"use client";

import { useState, useCallback } from "react";
import type { DocPage, DocBlock, BlockType } from "@/lib/docs/types";
import BlockRenderer from "./BlockRenderer";
import BlockEditor from "./BlockEditor";
import Outline from "./Outline";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  Loader2,
  FileText,
  PlusCircle,
  X,
  Menu,
  BookOpen,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function nanoid() {
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function defaultBlock(type: BlockType): DocBlock {
  if (type === "heading") return { id: nanoid(), type, data: { level: 2, text: "Nueva sección" } };
  if (type === "text")    return { id: nanoid(), type, data: { content: "Escribe aquí el contenido…" } };
  if (type === "image")   return { id: nanoid(), type, data: { url: "", alt: "", caption: "" } };
  if (type === "video")   return { id: nanoid(), type, data: { url: "", caption: "" } };
  return { id: nanoid(), type: "callout", data: { variant: "info", title: "Nota", content: "Escribe el contenido del callout…" } };
}

const BLOCK_TYPES: { type: BlockType; label: string }[] = [
  { type: "heading",  label: "Encabezado" },
  { type: "text",     label: "Texto" },
  { type: "image",    label: "Imagen" },
  { type: "video",    label: "Vídeo" },
  { type: "callout",  label: "Callout" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Add-block button shown between blocks
// ─────────────────────────────────────────────────────────────────────────────
function AddBlockButton({ onAdd }: { onAdd: (type: BlockType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative my-1 flex justify-center group">
      <button
        onClick={() => setOpen((o) => !o)}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center gap-1 text-[11px] text-slate-400 hover:text-orange-600 transition-all"
      >
        <Plus size={13} />
        Añadir bloque
      </button>
      {open && (
        <div className="absolute top-6 z-20 bg-white border border-slate-200 rounded-lg shadow-lg p-1 flex flex-col min-w-[140px]">
          {BLOCK_TYPES.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => { onAdd(type); setOpen(false); }}
              className="text-left px-3 py-1.5 text-[13px] hover:bg-slate-100 rounded"
            >
              {label}
            </button>
          ))}
          <button onClick={() => setOpen(false)} className="text-[11px] text-slate-400 px-3 py-1 hover:text-slate-700 flex items-center gap-1 mt-1 border-t border-slate-100">
            <X size={11} /> Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// New-page modal
// ─────────────────────────────────────────────────────────────────────────────
function NewPageModal({ onClose, onCreate }: { onClose: () => void; onCreate: (page: DocPage) => void }) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!title || !slug) return;
    setSaving(true);
    try {
      const res = await fetch("/api/panel/docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, description: desc }),
      });
      const json = await res.json() as { page?: DocPage; error?: string };
      if (!res.ok) { alert(json.error ?? "Error"); return; }
      onCreate(json.page!);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full border border-slate-300 rounded px-2 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-orange-400";
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[16px]" style={{ color: "#1E2C46" }}>Nueva página</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inp} placeholder="Nombre de la página" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">Slug (URL)</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))} className={inp} placeholder="nombre-pagina" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1">Descripción (opcional)</label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} className={inp} />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleCreate}
            disabled={saving || !title || !slug}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-medium rounded text-white disabled:opacity-50"
            style={{ background: "#1E2C46" }}
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <PlusCircle size={13} />}
            Crear
          </button>
          <button onClick={onClose} className="px-4 py-1.5 text-[13px] rounded border border-slate-300 bg-white hover:bg-slate-50">Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  initialPages: DocPage[];
  isAdmin: boolean;
}

export default function DocsPageClient({ initialPages, isAdmin }: Props) {
  const [pages, setPages] = useState<DocPage[]>(initialPages);
  const [selectedSlug, setSelectedSlug] = useState<string>(initialPages[0]?.slug ?? "");
  const [editingBlocks, setEditingBlocks] = useState<DocBlock[] | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [outlineActive, setOutlineActive] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showNewPage, setShowNewPage] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const page = pages.find((p) => p.slug === selectedSlug) ?? null;
  const blocks = editingBlocks ?? page?.blocks ?? [];

  // ── edit mode helpers ──────────────────────────────────────────────────────
  function enterEditMode() {
    if (page) setEditingBlocks([...page.blocks]);
  }

  function cancelEditMode() {
    setEditingBlocks(null);
    setEditingBlockId(null);
    setDirty(false);
  }

  function mutateBlocks(fn: (prev: DocBlock[]) => DocBlock[]) {
    setEditingBlocks((prev) => {
      const next = fn(prev ?? page?.blocks ?? []);
      setDirty(true);
      return next;
    });
  }

  // ── block operations ───────────────────────────────────────────────────────
  const moveUp = useCallback((id: string) => {
    mutateBlocks((bs) => {
      const idx = bs.findIndex((b) => b.id === id);
      if (idx <= 0) return bs;
      const next = [...bs];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const moveDown = useCallback((id: string) => {
    mutateBlocks((bs) => {
      const idx = bs.findIndex((b) => b.id === id);
      if (idx < 0 || idx >= bs.length - 1) return bs;
      const next = [...bs];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteBlock = useCallback((id: string) => {
    if (!confirm("¿Eliminar este bloque?")) return;
    mutateBlocks((bs) => bs.filter((b) => b.id !== id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveBlock = useCallback((updated: DocBlock) => {
    mutateBlocks((bs) => bs.map((b) => (b.id === updated.id ? updated : b)));
    setEditingBlockId(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addBlock = useCallback((type: BlockType, afterId?: string) => {
    const newBlock = defaultBlock(type);
    mutateBlocks((bs) => {
      if (!afterId) return [...bs, newBlock];
      const idx = bs.findIndex((b) => b.id === afterId);
      if (idx < 0) return [...bs, newBlock];
      const next = [...bs];
      next.splice(idx + 1, 0, newBlock);
      return next;
    });
    setEditingBlockId(newBlock.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── save page ──────────────────────────────────────────────────────────────
  async function savePage() {
    if (!page || !editingBlocks) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/panel/docs/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blocks: editingBlocks }),
      });
      const json = await res.json() as { page?: DocPage; error?: string };
      if (!res.ok) { alert(json.error ?? "Error al guardar"); return; }
      setPages((prev) => prev.map((p) => (p.id === json.page!.id ? json.page! : p)));
      setEditingBlocks(null);
      setEditingBlockId(null);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }

  // ── new page created ───────────────────────────────────────────────────────
  function handlePageCreated(newPage: DocPage) {
    setPages((prev) => [...prev, newPage]);
    setSelectedSlug(newPage.slug);
    setEditingBlocks([]);
    setDirty(false);
  }

  function selectPage(slug: string) {
    if (dirty && !confirm("¿Descartar cambios sin guardar?")) return;
    setSelectedSlug(slug);
    setEditingBlocks(null);
    setEditingBlockId(null);
    setDirty(false);
    setMobileSidebarOpen(false);
  }

  // ── render ─────────────────────────────────────────────────────────────────
  const isEditing = editingBlocks !== null;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden">

      {/* ── Mobile top bar ── */}
      <div className="flex md:hidden items-center gap-3 px-4 py-2.5 border-b border-slate-100 bg-white shrink-0">
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          aria-label="Ver páginas"
        >
          <Menu size={18} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <BookOpen size={14} className="text-slate-400 shrink-0" />
          <span className="text-[13px] font-medium text-slate-700 truncate">
            {page?.title ?? "Seleccionar página"}
          </span>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowNewPage(true)}
            className="text-slate-400 hover:text-orange-600 transition-colors shrink-0"
            title="Nueva página"
          >
            <PlusCircle size={16} />
          </button>
        )}
      </div>

      {/* ── Main content row ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Mobile backdrop */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`
            fixed md:static top-0 left-0 h-full md:h-auto z-40
            w-[280px] md:w-56 shrink-0 border-r border-slate-200 bg-white flex flex-col
            transition-transform duration-200 ease-in-out
            ${mobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-[12px] font-semibold uppercase tracking-widest text-slate-400">Páginas</span>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => { setShowNewPage(true); setMobileSidebarOpen(false); }}
                  title="Nueva página"
                  className="text-slate-400 hover:text-orange-600 transition-colors"
                >
                  <PlusCircle size={15} />
                </button>
              )}
              {/* Close button — only visible on mobile */}
              <button
                className="md:hidden text-slate-400 hover:text-slate-700 transition-colors"
                onClick={() => setMobileSidebarOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => selectPage(p.slug)}
                className={`w-full text-left flex items-center gap-2 px-4 py-2.5 text-[13px] transition-colors ${
                  p.slug === selectedSlug
                    ? "font-medium text-orange-600 bg-orange-50 border-r-2 border-orange-500"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <FileText size={13} className="shrink-0" />
                {p.title}
              </button>
            ))}
            {pages.length === 0 && (
              <p className="px-4 py-3 text-[12px] text-slate-400">Sin páginas. Crea una.</p>
            )}
          </nav>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 overflow-y-auto bg-white">
          {!page ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-[14px] gap-3 px-4 text-center">
              <FileText size={36} className="text-slate-200" />
              <p>Selecciona una página del panel izquierdo.</p>
              {/* Mobile hint */}
              <p className="md:hidden text-[12px] text-slate-300">
                Toca el ícono de menú arriba para ver las páginas.
              </p>
            </div>
          ) : (
            <div className="max-w-[780px] mx-auto px-4 py-5 pb-24 sm:px-8 sm:py-8">
              {/* Page header */}
              <div className="mb-5 sm:mb-6">
                <h1 className="text-[22px] sm:text-[26px] font-bold mb-1" style={{ color: "#1E2C46" }}>
                  {page.title}
                </h1>
                {page.description && (
                  <p className="text-slate-500 text-[13px] sm:text-[14px]">{page.description}</p>
                )}
              </div>

              {/* Admin/manager toolbar */}
              {isAdmin && (
                <div className="sticky top-0 z-20 mb-5 sm:mb-6 -mx-2 px-2 py-2 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
                  <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 shadow-sm">
                  {!isEditing ? (
                    <button
                      onClick={enterEditMode}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded text-white"
                      style={{ background: "#1E2C46" }}
                    >
                      <Pencil size={13} />
                      Editar página
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={savePage}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded text-white disabled:opacity-60"
                        style={{ background: "#F67D0A" }}
                      >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {saving ? "Guardando…" : "Guardar cambios"}
                      </button>
                      <button
                        onClick={cancelEditMode}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded border border-slate-300 bg-white hover:bg-slate-50"
                      >
                        <X size={13} />
                        Cancelar
                      </button>
                      {dirty && (
                        <span className="text-[11px] text-orange-600 font-medium">Cambios sin guardar</span>
                      )}
                    </>
                  )}
                  </div>
                </div>
              )}

              {/* Blocks */}
              <div>
                {isEditing && blocks.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-[14px]">Esta página no tiene bloques.</p>
                    <button
                      onClick={() => addBlock("text")}
                      className="mt-3 flex items-center gap-1.5 mx-auto text-[13px] text-orange-600 hover:text-orange-700"
                    >
                      <Plus size={14} />
                      Añadir el primer bloque
                    </button>
                  </div>
                )}

                {blocks.map((block, idx) => (
                  <div key={block.id} className="group relative">
                    {/* Editing state: show editor form instead of renderer */}
                    {isEditing && editingBlockId === block.id ? (
                      <BlockEditor
                        block={block}
                        onSave={saveBlock}
                        onCancel={() => setEditingBlockId(null)}
                      />
                    ) : (
                      <div className={`relative ${isEditing ? "hover:bg-slate-50 rounded" : ""}`}>
                        <BlockRenderer block={block} />

                        {/* Admin action buttons (edit mode only) */}
                        {isEditing && (
                          <div className="absolute right-0 top-1 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setEditingBlockId(block.id)}
                              className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-orange-600 shadow-sm"
                              title="Editar"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => moveUp(block.id)}
                              disabled={idx === 0}
                              className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-blue-600 shadow-sm disabled:opacity-30"
                              title="Subir"
                            >
                              <ChevronUp size={12} />
                            </button>
                            <button
                              onClick={() => moveDown(block.id)}
                              disabled={idx === blocks.length - 1}
                              className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-blue-600 shadow-sm disabled:opacity-30"
                              title="Bajar"
                            >
                              <ChevronDown size={12} />
                            </button>
                            <button
                              onClick={() => deleteBlock(block.id)}
                              className="p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-red-600 shadow-sm"
                              title="Eliminar"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Add block between items */}
                    {isEditing && editingBlockId !== block.id && (
                      <AddBlockButton onAdd={(type) => addBlock(type, block.id)} />
                    )}
                  </div>
                ))}

                {/* Add block at the end */}
                {isEditing && blocks.length > 0 && (
                  <div className="mt-4 flex justify-center">
                    <button
                      onClick={() => addBlock("text")}
                      className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-orange-600 transition-colors"
                    >
                      <Plus size={14} />
                      Añadir bloque al final
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* ── Right outline ── */}
        {page && (
          <aside className="w-52 shrink-0 border-l border-slate-200 bg-white overflow-y-auto hidden xl:block">
            <div className="px-4 py-5">
              <Outline
                blocks={blocks}
                activeId={outlineActive}
                onSelect={setOutlineActive}
              />
            </div>
          </aside>
        )}
      </div>

      {/* ── New page modal ── */}
      {showNewPage && (
        <NewPageModal onClose={() => setShowNewPage(false)} onCreate={handlePageCreated} />
      )}
    </div>
  );
}
