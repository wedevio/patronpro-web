import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getPpSession } from "@/lib/auth/require-session";
import type { DocPage } from "@/lib/docs/types";
import DocsPageClient from "./_components/DocsPageClient";

export const dynamic = "force-dynamic";

async function getPages(): Promise<DocPage[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data, error } = await supabase
    .from("doc_pages")
    .select("*")
    .eq("published", true)
    .order("position", { ascending: true });

  if (error) {
    console.error("[docs page] getPages error", error);
    return [];
  }
  return (data ?? []) as DocPage[];
}

export default async function DocsPage() {
  const session = await getPpSession();
  if (!session) redirect("/login");

  const pages = await getPages();

  return (
    <DocsPageClient
      initialPages={pages}
      isAdmin={session.role === "admin" || session.role === "manager"}
    />
  );
}
