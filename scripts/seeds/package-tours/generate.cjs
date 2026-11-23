/*
 * Writes database/seeds/010_vietnam_package_tours.sql (simulated package tours). Only writes the file: it never
 * connects to a database. Run from the repo root after `npm --prefix frontend install` (needs TypeScript to read
 * vn-holidays.ts and photo-library.ts):
 *   node scripts/seeds/package-tours/generate.cjs
 * The output is deterministic: running it twice gives the same file.
 */
const fs = require('node:fs');
const path = require('node:path');
const { TIERS, BRANCH_ORIGIN } = require('./config.cjs');
const { holidayDates, departures, markNearlyFullPerDate } = require('./schedule.cjs');
const { inclusions, photos } = require('./content.cjs');
const { header, tourBlock } = require('./sql.cjs');
const { checkHomeStrip } = require('./check-home-strip.cjs');

const REPO = path.resolve(__dirname, '../../..');
const OUTPUT = path.join(REPO, 'database/seeds/010_vietnam_package_tours.sql');
const EXPECTED_TOURS = 60;
const tours = ['north', 'central', 'south'].flatMap(region => require(`./data/tours-${region}.cjs`));

function loadFrontend() {
  const { loadTs } = require(path.join(REPO, 'frontend/tests/load-ts.cjs'));
  const source = file => path.join(REPO, 'frontend/src', file);
  const lunar = loadTs(source('lib/lunar-calendar.ts'));
  return {
    holidays: loadTs(source('lib/vn-holidays.ts'), { '@/lib/lunar-calendar': lunar }),
    photoLibrary: loadTs(source('data/photo-library.ts')).photoLibrary,
  };
}

function validateTour(tour) {
  const fail = reason => { throw Error(`${tour.code}: ${reason}`); };
  if (!/^SH-(MB|MT|MN)-\d{3}$/.test(tour.code)) fail('code must look like SH-MB-001');
  if (tour.itinerary.length !== tour.days) fail(`${tour.itinerary.length} itinerary days for ${tour.days} days`);
  if (tour.nights !== Math.max(0, tour.days - 1)) fail('nights must be days - 1');
  if (!TIERS[tour.tier] || !BRANCH_ORIGIN[tour.branch]) fail('unknown tier or branch');
  if (!/Kết thúc chương trình\.$/.test(tour.itinerary.at(-1)[1])) fail('last day must end the programme');
  if (tour.itinerary.some(([title, text]) => title.length > 255 || text.includes('...'))) fail('itinerary text');
}

function validateTours() {
  tours.forEach(validateTour);
  const codes = new Set(tours.map(tour => tour.code));
  if (codes.size !== tours.length) throw Error('Duplicate tour codes');
  if (tours.length !== EXPECTED_TOURS) throw Error(`Expected ${EXPECTED_TOURS} tours, got ${tours.length}`);
}

function validateSeats(code, rows) {
  for (const row of rows) {
    if (row.reserved < 0 || row.reserved >= row.capacity) throw Error(`${code} ${row.dep}: seats`);
    if (row.minGuests > row.capacity || row.capacity < 15 || row.capacity > 40) throw Error(`${code}: capacity`);
  }
}

function count(values) {
  return values.reduce((all, value) => ({ ...all, [value]: (all[value] ?? 0) + 1 }), {});
}

function summary(allRows, photoCount) {
  return {
    tours: tours.length,
    region: count(tours.map(tour => tour.code.slice(3, 5))),
    branch: count(tours.map(tour => tour.branch)),
    tier: count(tours.map(tour => TIERS[tour.tier].name)),
    departures: allRows.flat().length,
    tetDepartures: allRows.flat().filter(row => row.label === 'tet').length,
    nearlyFull: allRows.flat().filter(row => row.nearlyFull).length,
    photos: photoCount,
  };
}

function main() {
  validateTours();
  const { holidays, photoLibrary } = loadFrontend();
  const holiday = holidayDates(holidays);
  const allRows = tours.map((tour, index) => departures(tour, index, holiday));
  markNearlyFullPerDate(allRows.flat());
  let photoCount = 0;
  const blocks = tours.map((tour, index) => {
    validateSeats(tour.code, allRows[index]);
    const imgs = photos(tour, index, photoLibrary);
    photoCount += imgs.length;
    return tourBlock(tour, allRows[index], inclusions(tour), imgs) + '\n';
  });
  fs.writeFileSync(OUTPUT, header(holiday) + blocks.join('') + 'COMMIT;\n', 'utf8');
  const strip = checkHomeStrip(REPO, allRows.flat());
  if (strip[0]) throw Error(`${strip[0]} demo day(s) would show no "Còn N chỗ" card`);
  console.log(JSON.stringify({ ...summary(allRows, photoCount), homeStripWarningsPerDay: strip }, null, 1));
  console.log('Đã ghi ' + path.relative(REPO, OUTPUT));
}

main();
