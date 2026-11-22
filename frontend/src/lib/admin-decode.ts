/** Runtime decoders for the admin API (see lib/decode.ts for why every response is checked). */
import {
  bool, invalid, isoDate, isRecord, list, num, optIsoDate, optNum, optStr, str, type Row,
} from "@/lib/decode";
import type {
  AdminContext, AdminDeparture, AdminLookups, AdminTourDetail, AdminTourSummary, AuditLog, BranchLookup,
  Dashboard, DepartureStatus, InclusionType, Lookup, Manifest, ManifestBooking, ScopeOption, StaffMember,
  TourStatus,
} from "@/types/admin";

const R = "quản trị";

function nested(row: Row, key: string): Row {
  const value = row[key];
  return isRecord(value) ? value : invalid(R);
}

export function decodeContext(row: Row): AdminContext {
  const caps = nested(row, "capabilities");
  return {
    userId: str(row, "userId", R), fullName: str(row, "fullName", R), role: str(row, "role", R),
    scopeOptions: list(row.scopeOptions, (o): ScopeOption => ({
      value: str(o, "value", R), label: str(o, "label", R), kind: str(o, "kind", R) as ScopeOption["kind"],
    }), R),
    capabilities: {
      manageCatalog: bool(caps, "manageCatalog", R), viewAudit: bool(caps, "viewAudit", R),
      manageStaff: bool(caps, "manageStaff", R),
    },
  };
}

const lookup = (r: Row): Lookup => ({ id: str(r, "id", R), name: str(r, "name", R) });
const branch = (r: Row): BranchLookup => ({
  ...lookup(r), code: str(r, "code", R), regionId: optStr(r, "regionId", R), regionName: optStr(r, "regionName", R),
  canManage: bool(r, "canManage", R),
});

export function decodeLookups(row: Row): AdminLookups {
  return {
    destinations: list(row.destinations, lookup, R), departureLocations: list(row.departureLocations, lookup, R),
    categories: list(row.categories, lookup, R), regions: list(row.regions, lookup, R),
    branches: list(row.branches, branch, R),
  };
}

export function decodeDashboard(row: Row): Dashboard {
  return {
    ordersToday: num(row, "ordersToday", R), revenueThisMonth: num(row, "revenueThisMonth", R),
    pendingItems: num(row, "pendingItems", R),
    upcoming: list(row.upcoming, u => ({
      departureId: str(u, "departureId", R), tourId: str(u, "tourId", R), tourCode: str(u, "tourCode", R),
      tourTitle: str(u, "tourTitle", R), departureDate: isoDate(u, "departureDate", R),
      branchName: str(u, "branchName", R), reservedSeats: num(u, "reservedSeats", R),
      minGuests: num(u, "minGuests", R), capacity: num(u, "capacity", R), belowMinimum: bool(u, "belowMinimum", R),
    }), R),
    revenueByRegion: list(row.revenueByRegion, r => ({
      code: str(r, "code", R), name: str(r, "name", R), revenue: num(r, "revenue", R),
    }), R),
  };
}

export function decodeTourSummary(r: Row): AdminTourSummary {
  return {
    id: str(r, "id", R), code: str(r, "code", R), title: str(r, "title", R), destination: str(r, "destination", R),
    branchId: str(r, "branchId", R), branchName: str(r, "branchName", R), status: str(r, "status", R) as TourStatus,
    durationDays: num(r, "durationDays", R), durationNights: num(r, "durationNights", R),
    basePrice: num(r, "basePrice", R), upcomingDepartures: num(r, "upcomingDepartures", R),
    imageCount: num(r, "imageCount", R), canEdit: bool(r, "canEdit", R),
  };
}

export function decodeTourDetail(r: Row): AdminTourDetail {
  return {
    id: str(r, "id", R), code: str(r, "code", R), title: str(r, "title", R),
    destinationId: str(r, "destinationId", R), categoryId: optStr(r, "categoryId", R),
    branchId: str(r, "branchId", R), durationDays: num(r, "durationDays", R),
    durationNights: num(r, "durationNights", R), basePrice: num(r, "basePrice", R),
    description: optStr(r, "description", R), status: str(r, "status", R) as TourStatus,
    images: list(r.images, i => ({ url: str(i, "url", R), altText: optStr(i, "altText", R) }), R),
    itinerary: list(r.itinerary, d => ({
      dayNumber: num(d, "dayNumber", R), title: str(d, "title", R), description: optStr(d, "description", R),
    }), R),
    inclusions: list(r.inclusions, i => ({
      serviceType: str(i, "serviceType", R) as InclusionType, description: str(i, "description", R),
      isIncluded: bool(i, "isIncluded", R),
    }), R),
    canEdit: bool(r, "canEdit", R),
  };
}

export function decodeDeparture(r: Row): AdminDeparture {
  return {
    id: str(r, "id", R), tourId: str(r, "tourId", R), tourCode: str(r, "tourCode", R),
    tourTitle: str(r, "tourTitle", R), branchId: str(r, "branchId", R), branchName: str(r, "branchName", R),
    departureLocationId: str(r, "departureLocationId", R), departureFrom: str(r, "departureFrom", R),
    departureDate: isoDate(r, "departureDate", R), returnDate: isoDate(r, "returnDate", R),
    capacity: num(r, "capacity", R), reservedSeats: num(r, "reservedSeats", R), minGuests: num(r, "minGuests", R),
    adultPrice: num(r, "adultPrice", R), childPrice: optNum(r, "childPrice", R),
    status: str(r, "status", R) as DepartureStatus, canEdit: bool(r, "canEdit", R),
  };
}

const manifestBooking = (b: Row): ManifestBooking => ({
  bookingId: str(b, "bookingId", R), code: str(b, "code", R), status: str(b, "status", R),
  contactName: str(b, "contactName", R), contactPhone: optStr(b, "contactPhone", R),
  contactEmail: str(b, "contactEmail", R), adults: num(b, "adults", R), children: num(b, "children", R),
  passengers: list(b.passengers, p => ({
    fullName: str(p, "fullName", R), type: str(p, "type", R), birthDate: optIsoDate(p, "birthDate", R),
  }), R),
});

export function decodeManifest(r: Row): Manifest {
  return {
    departure: decodeDeparture(nested(r, "departure")), bookings: list(r.bookings, manifestBooking, R),
    totalGuests: num(r, "totalGuests", R),
  };
}

export function decodeAuditLog(r: Row): AuditLog {
  return {
    id: str(r, "id", R), createdAt: str(r, "createdAt", R), actorName: str(r, "actorName", R),
    action: str(r, "action", R), entityType: str(r, "entityType", R), entityId: str(r, "entityId", R),
    branchName: optStr(r, "branchName", R), summary: str(r, "summary", R),
    changes: list(r.changes, c => ({ field: str(c, "field", R), old: optStr(c, "old", R), new: optStr(c, "new", R) }),
      R),
  };
}

export function decodeStaffMember(r: Row): StaffMember {
  return {
    userId: str(r, "userId", R), fullName: str(r, "fullName", R), email: str(r, "email", R),
    assignments: list(r.assignments, a => ({
      id: str(a, "id", R), role: str(a, "role", R), scope: str(a, "scope", R), regionId: optStr(a, "regionId", R),
      regionName: optStr(a, "regionName", R), branchId: optStr(a, "branchId", R),
      branchName: optStr(a, "branchName", R),
    }), R),
  };
}
