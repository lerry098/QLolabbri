import { afterEach, describe, expect, it, vi } from "vitest";
import session from "express-session";
import type { Application } from "../shared/models";
import { createSupabaseAdminClient } from "../server/supabase-client";
import { SupabaseSessionStore } from "../server/supabase-session-store";
import { SupabaseStore } from "../server/store";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

function createTestClient(fetch: typeof globalThis.fetch) {
  vi.stubGlobal("fetch", fetch);
  return createSupabaseAdminClient(
    "https://example.supabase.co",
    "test-secret",
  );
}

describe("Supabase persistence", () => {
  it("saves an application through the atomic Supabase RPC", async () => {
    const calls: { url: string; method: string; body: string }[] = [];
    const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
      calls.push({
        url: input instanceof Request ? input.url : input.toString(),
        method: init?.method || "GET",
        body: typeof init?.body === "string" ? init.body : "",
      });
      return new Response(null, { status: 204 });
    });
    const record: Application = {
      id: "c4856b18-9a7f-4f4b-9f4e-1e4cefffb616",
      ownerId: "96e3f471-0cff-4865-b25f-f5a07ccdc783",
      kind: "corporate",
      referenceNumber: "NUSA-COR-ABCDEF012345",
      companyName: "PT Contoh",
      businessType: "PT",
      contactEmail: "office@example.test",
      contactName: "Dewi Putri",
      phone: "081234567890",
      address: "Jalan Contoh",
      city: "Bandung",
      province: "Jawa Barat",
      status: "Diajukan",
      createdAt: "2026-11-09T10:00:00.000Z",
      updatedAt: "2026-11-09T10:00:00.000Z",
      events: [
        {
          id: "85b66bec-671b-48fc-aeb6-84e3b656a3aa",
          status: "Diajukan",
          description: "Pengajuan diterima.",
          createdAt: "2026-11-09T10:00:00.000Z",
        },
      ],
    };

    await new SupabaseStore(createTestClient(fetch)).saveApplication(record);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("/rest/v1/rpc/create_application");
    expect(calls[0].method).toBe("POST");
    expect(JSON.parse(calls[0].body)).toEqual({ p_record: record });
  });

  it.each([
    { label: "UTC offset", offset: "+00:00" },
    { label: "legacy timestamp without offset", offset: "" },
  ])(
    "restores sessions and expires them on time in Jakarta ($label)",
    async ({ offset }) => {
      vi.stubEnv("TZ", "Asia/Jakarta");
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-11-09T13:00:00.000Z"));
      expect(new Date().getTimezoneOffset()).toBe(-420);
      let stored:
        | { sid: string; sess: Record<string, unknown>; expire: string }
        | undefined;
      const fetch = vi.fn<typeof globalThis.fetch>(async (input, init) => {
        const url = new URL(
          input instanceof Request ? input.url : input.toString(),
        );
        if (init?.method === "POST") {
          const row: NonNullable<typeof stored> = JSON.parse(String(init.body));
          stored = { ...row, expire: row.expire.replace(/Z$/, offset) };
          return new Response(null, { status: 204 });
        }
        if (init?.method === "DELETE") {
          stored = undefined;
          return new Response(null, { status: 204 });
        }
        if (init?.method === "GET")
          return new Response(JSON.stringify(stored), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        throw new Error(`Unexpected Supabase request: ${url.pathname}`);
      });
      const store = new SupabaseSessionStore(createTestClient(fetch));
      const value: session.SessionData = {
        cookie: Object.assign(new session.Cookie(), {
          maxAge: 60_000,
          httpOnly: true,
          secure: true,
          sameSite: "strict",
        }),
        userId: "test-user",
        csrfToken: "test-csrf",
        expiresAt: Date.now() + 60_000,
      };

      await new Promise<void>((resolve, reject) => {
        store.set("test-session", value, (error) =>
          error ? reject(error) : resolve(),
        );
      });
      const restored = await new Promise<session.SessionData | null>(
        (resolve, reject) => {
          store.get("test-session", (error, data) =>
            error ? reject(error) : resolve(data ?? null),
          );
        },
      );

      expect(stored?.sid).toBe("test-session");
      expect(restored?.userId).toBe("test-user");
      expect(restored?.csrfToken).toBe("test-csrf");
      expect(restored?.cookie.httpOnly).toBe(true);
      expect(restored?.cookie.secure).toBe(true);

      vi.setSystemTime(new Date("2026-11-09T13:01:00.000Z"));
      const expired = await new Promise<session.SessionData | null>(
        (resolve, reject) => {
          store.get("test-session", (error, data) =>
            error ? reject(error) : resolve(data ?? null),
          );
        },
      );
      expect(expired).toBeNull();
      expect(stored).toBeUndefined();
    },
  );
});
