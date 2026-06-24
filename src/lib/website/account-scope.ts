import type { getAdminClient } from "@/lib/supabase/client";

type AdminClient = ReturnType<typeof getAdminClient>;

export async function accountBelongsToLocation(
  db: AdminClient,
  accountId: string,
  locationId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from("accounts")
    .select("id")
    .eq("id", accountId)
    .eq("location_id", locationId)
    .maybeSingle();

  if (error) {
    throw new Error(`account_scope_lookup_failed: ${error.message}`);
  }

  return Boolean(data);
}
