/** Database ids are positive integers sent as strings (BIGINT UNSIGNED, at most 20 digits). */
const RESOURCE_ID = /^[1-9]\d{0,19}$/;

export function isResourceId(value: string): boolean {
  return RESOURCE_ID.test(value);
}

export function firstParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}
