import { apiGet } from "@/lib/api-client";
import {
  bool, invalid, isRecord, itemEnvelope, list, listEnvelope, num, optNum, optStr, str, type Row,
} from "@/lib/decode";
import type { HotelAmenity, HotelDetail, HotelPolicy, HotelSummary, HouseRules, RoomType } from "@/types/hotel";

const RESOURCE = "khách sạn";

export function decodeHotel(row: Row): HotelSummary {
  return {
    id: str(row, "id", RESOURCE),
    name: str(row, "name", RESOURCE),
    city: str(row, "city", RESOURCE),
    address: optStr(row, "address", RESOURCE),
    starRating: optNum(row, "starRating", RESOURCE),
    description: optStr(row, "description", RESOURCE),
    referencePricePerNight: optNum(row, "referencePricePerNight", RESOURCE),
  };
}

function decodeRoomType(row: Row): RoomType {
  return {
    id: str(row, "id", RESOURCE),
    name: str(row, "name", RESOURCE),
    maxGuests: num(row, "maxGuests", RESOURCE),
    description: optStr(row, "description", RESOURCE),
    referencePricePerNight: optNum(row, "referencePricePerNight", RESOURCE),
    offerTerms: optStr(row, "offerTerms", RESOURCE),
  };
}

function decodeAmenity(row: Row): HotelAmenity {
  return {
    code: str(row, "code", RESOURCE),
    name: str(row, "name", RESOURCE),
    category: str(row, "category", RESOURCE),
    isHighlight: bool(row, "isHighlight", RESOURCE),
    isPaid: bool(row, "isPaid", RESOURCE),
  };
}

function decodePolicy(row: Row): HotelPolicy {
  return { type: str(row, "type", RESOURCE), content: str(row, "content", RESOURCE) };
}

function decodeHouseRules(row: Row): HouseRules {
  return {
    checkInFrom: optStr(row, "checkInFrom", RESOURCE),
    checkOutUntil: optStr(row, "checkOutUntil", RESOURCE),
    policies: list(row.policies, decodePolicy, RESOURCE),
  };
}

export function decodeHotelDetail(row: Row): HotelDetail {
  return {
    hotel: isRecord(row.hotel) ? decodeHotel(row.hotel) : invalid(RESOURCE),
    roomTypes: list(row.roomTypes, decodeRoomType, RESOURCE),
    amenities: list(row.amenities, decodeAmenity, RESOURCE),
    houseRules: isRecord(row.houseRules) ? decodeHouseRules(row.houseRules) : invalid(RESOURCE),
  };
}

export async function getHotels(signal?: AbortSignal): Promise<HotelSummary[]> {
  return listEnvelope(await apiGet("/api/hotels", signal), decodeHotel, RESOURCE);
}

export async function getHotel(id: string, signal?: AbortSignal): Promise<HotelDetail> {
  const value = await apiGet("/api/hotels/" + encodeURIComponent(id), signal);
  return itemEnvelope(value, decodeHotelDetail, RESOURCE);
}
