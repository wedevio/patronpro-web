import "server-only";

import { Pool } from "pg";

let pool: Pool | undefined;

export function getCollaboratorPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL for collaborator dashboard");
  }

  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30_000,
  });

  return pool;
}

export async function queryRows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const result = await getCollaboratorPool().query(sql, params);
  return result.rows as T[];
}
