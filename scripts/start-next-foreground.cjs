#!/usr/bin/env node

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.NEXT_RUNTIME = process.env.NEXT_RUNTIME || "nodejs";
process.env.NEXT_PRIVATE_START_TIME = process.env.NEXT_PRIVATE_START_TIME || Date.now().toString();

const port = Number.parseInt(process.env.PORT || "3014", 10);
const hostname = process.env.HOSTNAME || "0.0.0.0";

async function main() {
  const { startServer } = await import("next/dist/server/lib/start-server.js");
  await startServer({
    dir: process.cwd(),
    isDev: false,
    hostname,
    port,
  });
  await new Promise(() => {});
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
