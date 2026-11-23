/* Departure dates, seasonal prices and simulated sold seats. */
const { TODAY, WINDOW_START, WINDOW_END, TIERS } = require('./config.cjs');
const { addDays, daysBetween, weekday, seededRandom } = require('./dates.cjs');

/** Tết Đinh Mùi (Tất niên → mùng 3) and Tết Dương lịch, read from frontend/src/lib/vn-holidays.ts. */
function holidayDates(holidays) {
  const found = holidays.holidaysBetween(WINDOW_START, addDays(WINDOW_END, 7));
  const tet = found
    .filter(h => h.kind === 'official' && (h.name.startsWith('Tết Nguyên Đán') || h.name.startsWith('Tất niên')))
    .map(h => h.date).sort();
  const newYear = found.find(h => h.name === 'Tết Dương lịch')?.date;
  if (tet.length !== 4 || newYear !== '2027-01-01') throw Error('Unexpected holidays: ' + tet.join(', '));
  return { tetDays: tet, tetStart: tet[0], tetEnd: tet[tet.length - 1], newYear };
}

/** Price multiplier and label of a trip [departure, return]; the first matching rule wins. */
function season(dep, ret, holiday) {
  const covers = day => dep <= day && day <= ret;
  if (holiday.tetDays.some(covers)) return [1.30, 'tet'];
  if (dep > holiday.tetEnd && dep <= addDays(holiday.tetEnd, 6)) return [1.15, 'after-tet'];
  if (dep >= addDays(holiday.tetStart, -7) && dep < holiday.tetStart) return [1.10, 'before-tet'];
  if (covers(holiday.newYear)) return [1.12, 'new-year'];
  if (dep >= '2026-12-20' && dep <= '2026-12-31') return [1.08, 'year-end'];
  if (dep >= '2027-01-02' && dep <= '2027-01-28') return [0.95, 'low'];
  return [1.00, 'normal'];
}

/** 3.287.500 → 3.290.000: prices end in 90.000 like a printed brochure. */
const marketPrice = value => Math.max(1, Math.round(value / 100000)) * 100000 - 10000;
const childPrice = adult => Math.round(adult * 0.75 / 10000) * 10000;

function basePrice(tour) {
  const tier = TIERS[tour.tier];
  const land = tour.days === 1 ? tier.dayTour : tier.perDay * tour.days;
  return land + (tour.transport.includes('may-bay') ? tier.flight : 0);
}

/** Weekly for 1–2 day tours, every 2 weeks up to 4 days, every 3 weeks beyond; staggered by tour index. */
function departureDates(tour, index) {
  const every = tour.days <= 2 ? 7 : tour.days <= 4 ? 14 : 21;
  let first = WINDOW_START;
  while (weekday(first) !== tour.dow) first = addDays(first, 1);
  first = addDays(first, 7 * (index % (every / 7)));
  const dates = [];
  for (let day = first; day <= WINDOW_END; day = addDays(day, every)) dates.push(day);
  return dates;
}

/** Share of seats already sold: higher near departure and over Tết. */
function soldShare(label, dep) {
  const ahead = daysBetween(TODAY, dep);
  if (label === 'tet') return [0.5, 0.8];
  if (ahead <= 14) return [0.35, 0.7];
  return ahead <= 35 ? [0.15, 0.5] : [0, 0.3];
}

function departures(tour, index, holiday) {
  const tier = TIERS[tour.tier];
  const random = seededRandom(index * 7919 + 17);
  const capacity = tier.capacities[Math.floor(random() * tier.capacities.length)];
  const base = basePrice(tour);
  return departureDates(tour, index).map(dep => {
    const ret = addDays(dep, tour.days - 1);
    const [factor, label] = season(dep, ret, holiday);
    const [low, high] = soldShare(label, dep);
    // Ordinary departures keep at least 6 seats so only the marked ones trigger the "Còn N chỗ" warning.
    const reserved = Math.min(capacity - 6, Math.floor(capacity * (low + random() * (high - low))));
    const adult = marketPrice(base * factor);
    return { dep, ret, capacity, minGuests: Math.min(tier.minGuests, capacity), reserved, adult,
      child: childPrice(adult), label, nearlyFull: false };
  });
}

/**
 * The home "Sắp khởi hành" strip lists the 8 soonest bookable departures, ties broken by id. Making the FIRST
 * departure inserted for every date nearly full guarantees a "Còn N chỗ" card whatever day the demo runs on.
 */
function markNearlyFullPerDate(rows) {
  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.dep)) continue;
    seen.add(row.dep);
    const random = seededRandom(Number(row.dep.replace(/-/g, '')));
    row.reserved = row.capacity - (1 + Math.floor(random() * 4));
    row.nearlyFull = true;
  }
}

module.exports = { holidayDates, departures, markNearlyFullPerDate };
