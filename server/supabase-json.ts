export type Json =
  string | number | boolean | null | { [key: string]: Json } | Json[];

export function toJson(value: unknown): Json {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  )
    return value;
  if (Array.isArray(value)) return value.map(toJson);
  if (typeof value === "object") {
    const result: { [key: string]: Json } = {};
    for (const [key, nested] of Object.entries(value))
      if (nested !== undefined) result[key] = toJson(nested);
    return result;
  }
  throw new TypeError("Value cannot be represented as JSON.");
}
