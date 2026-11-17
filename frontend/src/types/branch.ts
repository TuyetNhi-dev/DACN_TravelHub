/** Mirrors TravelHub.Api.Features.Branches.BranchDto. */
export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  openingHours: string | null;
}

/** A branch that can be pinned on the map. */
export type LocatedBranch = Branch & { latitude: number; longitude: number };
