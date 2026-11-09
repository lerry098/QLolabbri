import type { SupabaseClient } from "@supabase/supabase-js";
import session from "express-session";
import type { Database } from "./supabase-types";
import { toJson, type Json } from "./supabase-json";

function sessionExpiry(value: session.SessionData) {
  const expires = value.cookie.expires;
  return expires
    ? new Date(expires).toISOString()
    : new Date(
        Date.now() + (value.cookie.maxAge ?? 30 * 60 * 1000),
      ).toISOString();
}

function sessionExpiryTime(value: string) {
  // Legacy timestamp columns return UTC values without a timezone offset.
  const timestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(
    value,
  )
    ? `${value}Z`
    : value;
  const time = new Date(timestamp).getTime();
  if (!Number.isFinite(time))
    throw new Error("Supabase returned an invalid session expiry.");
  return time;
}

function parseSession(value: Json): session.SessionData {
  if (
    value === null ||
    Array.isArray(value) ||
    typeof value !== "object" ||
    !("cookie" in value) ||
    value.cookie === null ||
    Array.isArray(value.cookie) ||
    typeof value.cookie !== "object"
  )
    throw new Error("Supabase returned malformed session data.");
  const cookieValue = value.cookie;
  const cookie = new session.Cookie();
  if (
    cookieValue.originalMaxAge === null ||
    typeof cookieValue.originalMaxAge === "number"
  )
    cookie.originalMaxAge = cookieValue.originalMaxAge;
  if (cookieValue.maxAge === null || typeof cookieValue.maxAge === "number")
    cookie.maxAge = cookieValue.maxAge ?? undefined;
  if (cookieValue.expires === null || typeof cookieValue.expires === "string")
    cookie.expires = cookieValue.expires ? new Date(cookieValue.expires) : null;
  if (typeof cookieValue.httpOnly === "boolean")
    cookie.httpOnly = cookieValue.httpOnly;
  if (typeof cookieValue.path === "string") cookie.path = cookieValue.path;
  if (typeof cookieValue.domain === "string")
    cookie.domain = cookieValue.domain;
  if (typeof cookieValue.secure === "boolean" || cookieValue.secure === "auto")
    cookie.secure = cookieValue.secure;
  if (
    typeof cookieValue.sameSite === "boolean" ||
    cookieValue.sameSite === "lax" ||
    cookieValue.sameSite === "strict" ||
    cookieValue.sameSite === "none"
  )
    cookie.sameSite = cookieValue.sameSite;
  const result: session.SessionData = { cookie };
  if (typeof value.userId === "string") result.userId = value.userId;
  if (typeof value.csrfToken === "string") result.csrfToken = value.csrfToken;
  if (typeof value.expiresAt === "number") result.expiresAt = value.expiresAt;
  return result;
}

export class SupabaseSessionStore extends session.Store {
  constructor(private readonly client: SupabaseClient<Database>) {
    super();
  }

  get(sid: string, callback: Parameters<session.Store["get"]>[1]): void {
    void (async () => {
      const { data, error } = await this.client
        .from("sessions")
        .select("sess,expire")
        .eq("sid", sid)
        .maybeSingle();
      if (error)
        throw new Error(`Supabase session lookup failed: ${error.message}`);
      if (!data) {
        callback(null, null);
        return;
      }
      if (sessionExpiryTime(data.expire) <= Date.now()) {
        const { error: deleteError } = await this.client
          .from("sessions")
          .delete()
          .eq("sid", sid);
        if (deleteError)
          throw new Error(
            `Supabase session cleanup failed: ${deleteError.message}`,
          );
        callback(null, null);
        return;
      }
      callback(null, parseSession(data.sess));
    })().catch((error: unknown) => callback(error));
  }

  set(
    sid: string,
    value: session.SessionData,
    callback?: Parameters<session.Store["set"]>[2],
  ): void {
    void (async () => {
      const { error } = await this.client
        .from("sessions")
        .upsert(
          { sid, sess: toJson(value), expire: sessionExpiry(value) },
          { onConflict: "sid" },
        );
      if (error)
        throw new Error(`Supabase session save failed: ${error.message}`);
      callback?.();
    })().catch((error: unknown) => callback?.(error));
  }

  destroy(
    sid: string,
    callback?: Parameters<session.Store["destroy"]>[1],
  ): void {
    void (async () => {
      const { error } = await this.client
        .from("sessions")
        .delete()
        .eq("sid", sid);
      if (error)
        throw new Error(`Supabase session deletion failed: ${error.message}`);
      callback?.();
    })().catch((error: unknown) => callback?.(error));
  }

  touch(
    sid: string,
    value: session.SessionData,
    callback?: Parameters<NonNullable<session.Store["touch"]>>[2],
  ): void {
    void (async () => {
      const { error } = await this.client
        .from("sessions")
        .update({ expire: sessionExpiry(value) })
        .eq("sid", sid);
      if (error)
        throw new Error(`Supabase session refresh failed: ${error.message}`);
      callback?.();
    })().catch((error: unknown) => {
      console.error("Supabase session refresh failed:", error);
      callback?.();
    });
  }
}
