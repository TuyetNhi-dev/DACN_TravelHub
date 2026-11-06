export interface Flight {
  flightId: string;
  soHieuDemo: string | null;
  hangBayThamKhao: string | null;
  maSanBayDi: string | null;
  noiDi: string | null;
  maSanBayDen: string | null;
  noiDen: string | null;
  ngayBay: string | null;
  gioDi: string | null;
  gioDen: string | null;
  thoiGianPhut: number | null;
  hangVe: string | null;
  giaVnd: number | null;
  soGheCon: number | null;
  ghiChu: string | null;
  nguonThamKhao: string | null;
}
export interface FlightSearch {
  from: string; to: string; departure: string; returning: string;
  roundTrip: boolean; passengers: number; cabin: string;
}
