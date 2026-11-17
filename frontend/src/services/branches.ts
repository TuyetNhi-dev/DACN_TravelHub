import { apiGet } from "@/lib/api-client";
import { listEnvelope, optNum, optStr, str, type Row } from "@/lib/decode";
import type { Branch } from "@/types/branch";

const RESOURCE = "văn phòng";

export function decodeBranch(row: Row): Branch {
  return {
    id: str(row, "id", RESOURCE),
    code: str(row, "code", RESOURCE),
    name: str(row, "name", RESOURCE),
    address: optStr(row, "address", RESOURCE),
    region: optStr(row, "region", RESOURCE),
    latitude: optNum(row, "latitude", RESOURCE),
    longitude: optNum(row, "longitude", RESOURCE),
    phone: optStr(row, "phone", RESOURCE),
    openingHours: optStr(row, "openingHours", RESOURCE),
  };
}

export async function getBranches(signal?: AbortSignal): Promise<Branch[]> {
  return listEnvelope(await apiGet("/api/branches", signal), decodeBranch, RESOURCE);
}
