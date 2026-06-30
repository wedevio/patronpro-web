import { describe, expect, test } from "bun:test";
import { accountBelongsToLocation } from "../src/lib/website/account-scope";

type ScopeDb = Parameters<typeof accountBelongsToLocation>[0];

function fakeScopeDb(result: { data: { id: string } | null; error: { message: string } | null }) {
  const calls: Array<[string, string]> = [];
  const query = {
    eq(column: string, value: string) {
      calls.push([column, value]);
      return query;
    },
    async maybeSingle() {
      return result;
    },
  };

  return {
    calls,
    db: {
      from(table: string) {
        calls.push(["from", table]);
        return {
          select(columns: string) {
            calls.push(["select", columns]);
            return query;
          },
        };
      },
    } as unknown as ScopeDb,
  };
}

describe("accountBelongsToLocation", () => {
  test("matches account id and location id together", async () => {
    const { db, calls } = fakeScopeDb({ data: { id: "acct_123" }, error: null });

    await expect(accountBelongsToLocation(db, "acct_123", "loc_123")).resolves.toBe(true);
    expect(calls).toEqual([
      ["from", "accounts"],
      ["select", "id"],
      ["id", "acct_123"],
      ["location_id", "loc_123"],
    ]);
  });

  test("returns false when the pair does not exist", async () => {
    const { db } = fakeScopeDb({ data: null, error: null });

    await expect(accountBelongsToLocation(db, "acct_123", "loc_other")).resolves.toBe(false);
  });

  test("surfaces database lookup errors", async () => {
    const { db } = fakeScopeDb({ data: null, error: { message: "connection failed" } });

    await expect(accountBelongsToLocation(db, "acct_123", "loc_123")).rejects.toThrow(
      "account_scope_lookup_failed: connection failed",
    );
  });
});
