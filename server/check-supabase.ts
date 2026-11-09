import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSupabaseAdminClient } from "./supabase-client";

const root = fileURLToPath(new URL("../", import.meta.url));
try {
  process.loadEnvFile(path.join(root, ".env"));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

async function check() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SECRET_KEY || "";
  const client = createSupabaseAdminClient(url, key);
  const tables = [
    [
      "users",
      "id,corporate_id,user_id,name,email,password_hash,role,created_at,updated_at",
    ],
    ["applications", "id,owner_id,kind,reference_number"],
    [
      "corporate_registrations",
      "id,owner_id,reference_number,details,status,updated_at",
    ],
    [
      "giro_registrations",
      "id,owner_id,reference_number,details,status,updated_at",
    ],
    ["tracking_events", "id,application_id,status,description,created_at"],
    ["news", "id,title,slug,summary,image_url,category,content,published_at"],
    ["recovery_requests", "id,user_id,created_at"],
    ["sessions", "sid,sess,expire"],
  ] as const;
  const results = await Promise.all(
    tables.map(async ([table, columns]) => {
      // GET with limit zero validates the schema without reading stored records.
      const { error, status } = await client
        .from(table)
        .select(columns)
        .limit(0)
        .abortSignal(AbortSignal.timeout(10_000));
      return { table, error, status };
    }),
  );
  let failed = false;
  for (const { table, error, status } of results) {
    if (error || status >= 400) {
      failed = true;
      const message = error?.message || `HTTP ${status}`;
      console.error(`FAIL ${table}: ${message.replaceAll(key, "[redacted]")}`);
    } else {
      console.log(`OK ${table}`);
    }
  }
  if (failed)
    throw new Error(
      "Supabase schema is not ready. Run database/schema.sql in the Supabase SQL Editor, then retry.",
    );

  const response = await fetch(
    new URL("rest/v1/", `${url.replace(/\/$/, "")}/`),
    {
      headers: { apikey: key, Accept: "application/openapi+json" },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok)
    throw new Error(
      `Could not inspect Supabase RPCs: HTTP ${response.status}.`,
    );
  const schema = (await response.json()) as {
    paths?: Record<string, unknown>;
  };
  if (!schema.paths?.["/rpc/create_application"])
    throw new Error(
      "Supabase RPC create_application is unavailable. Run database/schema.sql in the Supabase SQL Editor, then retry.",
    );
  console.log("OK create_application RPC (schema inspection only)");
  console.log(
    "Supabase connection and application schema are ready. No data was changed.",
  );
}

try {
  await check();
} catch (error) {
  const message =
    error instanceof Error ? error.message : "Supabase check failed.";
  const key = process.env.SUPABASE_SECRET_KEY;
  console.error(key ? message.replaceAll(key, "[redacted]") : message);
  process.exitCode = 1;
}
