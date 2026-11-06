/** Exact camelCase JSON contract of the TravelHub API. SQL NULL remains null. */
export interface Tour {
  tourId: string;
  tenTour: string | null;
  diemKhoiHanh: string | null;
  diemDen: string | null;
  soNgay: number | null;
  soDem: number | null;
  phuongTien: string | null;
  giaNguoiLonVnd: number | null;
  giaTreEmVnd: number | null;
  diemThamQuan: string | null;
  lichTrinhTomTat: string | null;
  loaiDuLieu: string | null;
  nguonThamKhao: string | null;
}

export interface TourDeparture {
  departureId: string;
  tourId: string;
  ngayKhoiHanh: string | null;
  soChoCon: number | null;
  giaNguoiLonVnd: number | null;
  trangThai: string | null;
}

export interface TourDetail {
  tour: Tour;
  departures: TourDeparture[];
}

export interface TourListResponse {
  data: Tour[];
  count: number;
}
