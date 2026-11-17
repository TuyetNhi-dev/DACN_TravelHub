/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function catalog({ hotels = async () => [], flights = async () => [] } = {}) {
  const exports = {};
  const source = ts.transpileModule(readFileSync('src/services/home-catalog.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const dependencies = {
    '@/services/hotels': { getHotels: hotels },
    '@/services/flights': { getUpcomingFlights: flights },
  };
  vm.runInNewContext(source, { exports, require: name => {
    if (!(name in dependencies)) throw Error('Unexpected dependency: ' + name);
    return dependencies[name];
  } });
  return exports;
}

const hotel = (id, price) => ({ id, name: 'KS ' + id, city: 'Huế', address: null, starRating: 4, description: null,
  referencePricePerNight: price });
const flight = (offerId, from, to, price) => ({
  offerId, originCode: from, destinationCode: to, referencePrice: price,
});

test('home hotels keep only priced partner quotes, at most four', async () => {
  const { getHomeHotels } = catalog({ hotels: async () => [hotel('1', null), ...['2', '3', '4', '5', '6']
    .map(id => hotel(id, 900000))] });
  const items = await getHomeHotels();
  assert.deepEqual(items.map(item => item.id), ['2', '3', '4', '5']);
  assert.equal(items.some(item => 'availability' in item), false);
});

test('home flights show the cheapest fare per route', async () => {
  const { getHomeFlights } = catalog({ flights: async () => [
    flight('a', 'SGN', 'HAN', 2000000), flight('b', 'SGN', 'HAN', 1500000), flight('c', 'HAN', 'SGN', 1800000),
  ] });
  const items = await getHomeFlights();
  // Array.from copies into this realm; arrays built inside vm have a different prototype.
  assert.deepEqual(Array.from(items, item => item.offerId), ['b', 'c']);
});

test('empty catalogues stay empty and failures propagate', async () => {
  assert.equal((await catalog().getHomeHotels()).length, 0);
  assert.equal((await catalog().getHomeFlights()).length, 0);
  await assert.rejects(catalog({ hotels: async () => { throw Error('offline'); } }).getHomeHotels(), /offline/);
});
