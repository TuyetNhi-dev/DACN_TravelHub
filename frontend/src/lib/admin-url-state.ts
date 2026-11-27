/**
 * Keeps an admin list's filters in the URL (?status=…&page=2), so a filtered view can be reloaded, bookmarked or
 * shared. Only keys of the defaults are read; values equal to their default are left out of the URL.
 */
export type FilterValues = Record<string, string | number>;

type Params = Pick<URLSearchParams, "get">;

const MAX_VALUE_LENGTH = 100;
const FIRST_PAGE = 1;

/** Reads every key of `defaults` from the URL; numbers stay numbers (a bad page number falls back to 1). */
export function readFilters<T extends FilterValues>(params: Params, defaults: T): T {
  const result: FilterValues = { ...defaults };
  for (const [key, fallback] of Object.entries(defaults)) {
    const raw = params.get(key);
    if (raw === null) continue;
    if (typeof fallback === "number") {
      const number = Number(raw);
      result[key] = Number.isInteger(number) && number >= FIRST_PAGE ? number : fallback;
    } else {
      result[key] = raw.slice(0, MAX_VALUE_LENGTH);
    }
  }
  return result as T;
}

/** "?a=1&b=x" with only the values that differ from their default; "" when everything is default. */
export function filtersToQuery<T extends FilterValues>(filters: T, defaults: T): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(filters))
    if (value !== defaults[key] && value !== "") search.set(key, String(value));
  const text = search.toString();
  return text ? "?" + text : "";
}

/** Changing a filter other than the page sends the user back to page 1, so they never land on an empty page. */
export function withFilter<T extends FilterValues>(filters: T, key: keyof T, value: T[keyof T]): T {
  const next = { ...filters, [key]: value };
  if (key !== "page" && "page" in filters) (next as FilterValues).page = FIRST_PAGE;
  return next;
}
