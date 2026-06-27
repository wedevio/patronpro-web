import Link from "next/link";

const navItems = [
  ["Overview", "/collaborators"],
  ["Schools", "/collaborators/schools"],
  ["Influencers", "/collaborators/influencers"],
  ["Communities", "/collaborators/communities"],
  ["Recommendations", "/collaborators/recommendations"],
  ["Roadmap", "/collaborators/roadmap"],
  ["Sources", "/collaborators/sources"],
];

function BrandBlock() {
  return (
    <Link href="/collaborators" className="block rounded-xl bg-[#1E2C46] p-4 text-white">
      <span className="block text-xs uppercase tracking-[0.16em] text-[#FCCC7B]">PatronPro</span>
      <span className="mt-2 block text-xl font-semibold text-[#f8fafc]">Collaborator OS</span>
    </Link>
  );
}

function NavLinks() {
  return (
    <nav className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
      {navItems.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className="rounded-xl px-3 py-2 text-sm font-medium text-[#33415c] hover:bg-[#f0f4fa] hover:text-[#1E2C46]"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function CollaboratorShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#182235]">
      <aside className="hidden lg:block">
        <details className="fixed -left-2 top-24 z-40 w-14 overflow-hidden rounded-2xl border border-[#dfe5ee] bg-white shadow-lg transition-[width] open:w-72">
          <summary className="flex h-14 cursor-pointer list-none items-center justify-center bg-[#1E2C46] text-sm font-semibold text-white outline-none [&::-webkit-details-marker]:hidden">
            OS
          </summary>
          <div className="w-72 p-4">
            <BrandBlock />
            <NavLinks />
          </div>
        </details>
      </aside>
      <div className="mx-auto w-full max-w-[1680px] px-4 py-5 md:px-6 lg:py-8">
        <aside className="mb-6 lg:hidden">
          <div className="rounded-2xl border border-[#dfe5ee] bg-white p-4 shadow-sm">
            <BrandBlock />
            <NavLinks />
          </div>
        </aside>
        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}
