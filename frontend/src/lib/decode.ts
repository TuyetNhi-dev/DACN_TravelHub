import { ApiError } from "@/lib/api-client";

/**
 * Small runtime decoders: API responses are checked before use so a contract drift fails loudly
 * with a friendly message instead of rendering undefined values.
 */
export type Row = Record<string, unknown>;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isRecord(value: unknown): value is Row {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function invalid(resource: string): never {
  throw new ApiError(`Dữ liệu ${resource} trả về chưa đúng định dạng.`);
}

export function str(row: Row, key: string, resource: string): string {
  const value = row[key];
  return typeof value === "string" ? value : invalid(resource);
}

export function optStr(row: Row, key: string, resource: string): string | null {
  const value = row[key];
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : invalid(resource);
}

export function num(row: Row, key: string, resource: string): number {
  const value = row[key];
  return typeof value === "number" && Number.isFinite(value) ? value : invalid(resource);
}

export function optNum(row: Row, key: string, resource: string): number | null {
  const value = row[key];
  if (value === null || value === undefined) return null;
  return typeof value === "number" && Number.isFinite(value) ? value : invalid(resource);
}

export function bool(row: Row, key: string, resource: string): boolean {
  const value = row[key];
  return typeof value === "boolean" ? value : invalid(resource);
}

export function isoDate(row: Row, key: string, resource: string): string {
  const value = str(row, key, resource);
  return ISO_DATE.test(value) ? value : invalid(resource);
}

export function optIsoDate(row: Row, key: string, resource: string): string | null {
  const value = optStr(row, key, resource);
  return value === null || ISO_DATE.test(value) ? value : invalid(resource);
}

export function list<T>(value: unknown, item: (row: Row) => T, resource: string): T[] {
  if (!Array.isArray(value)) return invalid(resource);
  return value.map(entry => (isRecord(entry) ? item(entry) : invalid(resource)));
}

/** Unwraps the backend's { data, count } list envelope. */
export function listEnvelope<T>(value: unknown, item: (row: Row) => T, resource: string): T[] {
  if (!isRecord(value) || value.count !== (Array.isArray(value.data) ? value.data.length : -1))
    return invalid(resource);
  return list(value.data, item, resource);
}

/** Unwraps the backend's { data } item envelope. */
export function itemEnvelope<T>(value: unknown, item: (row: Row) => T, resource: string): T {
  return isRecord(value) && isRecord(value.data) ? item(value.data) : invalid(resource);
}
