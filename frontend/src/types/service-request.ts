/** Mirrors TravelHub.Api.Features.ServiceRequests (service_requests.service_type, migration 012). */
export type ServiceRequestType = "attraction_tickets" | "car_rental" | "visa" | "group_tour";

export const SERVICE_REQUEST_TYPES: readonly ServiceRequestType[] =
  ["attraction_tickets", "car_rental", "visa", "group_tour"];

export type ServiceRequestStatus = "new" | "contacted" | "closed";

export const SERVICE_REQUEST_STATUSES: readonly ServiceRequestStatus[] = ["new", "contacted", "closed"];

/** Back office: one row of GET /api/admin/service-requests. */
export interface ServiceRequestSummary {
  id: string;
  code: string;
  serviceType: string;
  fullName: string;
  phone: string;
  email: string | null;
  status: string;
  assignedUserId: string | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRequestNote {
  id: string;
  authorName: string;
  note: string;
  createdAt: string;
}

export interface ServiceRequestDetail {
  summary: ServiceRequestSummary;
  customerNote: string | null;
  /** Validated service-specific fields as stored; shown through describeDetails, never printed raw. */
  details: Record<string, unknown>;
  consentAt: string;
  notes: ServiceRequestNote[];
}

/** Response of POST /api/service-requests. */
export interface ServiceRequestCreated {
  code: string;
  serviceType: string;
  createdAt: string;
}
