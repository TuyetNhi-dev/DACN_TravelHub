import type { Branch, LocatedBranch } from "@/types/branch";

/** Whole-country view used before any branch has coordinates. */
export const VIETNAM_CENTER: [number, number] = [16.0, 106.5];
export const VIETNAM_ZOOM = 5;
export const BRANCH_ZOOM = 15;
export const ALL_REGIONS = "";

const HOTLINE_PREFIX = "1900";
const HOTLINE_LENGTH = 8;
const LANDLINE_LENGTH = 11;

export function hasLocation(branch: Branch): branch is LocatedBranch {
  return branch.latitude !== null && branch.longitude !== null;
}

/** "19006886" → "1900 6886", "02838123456" → "028 3812 3456"; anything else is shown as stored. */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === HOTLINE_LENGTH && digits.startsWith(HOTLINE_PREFIX))
    return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  if (digits.length === LANDLINE_LENGTH)
    return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
  return phone;
}

export function telHref(phone: string): string {
  return "tel:" + phone.replace(/[^\d+]/g, "");
}

export function directionsUrl(branch: LocatedBranch): string {
  const destination = `${branch.latitude},${branch.longitude}`;
  return "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(destination);
}

/** Regions in API order (the API sorts by region), without duplicates or blanks. */
export function regionsOf(branches: Branch[]): string[] {
  return [...new Set(branches.map(branch => branch.region).filter((name): name is string => !!name))];
}

export function inRegion(branch: Branch, region: string): boolean {
  return region === ALL_REGIONS || branch.region === region;
}
