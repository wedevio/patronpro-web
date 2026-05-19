import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding | PatronPro",
  description: "Configurá tu cuenta de PatronPro",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-[#f9fafb] min-h-screen">
        <header
          className="flex items-center px-6 py-4"
          style={{ backgroundColor: "#1E2C46" }}
        >
          <span
            className="text-xl font-bold tracking-tight"
            style={{ color: "#F67D0A" }}
          >
            PatronPro
          </span>
        </header>
        <main className="py-10 px-4">{children}</main>
      </body>
    </html>
  );
}
