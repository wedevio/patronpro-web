import type { Metadata } from "next";

import { CollaboratorShell } from "@/components/collaborators/CollaboratorShell";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "PatronPro Collaborator Research",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CollaboratorsLayout({ children }: { children: React.ReactNode }) {
  return <CollaboratorShell>{children}</CollaboratorShell>;
}
