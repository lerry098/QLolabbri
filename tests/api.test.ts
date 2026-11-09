import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createApp, SESSION_MS } from "../server/app";
import { LocalPrototypeStore } from "../server/store";
import { hashPassword, verifyPassword } from "../server/password";
import { corporate } from "./fixtures";
let store: LocalPrototypeStore;
let app: Awaited<ReturnType<typeof createApp>>["app"];
let agent: ReturnType<typeof request.agent>;
let token = "";
let reference = "";
let directory = "";
beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "nusa-test-"));
  store = await LocalPrototypeStore.create(path.join(directory, "data.json"));
  app = (
    await createApp({
      store,
      sessionSecret: "test-secret-at-least-32-characters-long",
      origin: "http://localhost",
      test: true,
    })
  ).app;
  agent = request.agent(app);
  token = (await agent.get("/api/auth/csrf")).body.token;
});
afterAll(async () => {
  await store.close();
  if (
    !directory ||
    !path.resolve(directory).startsWith(path.join(tmpdir(), "nusa-test-"))
  )
    throw new Error("Unexpected test cleanup directory");
  await rm(directory, { recursive: true, force: true });
});
describe("Application API and security", () => {
  it("serves original news without authentication", async () => {
    const response = await agent.get("/api/news").expect(200);
    expect(response.body).toHaveLength(4);
    await agent.get(`/api/news/${response.body[0].slug}`).expect(200);
    await agent.get("/api/news/missing").expect(404);
  });
  it("blocks unauthenticated private lookups", async () => {
    await agent.get("/api/dashboard/overview").expect(401);
    await agent.get("/api/tracking/NUSA-COR-1234ABCD5678").expect(401);
  });
  it("requires CSRF protection and rejects cross-origin login", async () => {
    await agent.post("/api/auth/login").send({}).expect(403);
    await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", token)
      .set("Origin", "https://untrusted.example")
      .send({})
      .expect(403);
  });
  it("validates credentials on the backend and gives generic failure", async () => {
    await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", token)
      .send({})
      .expect(400);
    const result = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", token)
      .send({
        corporateId: "JarwoCorp",
        userId: "jarwo",
        password: "incorrect-password",
      })
      .expect(401);
    expect(result.body.message).toMatch(/tidak sesuai/);
  });
  it("creates an HttpOnly session and rotates CSRF on login", async () => {
    const response = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", token)
      .send({
        corporateId: "JarwoCorp",
        userId: "jarwo",
        password: "jarwo123!",
      })
      .expect(200);
    expect(response.headers["set-cookie"][0]).toMatch(/HttpOnly/);
    expect(response.headers["set-cookie"][0]).toMatch(/SameSite=Strict/);
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.csrfToken).not.toBe(token);
    token = response.body.csrfToken;
    await agent.get("/api/dashboard/overview").expect(200);
  });
  it("rejects invalid applications and generates a real persisted reference", async () => {
    await agent
      .post("/api/registrations/corporate")
      .set("X-CSRF-Token", token)
      .send({ ...corporate, agreement: false })
      .expect(400);
    const response = await agent
      .post("/api/registrations/corporate")
      .set("X-CSRF-Token", token)
      .send(corporate)
      .expect(201);
    reference = response.body.referenceNumber;
    expect(reference).toMatch(/^IND-COR-[0-9A-F]{12}$/);
    expect(response.body.events).toHaveLength(1);
    await agent.get(`/api/tracking/${reference}`).expect(200);
    const reopened = await LocalPrototypeStore.create(
      path.join(directory, "data.json"),
    );
    expect(
      (await reopened.application("jarwo", reference))?.companyName,
    ).toBe(corporate.companyName);
    await reopened.close();
  });
  it("persists giro separately and prevents product-type lookup confusion", async () => {
    const response = await agent
      .post("/api/registrations/giro")
      .set("X-CSRF-Token", token)
      .send({ ...corporate, productType: "Giro Rupiah" })
      .expect(201);
    expect(response.body.referenceNumber).toMatch(/^IND-GIR-/);
    await agent
      .get(`/api/registrations/giro/${response.body.referenceNumber}`)
      .expect(200);
    await agent.get(`/api/registrations/giro/${reference}`).expect(404);
  });
  it("hides another owner’s record, returns missing state, validates reference", async () => {
    const other = {
      ...(await store.application("jarwo", reference))!,
      id: randomUUID(),
      ownerId: "someone-else",
      referenceNumber: "NUSA-COR-FFFFFFFFFFFF",
    };
    await store.saveApplication(other);
    await agent.get(`/api/tracking/${other.referenceNumber}`).expect(404);
    await agent.get("/api/tracking/NUSA-COR-000000000000").expect(404);
    await agent.get("/api/tracking/not-valid").expect(400);
    const overview = await agent.get("/api/dashboard/overview");
    expect(overview.body.applications).toHaveLength(2);
  });
  it("stores generic recovery requests without disclosing account existence", async () => {
    const known = await agent
      .post("/api/auth/forgot-password")
      .set("X-CSRF-Token", token)
      .send({ email: "abangmedan0807@gmail.com" })
      .expect(200);
    const unknown = await agent
      .post("/api/auth/forgot-password")
      .set("X-CSRF-Token", token)
      .send({ email: "nobody@example.test" })
      .expect(200);
    expect(known.body).toEqual(unknown.body);
  });
  it("terminates the session on logout", async () => {
    await agent.post("/api/auth/logout").set("X-CSRF-Token", token).expect(200);
    await agent.get("/api/dashboard/overview").expect(401);
    expect((await agent.get("/api/auth/me")).body.user).toBeNull();
  });
  it("handles malformed JSON without exposing server errors", async () => {
    const response = await agent
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{bad")
      .expect(400);
    expect(response.body.message).toBe("Format permintaan tidak valid.");
    expect(response.body.stack).toBeUndefined();
  });
  it("stores salted hashes and verifies passwords", async () => {
    const hash = await hashPassword("ExamplePassword!");
    expect(hash).not.toContain("ExamplePassword!");
    expect(await verifyPassword("ExamplePassword!", hash)).toBe(true);
    expect(await verifyPassword("incorrect", hash)).toBe(false);
  });
  it("expires authenticated sessions after the absolute session lifetime", async () => {
    const client = request.agent(app);
    const initial = (await client.get("/api/auth/csrf")).body.token;
    await client
      .post("/api/auth/login")
      .set("X-CSRF-Token", initial)
      .send({
        corporateId: "JarwoCorp",
        userId: "jarwo",
        password: "jarwo123!",
      })
      .expect(200);
    const future = Date.now() + SESSION_MS + 1000;
    const clock = vi.spyOn(Date, "now").mockReturnValue(future);
    try {
      await client.get("/api/dashboard/overview").expect(401);
      expect((await client.get("/api/auth/me")).body.user).toBeNull();
    } finally {
      clock.mockRestore();
    }
  });
  it("enforces the actual login attempt limit", async () => {
    const limited = (
      await createApp({
        store,
        sessionSecret: "another-test-secret-at-least-32-characters",
        origin: "http://localhost",
      })
    ).app;
    const client = request.agent(limited);
    const initial = (await client.get("/api/auth/csrf")).body.token;
    for (let attempt = 0; attempt < 10; attempt++)
      await client
        .post("/api/auth/login")
        .set("X-CSRF-Token", initial)
        .send({
          corporateId: "JarwoCorp",
          userId: "jarwo",
          password: "WrongPassword!",
        })
        .expect(401);
    const response = await client
      .post("/api/auth/login")
      .set("X-CSRF-Token", initial)
      .send({
        corporateId: "JarwoCorp",
        userId: "jarwo",
        password: "WrongPassword!",
      })
      .expect(429);
    expect(response.body.message).toContain("Terlalu banyak percobaan");
  });
});
