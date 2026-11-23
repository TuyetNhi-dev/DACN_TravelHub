/* Calendar-day helpers on "yyyy-mm-dd" strings (UTC midnight, so no time zone shifts) and a seeded RNG. */

const toDate = iso => new Date(iso + 'T00:00:00Z');
const isoDay = date => date.toISOString().slice(0, 10);

function addDays(iso, days) {
  const date = toDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDay(date);
}

const daysBetween = (from, to) => Math.round((toDate(to) - toDate(from)) / 86400000);
const weekday = iso => toDate(iso).getUTCDay();

/** mulberry32: the same seed always gives the same sequence, so the SQL is reproducible. */
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

module.exports = { addDays, daysBetween, weekday, seededRandom };
