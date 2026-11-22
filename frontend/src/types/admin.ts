/** Mirrors the DTOs of TravelHub.Api.Features.Admin (docs/architecture/admin-spec.md). */

export interface ScopeOption {
  value: string;
  label: string;
  kind: "all" | "region" | "branch";
}

export interface AdminCapabilities {
  manageCatalog: boolean;
  viewAudit: boolean;
  manageStaff: boolean;
}

export interface AdminContext {
  userId: string;
  fullName: string;
  role: string;
  scopeOptions: ScopeOption[];
  capabilities: AdminCapabilities;
}

export interface Lookup {
  id: string;
  name: string;
}

export interface BranchLookup extends Lookup {
  code: string;
  regionId: string | null;
  regionName: string | null;
  canManage: boolean;
}

export interface AdminLookups {
  destinations: Lookup[];
  departureLocations: Lookup[];
  categories: Lookup[];
  regions: Lookup[];
  branches: BranchLookup[];
}

export interface UpcomingDeparture {
  departureId: string;
  tourId: string;
  tourCode: string;
  tourTitle: string;
  departureDate: string;
  branchName: string;
  reservedSeats: number;
  minGuests: number;
  capacity: number;
  belowMinimum: boolean;
}

export interface RegionRevenue {
  code: string;
  name: string;
  revenue: number;
}

export interface Dashboard {
  ordersToday: number;
  revenueThisMonth: number;
  pendingItems: number;
  upcoming: UpcomingDeparture[];
  revenueByRegion: RegionRevenue[];
}

export type TourStatus = "draft" | "published" | "paused" | "archived";

export interface AdminTourSummary {
  id: string;
  code: string;
  title: string;
  destination: string;
  branchId: string;
  branchName: string;
  status: TourStatus;
  durationDays: number;
  durationNights: number;
  basePrice: number;
  upcomingDepartures: number;
  imageCount: number;
  canEdit: boolean;
}

export interface TourImageInput {
  url: string;
  altText: string | null;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string | null;
}

export type InclusionType = "hotel" | "flight" | "transport" | "meal" | "guide" | "ticket" | "other";

export interface Inclusion {
  serviceType: InclusionType;
  description: string;
  isIncluded: boolean;
}

export interface AdminTourDetail {
  id: string;
  code: string;
  title: string;
  destinationId: string;
  categoryId: string | null;
  branchId: string;
  durationDays: number;
  durationNights: number;
  basePrice: number;
  description: string | null;
  status: TourStatus;
  images: TourImageInput[];
  itinerary: ItineraryDay[];
  inclusions: Inclusion[];
  canEdit: boolean;
}

export interface SaveTourInput {
  code: string;
  title: string;
  destinationId: string;
  categoryId: string | null;
  operatingBranchId: string;
  durationDays: number;
  durationNights: number;
  basePrice: number;
  description: string | null;
}

export type DepartureStatus = "open" | "closed" | "cancelled";

export interface AdminDeparture {
  id: string;
  tourId: string;
  tourCode: string;
  tourTitle: string;
  branchId: string;
  branchName: string;
  departureLocationId: string;
  departureFrom: string;
  departureDate: string;
  returnDate: string;
  capacity: number;
  reservedSeats: number;
  minGuests: number;
  adultPrice: number;
  childPrice: number | null;
  status: DepartureStatus;
  canEdit: boolean;
}

export interface DepartureTerms {
  departureLocationId: string;
  operatingBranchId: string;
  capacity: number;
  minGuests: number;
  adultPrice: number;
  childPrice: number | null;
}

export interface BulkResult {
  created: number;
  skippedDates: string[];
}

export interface ManifestPassenger {
  fullName: string;
  type: string;
  birthDate: string | null;
}

export interface ManifestBooking {
  bookingId: string;
  code: string;
  status: string;
  contactName: string;
  contactPhone: string | null;
  contactEmail: string;
  adults: number;
  children: number;
  passengers: ManifestPassenger[];
}

export interface Manifest {
  departure: AdminDeparture;
  bookings: ManifestBooking[];
  totalGuests: number;
}

export interface AuditChange {
  field: string;
  old: string | null;
  new: string | null;
}

export interface AuditLog {
  id: string;
  createdAt: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  branchName: string | null;
  summary: string;
  changes: AuditChange[];
}

export interface StaffAssignment {
  id: string;
  role: string;
  scope: string;
  regionId: string | null;
  regionName: string | null;
  branchId: string | null;
  branchName: string | null;
}

export interface StaffMember {
  userId: string;
  fullName: string;
  email: string;
  assignments: StaffAssignment[];
}

export interface AssignStaffInput {
  email: string;
  role: string;
  scope: string;
  regionId: string | null;
  branchId: string | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
}
