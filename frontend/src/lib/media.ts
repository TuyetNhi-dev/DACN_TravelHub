import { photoLibrary, type LibraryPhoto, type PhotoSetKey } from "@/data/photo-library";
import { normalizeSearch } from "@/lib/format";
import type { TourSummary } from "@/types/tour";
import type { HotelSummary, RoomType } from "@/types/hotel";

/**
 * The ONLY place components get images from. API DTOs carry no photos yet; when they gain an
 * `imageUrls` field those images win automatically (add their host to images.remotePatterns).
 */
export interface MediaImage {
  src: string;
  alt: string;
  author: string | null;
  sourceUrl: string | null;
  /** True when the photo is not of this exact place or product, so the UI must label it. */
  illustrative: boolean;
}

interface WithApiImages {
  imageUrls?: readonly string[] | null;
}

const IMAGE_HOST = "https://images.unsplash.com/photo-";
const SOURCE_PAGE = "https://unsplash.com/photos/";
// next/image resizes from this source; 1920px covers a full-width hero on large screens.
const SOURCE_PARAMS = "?auto=format&fit=crop&w=1920&q=80";
const GALLERY_SIZE = 5;
/** Detail pages show about ten photos so the place can be seen from several angles. */
export const DETAIL_GALLERY_SIZE = 10;
const HOTEL_PROPERTY_PHOTOS = 5;
const HOTEL_ROOM_PHOTOS = 3;
const ROOM_GALLERY_SIZE = 2;

/** Place names for captions, so a photo borrowed from a nearby stop says where it was taken. */
const SET_PLACES: Partial<Record<PhotoSetKey, string>> = {
  halong: "Vịnh Hạ Long", hoian: "Hội An", danang: "Đà Nẵng", phuquoc: "Phú Quốc", nhatrang: "Nha Trang",
  dalat: "Đà Lạt", sapa: "Sa Pa", hue: "Huế", hanoi: "Hà Nội", saigon: "TP. Hồ Chí Minh",
  ninhbinh: "Ninh Bình", mekong: "Miền Tây",
};

/** Stops usually combined on one trip; they fill a tour gallery up to DETAIL_GALLERY_SIZE. */
const NEARBY_SETS: Partial<Record<PhotoSetKey, PhotoSetKey[]>> = {
  halong: ["ninhbinh", "hanoi"], hoian: ["danang", "hue"], danang: ["hoian", "hue"], hue: ["danang", "hoian"],
  phuquoc: ["nhatrang", "mekong"], nhatrang: ["dalat", "phuquoc"], dalat: ["nhatrang", "saigon"],
  sapa: ["hanoi", "ninhbinh"], hanoi: ["halong", "ninhbinh"], ninhbinh: ["halong", "hanoi"],
  saigon: ["mekong", "nhatrang"], mekong: ["saigon", "phuquoc"],
};

/** Landmarks in tour titles that point at a photo set (e.g. "Bà Nà Hills" → Đà Nẵng). */
const LANDMARK_SETS: Record<string, PhotoSetKey> = {
  "ba na": "danang", "trang an": "ninhbinh", "tam coc": "ninhbinh", "fansipan": "sapa", "cu chi": "saigon",
  "my tho": "mekong", "mien tay": "mekong", "cai rang": "mekong", "lan ha": "halong",
};

/** Photo sets taken at the destination itself. */
const OWN_SETS: Record<string, PhotoSetKey> = {
  "ha long": "halong", "vinh ha long": "halong", "hoi an": "hoian", "da nang": "danang",
  "phu quoc": "phuquoc", "nha trang": "nhatrang", "da lat": "dalat", "sa pa": "sapa", "sapa": "sapa",
  "hue": "hue", "ha noi": "hanoi", "ho chi minh": "saigon", "sai gon": "saigon", "ninh binh": "ninhbinh",
};

/** Destinations without their own set borrow a similar landscape and are labelled as illustrations. */
const SIMILAR_SETS: Record<string, PhotoSetKey> = {
  "hai phong": "halong", "van don": "halong", "con dao": "phuquoc", "ly son": "phuquoc",
  "quy nhon": "nhatrang", "mui ne": "nhatrang", "vung tau": "nhatrang", "buon ma thuot": "dalat",
  "pleiku": "dalat", "ha giang": "sapa", "moc chau": "sapa", "tam dao": "sapa", "thanh hoa": "ninhbinh",
  "quang binh": "ninhbinh", "dong hoi": "ninhbinh", "can tho": "mekong", "ben tre": "mekong",
  "an giang": "mekong", "tay ninh": "saigon",
};

const MIXED_SETS: PhotoSetKey[] = ["halong", "hoian", "ninhbinh", "sapa", "mekong", "danang"];

export function destinationKey(name: string): string {
  return normalizeSearch(name).replace(/^(tp\.?|thanh pho)\s*/, "").replace(/[.,]/g, "").replace(/\s+/g, " ");
}

export function getDestinationImages(name: string | null): MediaImage[] {
  const key = name ? destinationKey(name) : "";
  const own = OWN_SETS[key];
  if (own) return photoLibrary[own].slice(0, GALLERY_SIZE).map(photo => fromLibrary(photo, false));
  const similar = SIMILAR_SETS[key];
  const photos = similar ? photoLibrary[similar] : MIXED_SETS.map(set => photoLibrary[set][0]);
  return photos.slice(0, GALLERY_SIZE).map(photo => illustrationFor(photo, name));
}

type TourForImages = Pick<TourSummary, "id" | "destination"> & { title?: string } & WithApiImages;

/**
 * Up to DETAIL_GALLERY_SIZE photos: every stop named in the title (interleaved, so the first tiles
 * already show different places), then nearby stops. None shows this exact tour, so all are labelled.
 */
export function getTourImages(tour: TourForImages): MediaImage[] {
  const api = fromApi(tour.imageUrls, `Ảnh tour ${tour.destination}`);
  if (api.length > 0) return api;
  const named = tourPhotoSets(tour);
  // A destination without its own photos borrows a similar landscape; captions name the real place shown.
  const similar = SIMILAR_SETS[destinationKey(tour.destination ?? "")];
  const stops = named.length > 0 || !similar ? named : [similar];
  if (stops.length === 0)
    return rotate(getDestinationImages(tour.destination), tour.id).map(image => ({ ...image, illustrative: true }));
  const sets = unique([...stops, ...stops.flatMap(set => NEARBY_SETS[set] ?? [])]);
  const own = interleave(stops.map(set => rotate(photoLibrary[set], tour.id).map(photo => placed(photo, set))));
  const nearby = sets.slice(stops.length).flatMap(set => photoLibrary[set].map(photo => placed(photo, set)));
  return [...own, ...nearby].slice(0, DETAIL_GALLERY_SIZE);
}

/** Photo sets for the stops a tour mentions, destination first, in title order. */
export function tourPhotoSets(tour: Pick<TourSummary, "destination"> & { title?: string }): PhotoSetKey[] {
  const text = ` ${wordsOf(`${tour.destination} ${tour.title ?? ""}`)} `;
  const found = Object.entries({ ...OWN_SETS, ...LANDMARK_SETS })
    .map(([name, set]) => ({ set, at: text.indexOf(` ${name} `) }))
    .filter(match => match.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map(match => match.set);
  return unique(found);
}

/** Property, rooms and the city: different angles of a stay. All are illustrations until partners send photos. */
export function getHotelImages(hotel: Pick<HotelSummary, "id" | "city" | "name"> & WithApiImages): MediaImage[] {
  const api = fromApi(hotel.imageUrls, `Ảnh khách sạn ${hotel.name}`);
  if (api.length > 0) return api;
  const property = rotate(photoLibrary.hotel, hotel.id).slice(0, HOTEL_PROPERTY_PHOTOS);
  const rooms = rotate(photoLibrary.room, hotel.id).slice(0, HOTEL_ROOM_PHOTOS);
  const city = getDestinationImages(hotel.city)
    .slice(0, DETAIL_GALLERY_SIZE - HOTEL_PROPERTY_PHOTOS - HOTEL_ROOM_PHOTOS);
  return [
    ...property.map(photo => fromLibrary(photo, true)),
    ...rooms.map(photo => fromLibrary(photo, true)),
    ...city.map(image => ({ ...image, illustrative: true })),
  ];
}

export function getRoomImages(room: Pick<RoomType, "id" | "name"> & WithApiImages): MediaImage[] {
  const api = fromApi(room.imageUrls, `Ảnh phòng ${room.name}`);
  if (api.length > 0) return api.slice(0, ROOM_GALLERY_SIZE);
  return rotate(photoLibrary.room, room.id).slice(0, ROOM_GALLERY_SIZE).map(photo => fromLibrary(photo, true));
}

function fromLibrary(photo: LibraryPhoto, illustrative: boolean): MediaImage {
  return {
    src: IMAGE_HOST + photo.id + SOURCE_PARAMS,
    alt: photo.alt,
    author: photo.author,
    sourceUrl: SOURCE_PAGE + photo.page,
    illustrative,
  };
}

function illustrationFor(photo: LibraryPhoto, place: string | null): MediaImage {
  const image = fromLibrary(photo, true);
  return place ? { ...image, alt: `${photo.alt} (ảnh minh họa cho ${place})` } : image;
}

function fromApi(urls: readonly string[] | null | undefined, alt: string): MediaImage[] {
  return (urls ?? []).map((src, index) => ({
    src, alt: `${alt} ${index + 1}`, author: null, sourceUrl: null, illustrative: false,
  }));
}

function placed(photo: LibraryPhoto, set: PhotoSetKey): MediaImage {
  const place = SET_PLACES[set];
  const image = fromLibrary(photo, true);
  return place ? { ...image, alt: `${place}: ${photo.alt}` } : image;
}

function wordsOf(text: string): string {
  return normalizeSearch(text).replace(/[^a-z0-9]+/g, " ").trim();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

/** [[a1, a2], [b1]] → [a1, b1, a2]. */
function interleave<T>(lists: T[][]): T[] {
  const longest = Math.max(0, ...lists.map(list => list.length));
  return Array.from({ length: longest }, (_, index) => lists.map(list => list[index]))
    .flat()
    .filter((item): item is T => item !== undefined);
}

/** Stable per-id rotation so neighbouring cards for the same destination do not look identical. */
function rotate<T>(items: readonly T[], seed: string): T[] {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  const start = items.length === 0 ? 0 : hash % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}
