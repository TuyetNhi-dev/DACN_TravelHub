/** Pure rules of the tour photo editor. They mirror AdminTourValidator.Images; the server checks them again. */
import type { LibraryChoice } from "@/lib/media";
import type { TourImageInput } from "@/types/admin";

export const MAX_TOUR_IMAGES = 20;
export const MAX_ALT_TEXT = 255;

// Only the curated Unsplash host: next/image is configured for it alone and every photo must be credited.
const UNSPLASH_PHOTO = /^https:\/\/images\.unsplash\.com\/photo-[A-Za-z0-9-]+(\?[A-Za-z0-9=&%._-]*)?$/;

export interface ImageRow {
  url: string;
  altText: string;
}

export const EMPTY_IMAGE: ImageRow = { url: "", altText: "" };

export const isAllowedImageUrl = (url: string) => UNSPLASH_PHOTO.test(url.trim());

export function imageRowsFrom(images: TourImageInput[]): ImageRow[] {
  return images.map(image => ({ url: image.url, altText: image.altText ?? "" }));
}

/** Saved in list order: the first photo is the tour's cover. */
export function toImageInputs(rows: ImageRow[]): TourImageInput[] {
  return rows.map(row => ({ url: row.url.trim(), altText: row.altText.trim() || null }));
}

/** Library photos not on the tour yet, so the picker never offers a duplicate. */
export function unusedChoices(choices: LibraryChoice[], rows: ImageRow[]): LibraryChoice[] {
  const used = new Set(rows.map(row => row.url.trim()));
  return choices.filter(choice => !used.has(choice.url));
}

/** Choices grouped by place, in first-seen order, for <optgroup>. */
export function groupByPlace(choices: LibraryChoice[]): [string, LibraryChoice[]][] {
  const groups = new Map<string, LibraryChoice[]>();
  for (const choice of choices) groups.set(choice.place, [...(groups.get(choice.place) ?? []), choice]);
  return [...groups.entries()];
}
