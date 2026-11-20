import { apiPost } from "@/lib/api-client";
import { itemEnvelope, str } from "@/lib/decode";
import type { ServiceRequestPayload } from "@/lib/service-request-form";
import type { ServiceRequestCreated } from "@/types/service-request";

const RESOURCE = "yêu cầu tư vấn";

/** Public, no sign-in needed (CSRF token is fetched by api-client). */
export async function createServiceRequest(payload: ServiceRequestPayload): Promise<ServiceRequestCreated> {
  const value = await apiPost("/api/service-requests", payload);
  return itemEnvelope(value, row => ({
    code: str(row, "code", RESOURCE),
    serviceType: str(row, "serviceType", RESOURCE),
    createdAt: str(row, "createdAt", RESOURCE),
  }), RESOURCE);
}
