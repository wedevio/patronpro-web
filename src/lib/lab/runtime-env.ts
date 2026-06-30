import { readFileSync } from "node:fs";
import path from "node:path";

const ENV_FILE = ".env.production.local";

let cachedEnv: Record<string, string> | null = null;

function parseEnvFile(): Record<string, string> {
  if (cachedEnv) return cachedEnv;
  cachedEnv = {};

  try {
    const raw = readFileSync(path.join(process.cwd(), ENV_FILE), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(trimmed);
      if (!match) continue;
      const [, key, value] = match;
      cachedEnv[key] = value.replace(/^['"]|['"]$/g, "");
    }
  } catch {
    // Runtime env remains authoritative; the file fallback is best-effort only.
  }

  return cachedEnv;
}

export function runtimeEnv(key: string): string | undefined {
  return process.env[key] || parseEnvFile()[key];
}
