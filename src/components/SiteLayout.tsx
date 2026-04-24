import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header
      className="sticky top-0 z-10 backdrop-blur-[14px] border-b"
      style={{ background: "rgba(255,255,255,0.82)", borderColor: "rgba(30,44,70,0.06)" }}
    >
      <div className="w-full max-w-[1180px] mx-auto px-5 min-h-[82px] flex items-center justify-between gap-6">
        <Link href="/" className="block flex-shrink-0">
          <Image src="/assets/PatronPro.svg" alt="PatronPro" width={170} height={40} priority />
        </Link>
        <nav className="hidden md:flex gap-6 font-semibold text-[15px]" style={{ color: "#5f6f88" }}>
          <Link href="/#problema" className="hover:text-[#1E2C46] transition-colors">El problema</Link>
          <Link href="/#como-funciona" className="hover:text-[#1E2C46] transition-colors">Cómo funciona</Link>
          <Link href="/#producto" className="hover:text-[#1E2C46] transition-colors">El producto</Link>
          <Link href="/#precios" className="hover:text-[#1E2C46] transition-colors">Precios</Link>
        </nav>
        <Link
          href="/#precios"
          className="inline-flex items-center justify-center min-h-[56px] px-7 rounded-[18px] font-bold text-[16px] text-white transition-all hover:-translate-y-0.5"
          style={{ background: "#F67D0A", boxShadow: "0 12px 30px rgba(246,125,10,0.28)" }}
        >
          Empezar ahora
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="py-10" style={{ background: "#1E2C46" }}>
      <div className="w-full max-w-[1180px] mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[14px]" style={{ color: "rgba(255,255,255,0.50)" }}>
          © 2026 Patrón Pro. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-5 text-[14px]" style={{ color: "rgba(255,255,255,0.50)" }}>
          <Link href="/privacy" className="hover:text-white/80 transition-colors">Privacy Policy</Link>
          <Link href="/cookies" className="hover:text-white/80 transition-colors">Cookies Policy</Link>
          <Link href="/terms" className="hover:text-white/80 transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
