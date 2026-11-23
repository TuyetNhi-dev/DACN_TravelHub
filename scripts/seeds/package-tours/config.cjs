/* Fixed inputs of seed 010. Changing any value changes the generated SQL. */

/** The day the schedule was written; departures run 90 days from here. */
const TODAY = '2026-11-23';
const WINDOW_START = '2026-11-25';
const WINDOW_END = '2027-02-21';

/** Dòng tour: price per day (road), one-day price, return flight, seat counts, minimum group size. */
const TIERS = {
  TK: { slug: 'tiet-kiem', name: 'Tiết kiệm', perDay: 850000, dayTour: 590000, flight: 2300000,
    capacities: [30, 35, 40], minGuests: 15 },
  TC: { slug: 'tieu-chuan', name: 'Tiêu chuẩn', perDay: 1250000, dayTour: 890000, flight: 2800000,
    capacities: [20, 25, 30], minGuests: 10 },
  CC: { slug: 'cao-cap', name: 'Cao cấp', perDay: 2300000, dayTour: 1650000, flight: 4200000,
    capacities: [15, 18, 20, 24], minGuests: 6 },
};

/** Branch code (seed 002) → location code its tours leave from. */
const BRANCH_ORIGIN = { HN: 'city-ha-noi', DN: 'city-da-nang', HCM: 'city-tp-ho-chi-minh', CT: 'city-can-tho' };
const ORIGIN_NAME = { HN: 'Hà Nội', DN: 'Đà Nẵng', HCM: 'TP. Hồ Chí Minh', CT: 'Cần Thơ' };

/** Destinations missing from seed 002; inserted only when their code is absent. */
const NEW_LOCATIONS = [
  ['city-cao-bang', 'Cao Bằng'], ['city-phu-yen', 'Phú Yên'], ['city-ca-mau', 'Cà Mau'],
  ['city-dong-thap', 'Đồng Tháp'], ['city-bac-lieu', 'Bạc Liêu'], ['city-kien-giang', 'Kiên Giang'],
  ['city-vinh-long', 'Vĩnh Long'],
];

/**
 * photo-library.ts sets named after one place, with the place name used in alt text. The photos were picked by
 * searching that name and are not individually confirmed as taken there (docs/design/image-credits.md).
 */
const PHOTO_PLACES = {
  halong: 'Hạ Long', hoian: 'Hội An', danang: 'Đà Nẵng', phuquoc: 'Phú Quốc', nhatrang: 'Nha Trang',
  dalat: 'Đà Lạt', sapa: 'Sa Pa', hue: 'Huế', hanoi: 'Hà Nội', saigon: 'TP. Hồ Chí Minh', ninhbinh: 'Ninh Bình',
};
const MAX_PHOTOS = 5;

/** Mirrors the home "Sắp khởi hành" request (frontend services/tours.ts) and the "few seats" rule. */
const HOME_STRIP = { days: 14, limit: 8, fewSeats: 5 };

module.exports = {
  TODAY, WINDOW_START, WINDOW_END, TIERS, BRANCH_ORIGIN, ORIGIN_NAME, NEW_LOCATIONS, PHOTO_PLACES, MAX_PHOTOS,
  HOME_STRIP,
};
