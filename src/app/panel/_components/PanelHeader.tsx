"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutList, TicketCheck, BookOpen, LogOut } from "lucide-react";

const NAV = [
  { href: "/panel/onboarding",    label: "Onboarding",    icon: LayoutList },
  { href: "/panel/support",       label: "Soporte",       icon: TicketCheck },
  { href: "/panel/docs",          label: "Documentación", icon: BookOpen },
];

export default function PanelHeader() {
  const pathname = usePathname();
  const router   = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
  }

  return (
    <header style={{ background: "#1E2C46" }}>
      <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-6">
        <Image src="/assets/PatronPro-white.png" width={130} height={34} alt="PatronPro" priority />

        <nav className="flex items-center gap-1">
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
      </div>
    </header>
  );
}
