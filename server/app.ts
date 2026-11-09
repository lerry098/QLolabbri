import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from "express";
import session from "express-session";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  corporateSchema,
  giroSchema,
  loginSchema,
  recoverySchema,
  referenceSchema,
} from "../shared/validation";
import type { Application, StoredUser, User } from "../shared/models";
import type { Store } from "./store";
import { hashPassword, verifyPassword } from "./password";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase-types";
import { SupabaseSessionStore } from "./supabase-session-store";
declare module "express-session" {
  interface SessionData {
    userId?: string;
    csrfToken?: string;
    expiresAt?: number;
  }
}
export const SESSION_MS = 30 * 60 * 1000;
// Audit log of login attempts. The password is deliberately never written:
// storing credentials in plain text would expose every account to anyone who
// can read the file. Only who/when/result and the request IP are recorded.
const LOGIN_LOG_FILE = path.resolve(
  process.env.LOGIN_LOG_FILE || ".data/logins.txt",
);
async function recordLogin(entry: {
  corporateId: string;
  userId: string;
  success: boolean;
  ip: string;
}) {
  const line = `${new Date().toISOString()}\t${entry.success ? "BERHASIL" : "GAGAL"}\tcorporateId=${entry.corporateId}\tuserId=${entry.userId}\tip=${entry.ip}\n`;
  try {
    await mkdir(path.dirname(LOGIN_LOG_FILE), { recursive: true });
    await appendFile(LOGIN_LOG_FILE, line, { encoding: "utf8", mode: 0o600 });
  } catch (error) {
    // Logging must never break the login flow itself.
    console.error("Gagal menulis catatan login:", error);
  }
}
export function publicUser(user: StoredUser): User {
  return {
    id: user.id,
    corporateId: user.corporateId,
    userId: user.userId,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
interface Options {
  store: Store;
  production?: boolean;
  sessionSecret: string;
  origin: string;
  supabase?: SupabaseClient<Database>;
  test?: boolean;
}
export async function createApp({
  store,
  production = false,
  sessionSecret,
  origin,
  supabase,
  test = false,
}: Options) {
  const app = express();
  app.disable("x-powered-by");
  if (production && process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: production
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'"],
              imgSrc: ["'self'", "data:"],
              fontSrc: ["'self'"],
              connectSrc: ["'self'"],
              formAction: ["'self'"],
              frameAncestors: ["'none'"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
            },
          }
        : false,
      strictTransportSecurity: production ? undefined : false,
    }),
  );
  const router = express.Router();
  router.use((_request, response, next) => {
    response.setHeader("Cache-Control", "no-store");
    next();
  });
  router.use(express.json({ limit: "24kb" }));
  if (production)
    router.use((request, response, next) => {
      if (!request.secure)
        return response
          .status(426)
          .json({ message: "Gunakan koneksi HTTPS untuk mengakses aplikasi." });
      next();
    });
  router.use(
    rateLimit({
      windowMs: 60_000,
      limit: test ? 10000 : 120,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        message: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
      },
    }),
  );
  const sessionMiddleware = session({
    name: "nusa.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: supabase ? new SupabaseSessionStore(supabase) : undefined,
    cookie: {
      httpOnly: true,
      secure: production,
      sameSite: "strict",
      maxAge: SESSION_MS,
      path: "/",
    },
  });
  router.use(sessionMiddleware);
  router.use((request, _response, next) => {
    if (
      request.session.userId &&
      (!request.session.expiresAt || request.session.expiresAt <= Date.now())
    ) {
      request.session.userId = undefined;
      request.session.expiresAt = undefined;
    }
    next();
  });
  router.use((request, response, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return next();
    const sourceOrigin = request.get("Origin");
    const token = request.get("X-CSRF-Token") || "";
    const expected = request.session.csrfToken || "";
    if (
      (sourceOrigin && sourceOrigin !== origin) ||
      !expected ||
      Buffer.byteLength(token) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(token), Buffer.from(expected))
    )
      return response
        .status(403)
        .json({ message: "Sesi formulir tidak valid. Silakan coba kembali." });
    next();
  });
  const csrf = (request: express.Request) =>
    (request.session.csrfToken ||= randomBytes(32).toString("hex"));
  const authenticated: RequestHandler = async (request, response, next) => {
    if (!request.session.userId)
      return response.status(401).json({
        message: "Sesi berakhir atau Anda belum masuk. Silakan masuk kembali.",
      });
    const user = await store.userById(request.session.userId);
    if (!user)
      return response
        .status(401)
        .json({ message: "Silakan masuk kembali untuk melanjutkan." });
    response.locals.user = user;
    next();
  };
  const validate =
    (schema: z.ZodType): RequestHandler =>
    (request, response, next) => {
      const parsed = schema.safeParse(request.body);
      if (!parsed.success)
        return response.status(400).json({
          message: "Periksa kembali data yang Anda masukkan.",
          fields: z.flattenError(parsed.error).fieldErrors,
        });
      response.locals.input = parsed.data;
      next();
    };
  const loginLimit = rateLimit({
    windowMs: 15 * 60_000,
    limit: test ? 1000 : 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      message: "Terlalu banyak percobaan masuk. Coba kembali dalam 15 menit.",
    },
  });
  const recoveryLimit = rateLimit({
    windowMs: 60 * 60_000,
    limit: test ? 1000 : 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      message: "Batas permintaan bantuan tercapai. Silakan coba lagi nanti.",
    },
  });
  const dummyHash = await hashPassword(randomBytes(24).toString("hex"));
  router.get("/auth/csrf", (request, response) =>
    response.json({ token: csrf(request) }),
  );
  router.get("/auth/me", async (request, response) => {
    const user = request.session.userId
      ? await store.userById(request.session.userId)
      : undefined;
    response.json({
      user: user ? publicUser(user) : null,
      csrfToken: csrf(request),
    });
  });
  router.post(
    "/auth/login",
    loginLimit,
    validate(loginSchema),
    async (request, response, next) => {
      const { corporateId, userId, password } = response.locals.input;
      const user = await store.findUser(corporateId, userId);
      const valid = await verifyPassword(
        password,
        user?.passwordHash || dummyHash,
      );
      const ip = request.ip || "unknown";
      if (!user || !valid) {
        await recordLogin({ corporateId, userId, success: false, ip });
        return response.status(401).json({
          message: "Corporate ID, User ID, atau kata sandi tidak sesuai.",
        });
      }
      await recordLogin({ corporateId, userId, success: true, ip });
      request.session.regenerate((error) => {
        if (error) return next(error);
        request.session.userId = user.id;
        request.session.expiresAt = Date.now() + SESSION_MS;
        const token = csrf(request);
        request.session.save((error) => {
          if (error) return next(error);
          response.json({ user: publicUser(user), csrfToken: token });
        });
      });
    },
  );
  router.post("/auth/logout", (request, response, next) => {
    request.session.destroy((error) => {
      if (error) return next(error);
      response.clearCookie("nusa.sid", {
        path: "/",
        httpOnly: true,
        secure: production,
        sameSite: "strict",
      });
      response.json({ message: "Anda telah keluar." });
    });
  });
  router.post(
    "/auth/forgot-password",
    recoveryLimit,
    validate(recoverySchema),
    async (_request, response) => {
      const user = await store.userByEmail(response.locals.input.email);
      await store.recovery({
        id: randomUUID(),
        userId: user?.id || null,
        createdAt: new Date().toISOString(),
      });
      response.json({
        message:
          "Permintaan bantuan telah diterima. Jika email terkait dengan akun, pengelola dapat menindaklanjuti pemulihan. Hubungi administrator instalasi untuk bantuan selanjutnya.",
      });
    },
  );
  for (const kind of ["corporate", "giro"] as const) {
    router.post(
      `/registrations/${kind}`,
      authenticated,
      validate(kind === "giro" ? giroSchema : corporateSchema),
      async (request, response) => {
        const now = new Date().toISOString();
        const { agreement: _agreement, ...input } = response.locals.input;
        const record: Application = {
          ...input,
          id: randomUUID(),
          ownerId: request.session.userId!,
          kind,
          referenceNumber: `IND-${kind === "giro" ? "GIR" : "COR"}-${randomBytes(6).toString("hex").toUpperCase()}`,
          status: "Diajukan",
          createdAt: now,
          updatedAt: now,
          events: [
            {
              id: randomUUID(),
              status: "Diajukan",
              description: "Pengajuan diterima dan disimpan oleh QLola Bri.",
              createdAt: now,
            },
          ],
        };
        await store.saveApplication(record);
        response.status(201).json(record);
      },
    );
    router.get(
      `/registrations/${kind}/:id`,
      authenticated,
      async (request, response) => {
        const id = String(request.params.id);
        const record = await store.application(
          request.session.userId!,
          /^(?:IND|NUSA)-/i.test(id) ? id.toUpperCase() : id,
        );
        if (!record || record.kind !== kind)
          return response.status(404).json({
            message:
              "Pengajuan tidak ditemukan atau tidak dapat diakses oleh akun Anda.",
          });
        response.json(record);
      },
    );
  }
  router.get(
    "/tracking/:referenceId",
    authenticated,
    async (request, response) => {
      const parsed = referenceSchema.safeParse({
        reference: request.params.referenceId,
      });
      if (!parsed.success)
        return response
          .status(400)
          .json({ message: "Format nomor referensi tidak valid." });
      const record = await store.application(
        request.session.userId!,
        parsed.data.reference,
      );
      if (!record)
        return response.status(404).json({
          message:
            "Pengajuan tidak ditemukan atau tidak dapat diakses oleh akun Anda.",
        });
      response.json(record);
    },
  );
  router.get("/news", async (_request, response) => {
    response.json(await store.news());
  });
  router.get("/news/:slug", async (request, response) => {
    const article = (await store.news()).find(
      (n) => n.slug === request.params.slug,
    );
    if (!article)
      return response
        .status(404)
        .json({ message: "Artikel yang Anda cari tidak ditemukan." });
    response.json(article);
  });
  router.get(
    "/dashboard/overview",
    authenticated,
    async (request, response) => {
      const applications = await store.applications(request.session.userId!);
      response.json({
        user: publicUser(response.locals.user),
        applications,
        notifications: applications.slice(0, 5).map((a) => ({
          id: a.id,
          message: `${a.referenceNumber}: ${a.status}`,
          createdAt: a.updatedAt,
        })),
      });
    },
  );
  router.use((_request, response) =>
    response.status(404).json({ message: "Layanan tidak ditemukan." }),
  );
  const errors: ErrorRequestHandler = (error, _request, response, _next) => {
    const status =
      error.status === 400 || error.type === "entity.parse.failed"
        ? 400
        : error.status === 413
          ? 413
          : 500;
    response.status(status).json({
      message:
        status === 400
          ? "Format permintaan tidak valid."
          : status === 413
            ? "Data terlalu besar."
            : "Layanan sedang mengalami kendala. Silakan coba kembali.",
    });
  };
  router.use(errors);
  app.use("/api", router);
  return { app, sessionStore: sessionMiddleware };
}
