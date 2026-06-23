import { CollaboratorShell } from "@/components/collaborators/CollaboratorShell";

export default function CollaboratorsLayout({ children }: { children: React.ReactNode }) {
  return <CollaboratorShell>{children}</CollaboratorShell>;
}
