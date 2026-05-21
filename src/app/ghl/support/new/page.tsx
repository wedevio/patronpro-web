import type { SearchParams } from "next/dist/server/request/search-params";
import GhlSupportClient from "./_components/GhlSupportClient";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<SearchParams>;
}

export default async function GhlSupportNewPage({ searchParams }: Props) {
  const params = await searchParams;
  const locationId = typeof params.location_id === "string" ? params.location_id : undefined;
  const userId = typeof params.user_id === "string" ? params.user_id : undefined;

  return <GhlSupportClient locationId={locationId} userId={userId} />;
}
