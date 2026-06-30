import { describe, expect, test } from "bun:test";
import { POST } from "../src/app/api/panel/onboarding-invites/route";
import {
  buildOnboardingInvitePreview,
  DEFAULT_ONBOARDING_INVITE_FORM,
  type OnboardingInviteAuditPayload,
} from "../src/lib/onboarding/invite-preview";

const createdAt = "2026-06-12T18:00:00Z";

function payload(): OnboardingInviteAuditPayload {
  return buildOnboardingInvitePreview(DEFAULT_ONBOARDING_INVITE_FORM, { createdAt }).auditPayload;
}

function request(body: unknown): Request {
  return new Request("https://getpatronpro.com/api/panel/onboarding-invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function withDatabaseEnv<T>(postgresUrl: string | undefined, databaseUrl: string | undefined, fn: () => Promise<T>): Promise<T> {
  const originalPostgresUrl = process.env.POSTGRES_URL;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  if (postgresUrl === undefined) delete process.env.POSTGRES_URL;
  else process.env.POSTGRES_URL = postgresUrl;
  if (databaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = databaseUrl;

  try {
    return await fn();
  } finally {
    if (originalPostgresUrl === undefined) delete process.env.POSTGRES_URL;
    else process.env.POSTGRES_URL = originalPostgresUrl;
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  }
}

describe("POST /api/panel/onboarding-invites", () => {
  test("api returns dry-run-no-database when database env is unset", async () => {
    await withDatabaseEnv(undefined, undefined, async () => {
      const response = await POST(request(payload()));
      const json = await response.json();
      expect(response.status).toBe(200);
      expect(json).toMatchObject({
        ok: true,
        mode: "dry-run",
        persisted: "dry-run-no-database",
        sent: false,
        ghlMutation: false,
      });
    });
  });

  test("api returns dry-run-adapter-deferred when database env is set", async () => {
    await withDatabaseEnv("postgres://example.invalid/patronpro", undefined, async () => {
      const response = await POST(request(payload()));
      const json = await response.json();
      expect(response.status).toBe(200);
      expect(json.persisted).toBe("dry-run-adapter-deferred");
      expect(json.sent).toBe(false);
      expect(json.ghlMutation).toBe(false);
    });
  });

  test("api rejects non dry-run mode", async () => {
    const body = { ...payload(), mode: "live" };
    const response = await POST(request(body));
    const json = await response.json();
    expect(response.status).toBe(400);
    expect(json.code).toBe("live_mode_rejected");
  });

  test("api rejects sent or ghlMutation true", async () => {
    const sentBody = {
      ...payload(),
      status: {
        ...payload().status,
        sent: true,
      },
    };
    const mutationBody = {
      ...payload(),
      status: {
        ...payload().status,
        ghlMutation: true,
      },
    };

    const sentResponse = await POST(request(sentBody));
    const mutationResponse = await POST(request(mutationBody));
    expect(sentResponse.status).toBe(400);
    expect((await sentResponse.json()).code).toBe("sent_rejected");
    expect(mutationResponse.status).toBe(400);
    expect((await mutationResponse.json()).code).toBe("ghl_mutation_rejected");
  });
});
