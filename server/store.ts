import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Application, News, StoredUser } from "../shared/models";
import { initialNews } from "./news";
import { hashPassword } from "./password";
import type { Json } from "./supabase-json";
import { toJson } from "./supabase-json";
import type { Database } from "./supabase-types";
export interface RecoveryRequest {
  id: string;
  userId: string | null;
  createdAt: string;
}
export interface Store {
  findUser: (
    corporateId: string,
    userId: string,
  ) => Promise<StoredUser | undefined>;
  userById: (id: string) => Promise<StoredUser | undefined>;
  userByEmail: (email: string) => Promise<StoredUser | undefined>;
  saveApplication: (record: Application) => Promise<void>;
  applications: (ownerId: string) => Promise<Application[]>;
  application: (
    ownerId: string,
    reference: string,
  ) => Promise<Application | undefined>;
  news: () => Promise<News[]>;
  recovery: (record: RecoveryRequest) => Promise<void>;
  close: () => Promise<void>;
}
interface LocalData {
  users: StoredUser[];
  applications: Application[];
  news: News[];
  recoveryRequests: RecoveryRequest[];
}
export class LocalPrototypeStore implements Store {
  private pending = Promise.resolve();
  private constructor(
    private data: LocalData,
    private file?: string,
  ) {}
  static async create(file?: string) {
    let data: LocalData;
    try {
      if (!file) throw Object.assign(new Error("Memory"), { code: "ENOENT" });
      data = JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        throw new Error(
          "Local data cannot be read. Restore a valid backup before starting.",
        );
      const now = new Date().toISOString();
      data = {
        users: [
          {
            id: "jarwo",
            corporateId: "JarwoCorp",
            userId: "jarwo",
            name: "Jarwo",
            email: "jarwo@gmail.com",
            role: "user",
            passwordHash: await hashPassword("jarwo123!"),
            createdAt: now,
            updatedAt: now,
          },
        ],
        applications: [],
        news: initialNews,
        recoveryRequests: [],
      };
    }
    // News is seed content with no write path in the local prototype; always
    // serve the current seed so updated articles/images are not hidden by an
    // older data file.
    data.news = initialNews;
    const store = new LocalPrototypeStore(data, file);
    await store.persist();
    return store;
  }
  private persist() {
    const save = this.pending.then(async () => {
      if (!this.file) return;
      await mkdir(path.dirname(this.file), { recursive: true });
      const temporary = `${this.file}.${randomUUID()}.tmp`;
      await writeFile(temporary, JSON.stringify(this.data, null, 2), {
        encoding: "utf8",
        mode: 0o600,
      });
      await rename(temporary, this.file);
    });
    this.pending = save.catch(() => {});
    return save;
  }
  async findUser(corporateId: string, userId: string) {
    return this.data.users.find(
      (u) => u.corporateId === corporateId && u.userId === userId,
    );
  }
  async userById(id: string) {
    return this.data.users.find((u) => u.id === id);
  }
  async userByEmail(email: string) {
    return this.data.users.find((u) => u.email === email);
  }
  async saveApplication(record: Application) {
    this.data.applications.push(record);
    try {
      await this.persist();
    } catch (e) {
      this.data.applications = this.data.applications.filter(
        (a) => a.id !== record.id,
      );
      throw e;
    }
  }
  async applications(ownerId: string) {
    return this.data.applications
      .filter((a) => a.ownerId === ownerId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  async application(ownerId: string, reference: string) {
    return this.data.applications.find(
      (a) =>
        a.ownerId === ownerId &&
        (a.referenceNumber === reference || a.id === reference),
    );
  }
  async news() {
    return [...this.data.news].sort((a, b) =>
      a.publicationDate.localeCompare(b.publicationDate),
    );
  }
  async recovery(record: RecoveryRequest) {
    this.data.recoveryRequests.push(record);
    try {
      await this.persist();
    } catch (e) {
      this.data.recoveryRequests = this.data.recoveryRequests.filter(
        (r) => r.id !== record.id,
      );
      throw e;
    }
  }
  async close() {
    await this.pending;
  }
}
type UserRow = Database["public"]["Tables"]["users"]["Row"];

function mapUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    corporateId: row.corporate_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    passwordHash: row.password_hash,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}
type RegistrationRow = {
  details: Json;
  status: Application["status"];
  updated_at: string;
};

type TrackingRow = {
  id: string;
  application_id: string;
  status: Application["status"];
  description: string;
  created_at: string;
};

function objectValue(value: Json): { [key: string]: Json } {
  if (value === null || Array.isArray(value) || typeof value !== "object")
    throw new Error("Supabase returned malformed application details.");
  return value;
}

function requiredString(value: { [key: string]: Json }, key: string): string {
  const field = value[key];
  if (typeof field !== "string")
    throw new Error(`Supabase returned invalid application field: ${key}.`);
  return field;
}

function optionalString(value: { [key: string]: Json }, key: string) {
  const field = value[key];
  if (field === undefined || field === null) return undefined;
  if (typeof field !== "string")
    throw new Error(`Supabase returned invalid application field: ${key}.`);
  return field;
}

function mapApplication(
  row: RegistrationRow,
  events: TrackingRow[],
): Application {
  const details = objectValue(row.details);
  const kind = requiredString(details, "kind");
  if (kind !== "corporate" && kind !== "giro")
    throw new Error("Supabase returned an invalid application kind.");
  return {
    id: requiredString(details, "id"),
    ownerId: requiredString(details, "ownerId"),
    kind,
    referenceNumber: requiredString(details, "referenceNumber"),
    companyName: requiredString(details, "companyName"),
    businessType: requiredString(details, "businessType"),
    contactEmail: requiredString(details, "contactEmail"),
    contactName: requiredString(details, "contactName"),
    phone: requiredString(details, "phone"),
    address: optionalString(details, "address"),
    city: requiredString(details, "city"),
    province: optionalString(details, "province"),
    productType: optionalString(details, "productType"),
    status: row.status,
    createdAt: requiredString(details, "createdAt"),
    updatedAt: new Date(row.updated_at).toISOString(),
    events: events.map((event) => ({
      id: event.id,
      status: event.status,
      description: event.description,
      createdAt: new Date(event.created_at).toISOString(),
    })),
  };
}

export class SupabaseStore implements Store {
  constructor(public client: SupabaseClient<Database>) {}

  async checkConnection() {
    const { error } = await this.client.from("users").select("id").limit(1);
    if (error) throw new Error(`Supabase connection failed: ${error.message}`);
  }

  async findUser(corporateId: string, userId: string) {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("corporate_id", corporateId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(`Supabase user lookup failed: ${error.message}`);
    return data ? mapUser(data) : undefined;
  }

  async userById(id: string) {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Supabase user lookup failed: ${error.message}`);
    return data ? mapUser(data) : undefined;
  }

  async userByEmail(email: string) {
    const { data, error } = await this.client
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();
    if (error) throw new Error(`Supabase user lookup failed: ${error.message}`);
    return data ? mapUser(data) : undefined;
  }

  async saveApplication(record: Application) {
    const { error } = await this.client.rpc("create_application", {
      p_record: toJson(record),
    });
    if (error)
      throw new Error(
        `Supabase could not save the application: ${error.message}`,
      );
  }

  private async hydrate(rows: RegistrationRow[]) {
    const ids = rows.map((row) =>
      requiredString(objectValue(row.details), "id"),
    );
    if (ids.length === 0) return [];
    const { data, error } = await this.client
      .from("tracking_events")
      .select("id,application_id,status,description,created_at")
      .in("application_id", ids)
      .order("created_at", { ascending: true });
    if (error)
      throw new Error(
        `Supabase could not load tracking events: ${error.message}`,
      );
    const eventsByApplication = new Map<string, TrackingRow[]>();
    for (const event of data) {
      const events = eventsByApplication.get(event.application_id) ?? [];
      events.push(event);
      eventsByApplication.set(event.application_id, events);
    }
    return rows.map((row) =>
      mapApplication(
        row,
        eventsByApplication.get(
          requiredString(objectValue(row.details), "id"),
        ) ?? [],
      ),
    );
  }

  async applications(ownerId: string) {
    const [corporate, giro] = await Promise.all([
      this.client
        .from("corporate_registrations")
        .select("details,status,updated_at")
        .eq("owner_id", ownerId),
      this.client
        .from("giro_registrations")
        .select("details,status,updated_at")
        .eq("owner_id", ownerId),
    ]);
    if (corporate.error || giro.error)
      throw new Error(
        `Supabase could not load applications: ${corporate.error?.message ?? giro.error?.message}`,
      );
    const rows = [...corporate.data, ...giro.data].sort((a, b) =>
      b.updated_at.localeCompare(a.updated_at),
    );
    return this.hydrate(rows);
  }

  async application(ownerId: string, reference: string) {
    const isId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        reference,
      );
    const [corporate, giro] = await Promise.all([
      (isId
        ? this.client
            .from("corporate_registrations")
            .select("details,status,updated_at")
            .eq("id", reference)
        : this.client
            .from("corporate_registrations")
            .select("details,status,updated_at")
            .eq("reference_number", reference)
      )
        .eq("owner_id", ownerId)
        .limit(1),
      (isId
        ? this.client
            .from("giro_registrations")
            .select("details,status,updated_at")
            .eq("id", reference)
        : this.client
            .from("giro_registrations")
            .select("details,status,updated_at")
            .eq("reference_number", reference)
      )
        .eq("owner_id", ownerId)
        .limit(1),
    ]);
    if (corporate.error || giro.error)
      throw new Error(
        `Supabase could not load application: ${corporate.error?.message ?? giro.error?.message}`,
      );
    const row = corporate.data[0] ?? giro.data[0];
    if (!row) return undefined;
    const [application] = await this.hydrate([row]);
    return application;
  }

  async news() {
    const { data, error } = await this.client
      .from("news")
      .select("id,title,slug,summary,image_url,category,content,published_at")
      .lte("published_at", new Date().toISOString())
      .order("published_at", { ascending: true });
    if (error)
      throw new Error(`Supabase could not load news: ${error.message}`);
    return data.map((row): News => {
      if (
        !Array.isArray(row.content) ||
        !row.content.every((paragraph) => typeof paragraph === "string")
      )
        throw new Error(`Supabase returned invalid news content: ${row.id}.`);
      return {
        id: row.id,
        title: row.title,
        slug: row.slug,
        summary: row.summary,
        image: row.image_url,
        category: row.category,
        publicationDate: new Date(row.published_at).toISOString(),
        content: row.content,
      };
    });
  }

  async recovery(record: RecoveryRequest) {
    const { error } = await this.client.from("recovery_requests").insert({
      id: record.id,
      user_id: record.userId,
      created_at: record.createdAt,
    });
    if (error)
      throw new Error(
        `Supabase could not save recovery request: ${error.message}`,
      );
  }

  async close() {
    return;
  }
}
