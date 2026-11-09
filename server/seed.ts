import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { hashPassword } from "./password";
import { initialNews } from "./news";
import { createSupabaseAdminClient } from "./supabase-client";
import { toJson } from "./supabase-json";

const root = fileURLToPath(new URL("../", import.meta.url));
try {
  process.loadEnvFile?.(path.join(root, ".env"));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

const supabase = createSupabaseAdminClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_SECRET_KEY || "",
);
const { error: schemaError } = await supabase
  .from("users")
  .select("id")
  .limit(1);
if (schemaError)
  throw new Error(
    `Supabase schema is not ready. Run database/schema.sql in the Supabase SQL Editor first: ${schemaError.message}`,
  );

for (const article of initialNews) {
  const { error } = await supabase.from("news").upsert(
    {
      id: article.id,
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      image_url: article.image,
      category: article.category,
      content: toJson(article.content),
      published_at: article.publicationDate,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(`Could not seed news: ${error.message}`);
}

const seedValues = [
  process.env.SEED_CORPORATE_ID,
  process.env.SEED_USER_ID,
  process.env.SEED_EMAIL,
  process.env.SEED_PASSWORD,
];
if (seedValues.some(Boolean)) {
  const [corporateId, userId, email, password] = seedValues;
  if (!corporateId || !userId || !email || !password)
    throw new Error(
      "Set all SEED_CORPORATE_ID, SEED_USER_ID, SEED_EMAIL, and SEED_PASSWORD values to create the initial application account.",
    );
  if (!corporateId.startsWith("NUSA-") || password.length < 12)
    throw new Error(
      "Use an application-owned NUSA- Corporate ID and a seed password of at least 12 characters.",
    );
  const { error } = await supabase.from("users").upsert(
    {
      id: randomUUID(),
      corporate_id: corporateId,
      user_id: userId,
      name: process.env.SEED_NAME || "Administrator",
      email: email.trim().toLowerCase(),
      password_hash: await hashPassword(password),
      role: "admin",
    },
    { onConflict: "corporate_id,user_id", ignoreDuplicates: true },
  );
  if (error)
    throw new Error(`Could not seed application account: ${error.message}`);
}

console.log(
  "Supabase seed data installed. Account credentials are never printed.",
);
