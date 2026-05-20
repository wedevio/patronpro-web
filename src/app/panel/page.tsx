import { getAllSubmissions } from "@/lib/panel/store";
import PanelClient from "./_components/PanelClient";

export const dynamic = "force-dynamic";

export default async function PanelPage() {
  const submissions = await getAllSubmissions();
  return <PanelClient submissions={submissions} />;
}
