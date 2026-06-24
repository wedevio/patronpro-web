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
          className="flex items-center justify-center px-6 py-4"
          style={{ backgroundColor: "#1E2C46" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/PatronPro-white.png"
            alt="PatronPro"
            className="h-8"
          />
        </header>
        <main className="py-10 px-4">{children}</main>
      </body>
    </html>
  );
}
