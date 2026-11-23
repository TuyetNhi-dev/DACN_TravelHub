/*
 * Replays GET /api/tours/departures/upcoming (ORDER BY departure_date, id LIMIT 8; open, after today, seats left)
 * over seeds 002 + 005 + 010 for every possible demo day, and reports how many "Còn N chỗ" cards it would show.
 * Assumes those seeds are the only departures, every tour is published and no real booking exists yet.
 */
const fs = require('node:fs');
const path = require('node:path');
const { HOME_STRIP, TODAY, WINDOW_END } = require('./config.cjs');
const { addDays } = require('./dates.cjs');

const SEED_002 = /^\s+\(\d+, \d+, \d+, '([\d-]+)', '[\d-]+', (\d+), (\d+), [^\n]*'(open|closed|cancelled)'\)/gm;
const SEED_005 = /\(@tour, \d+, '([\d-]+)', '[\d-]+', (\d+), (\d+), \d+, \d+, '(\w+)'\)/g;

function readSeed(repo, file, pattern) {
  const text = fs.readFileSync(path.join(repo, 'database/seeds', file), 'utf8');
  return [...text.matchAll(pattern)].map(m => ({ dep: m[1], capacity: +m[2], reserved: +m[3], status: m[4] }));
}

/** Departures in id order: seeds run 002 → 005 → 010, so later files get larger ids. */
function allDepartures(repo, seed010Rows) {
  return [
    ...readSeed(repo, '002_demo_catalog.sql', SEED_002),
    ...readSeed(repo, '005_seasonal_tours.sql', SEED_005),
    ...seed010Rows.map(row => ({ dep: row.dep, capacity: row.capacity, reserved: row.reserved, status: 'open' })),
  ].map((row, order) => ({ ...row, order }));
}

function stripOn(today, rows) {
  const until = addDays(today, HOME_STRIP.days);
  return rows
    .filter(r => r.status === 'open' && r.dep > today && r.dep <= until && r.reserved < r.capacity)
    .sort((a, b) => (a.dep < b.dep ? -1 : a.dep > b.dep ? 1 : a.order - b.order))
    .slice(0, HOME_STRIP.limit);
}

/** { cardsWithWarning: numberOfDays } for every demo day from TODAY to the day before the last departure. */
function checkHomeStrip(repo, seed010Rows) {
  const rows = allDepartures(repo, seed010Rows);
  const histogram = {};
  for (let day = TODAY; day < WINDOW_END; day = addDays(day, 1)) {
    const few = stripOn(day, rows).filter(r => r.capacity - r.reserved <= HOME_STRIP.fewSeats).length;
    histogram[few] = (histogram[few] ?? 0) + 1;
  }
  return histogram;
}

module.exports = { checkHomeStrip };
