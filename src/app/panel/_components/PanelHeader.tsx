"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutList, TicketCheck, BookOpen, KanbanSquare, CalendarPlus, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { href: "/panel/onboarding",    label: "Onboarding",    icon: LayoutList },
  { href: "/panel/onboarding-invites", label: "Invites", icon: CalendarPlus },
  { href: "/panel/roadmap",       label: "Roadmap",       icon: KanbanSquare },
  { href: "/panel/support",       label: "Soporte",       icon: TicketCheck },
  { href: "/panel/docs",          label: "Documentación", icon: BookOpen },
];

export default function PanelHeader() {
  const pathname        = usePathname();
  const router          = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
  }

  return (
    <header style={{ background: "#1E2C46" }}>
      {/* ── Top bar ── */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Image src="/assets/PatronPro-white.png" width={130} height={34} alt="PatronPro" priority />

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                  active ? "bg-white/15" : "hover:bg-white/10"
                }`}
                style={{ color: "white", opacity: active ? 1 : 0.75 }}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all ml-2 border-l border-white/10 pl-4"
          >
            <LogOut size={14} />
            Salir
          </button>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-all"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menú"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── Mobile dropdown ── */}
      {open && (
        <nav className="md:hidden border-t border-white/10 px-4 pb-3 pt-2 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[14px] font-medium transition-all ${
                  active ? "bg-white/15" : "hover:bg-white/10"
                }`}
                style={{ color: "white", opacity: active ? 1 : 0.8 }}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}

          <button
            onClick={() => { setOpen(false); void handleLogout(); }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[14px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all mt-1 border-t border-white/10 pt-3"
          >
            <LogOut size={16} />
            Salir
          </button>
        </nav>
      )}
    </header>
  );
}
