import { photos } from "@/data/home";
import type { Tour, TourDeparture } from "@/types/tour";
import { normalizeSearch } from "@/lib/format";

export { formatCurrency as tourPrice } from "@/lib/format";

export const tourHref = (id: string) => "/tours/" + encodeURIComponent(id);
export const tourDate = (date: string | null) => date ? date.split("-").reverse().join("/") : "Chưa có ngày";
export const tourDuration = (tour: Tour) => [
  tour.soNgay !== null ? tour.soNgay + " ngày" : null,
  tour.soDem !== null ? tour.soDem + " đêm" : null,
].filter(Boolean).join(" ") || "Chưa có thời lượng";

export interface TourFilters {
  query: string; destination: string; minPrice: string; maxPrice: string;
  duration: string; date: string; sort: string;
}
export const emptyTourFilters: TourFilters = {
  query: "", destination: "", minPrice: "", maxPrice: "", duration: "", date: "", sort: "",
};

export function filterTours(tours: Tour[], filters: TourFilters,
  schedules: Record<string, TourDeparture[]> = {}) {
  const rows = tours.filter(tour => {
    const price = tour.giaNguoiLonVnd;
    return normalizeSearch([tour.tenTour, tour.diemDen, tour.diemKhoiHanh, tour.tourId].join(" "))
      .includes(normalizeSearch(filters.query)) &&
      (!filters.destination || tour.diemDen === filters.destination) &&
      (!filters.minPrice || (price !== null && price >= Number(filters.minPrice))) &&
      (!filters.maxPrice || (price !== null && price <= Number(filters.maxPrice))) &&
      (!filters.duration || (tour.soNgay !== null && (filters.duration === "short" ?
        tour.soNgay <= 3 : filters.duration === "medium" ? tour.soNgay >= 4 && tour.soNgay <= 5 : tour.soNgay > 5))) &&
      (!filters.date || schedules[tour.tourId]?.some(d => d.ngayKhoiHanh === filters.date));
  });
  if (filters.sort) rows.sort((a, b) => {
    if (a.giaNguoiLonVnd === null) return b.giaNguoiLonVnd === null ? 0 : 1;
    if (b.giaNguoiLonVnd === null) return -1;
    return filters.sort === "low" ? a.giaNguoiLonVnd - b.giaNguoiLonVnd : b.giaNguoiLonVnd - a.giaNguoiLonVnd;
  });
  return rows;
}

/** Illustrations only, never a claim that the database contains tour photos. */
export function tourIllustration(destination: string | null) {
  if (destination === "Hạ Long") return photos.halong;
  if (destination === "Hội An") return photos.hoian;
  if (destination === "Đà Nẵng") return photos.danang;
  return photos.hero;
}
