/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness evaluates the TypeScript adapter with an isolated API stub. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function catalog(apiGet) {
  const exports = {};
  const source = ts.transpileModule(readFileSync('src/services/home-catalog.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { exports, require: () => ({ apiGet, ApiError: Error }) });
  return exports;
}
test('hotel endpoint preserves unknown prices without inventing availability', async () => {
  let path;
  const { getHomeCatalog } = catalog(async p => {
    path = p;
    return { data: [{ hotelId: 'H1', tenKhachSan: 'Hotel', thanhPho: 'Huế', giaTuVndDem: null, ghiChu: 'Demo' }] };
  });
  const items = await getHomeCatalog('hotel');
  assert.equal(path, '/api/hotels');
  assert.equal(items[0].price, null);
  assert.equal(items[0].note, 'Demo');
  assert.equal('availability' in items[0], false);
});
test('flight endpoint preserves exact API date and price', async () => {
  const { getHomeCatalog } = catalog(async path => {
    assert.equal(path, '/api/flights');
    return { data: [{ flightId: 'F1', hangBayThamKhao: 'Demo', noiDi: 'Hà Nội', noiDen: 'Huế', ngayBay: '2026-12-01', giaVnd: 0, ghiChu: null }] };
  });
  const [flight] = await getHomeCatalog('flight');
  assert.equal(flight.date, '2026-12-01');
  assert.equal(flight.price, 0);
});
test('empty API stays empty; network failures propagate', async () => {
  assert.equal((await catalog(async () => ({ data: [] })).getHomeCatalog('hotel')).length, 0);
  await assert.rejects(catalog(async () => { throw Error('offline'); }).getHomeCatalog('hotel'), /offline/);
});
test('rejects malformed records and invalid prices', async () => {
  for (const response of [null, { data: {} }, { data: [null] }, { data: [{ hotelId: 'H1', tenKhachSan: null, thanhPho: null, giaTuVndDem: -1, ghiChu: null }] }]) {
    await assert.rejects(catalog(async () => response).getHomeCatalog('hotel'));
  }
});
