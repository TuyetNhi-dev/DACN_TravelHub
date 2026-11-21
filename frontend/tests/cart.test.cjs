/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

class ApiError extends Error {}
const format = loadTs('src/lib/format.ts');
const rules = loadTs('src/lib/cart-rules.ts', { '@/lib/format': format });
const decode = loadTs('src/lib/decode.ts', { '@/lib/api-client': { ApiError } });
const service = api => loadTs('src/services/cart.ts', { '@/lib/api-client': api, '@/lib/decode': decode });

const NOW = new Date('2026-11-21T03:00:00Z');
const line = (departureId, extra = {}) => ({
  departureId, adultCount: 2, childCount: 0, adultPriceSeen: 4_590_000, childPriceSeen: null,
  updatedAt: NOW.toISOString(), ...extra,
});
const item = (extra = {}) => ({
  id: '5', departureId: '100', tourId: '1', tourCode: 'TOUR001', tourTitle: 'Đà Nẵng – Hội An', destination: 'Đà Nẵng',
  imageUrl: null, imageAlt: null, departureFrom: 'TP. Hồ Chí Minh', departureDate: '2026-12-04',
  returnDate: '2026-12-07', adultCount: 2, childCount: 1, adultPrice: 4_590_000, childPrice: 3_290_000,
  adultPriceSeen: 4_590_000, childPriceSeen: 3_290_000, availableSeats: 12, status: 'ok', subtotal: 12_470_000,
  updatedAt: '2026-11-21T03:00:00Z', ...extra,
});

test('guest cart storage: corrupt JSON, wrong shapes and invalid lines read as nothing', () => {
  assert.deepEqual(plain(rules.parseGuestCart(null)), []);
  assert.deepEqual(plain(rules.parseGuestCart('{not json')), []);
  assert.deepEqual(plain(rules.parseGuestCart('{"a":1}')), []);
  const stored = JSON.stringify([
    line('100'), line('abc'), line('101', { adultCount: 0 }), line('102', { adultCount: 15, childCount: 6 }),
    line('103', { adultPriceSeen: -1 }), line('104', { updatedAt: 'yesterday' }), line('105', { childCount: 1.5 }),
  ]);
  assert.deepEqual(plain(rules.parseGuestCart(stored)).map(entry => entry.departureId), ['100']);
});

test('adding a departure already in the cart replaces it on top; an 11th new line is refused', () => {
  const lines = ['1', '2', '3'].map(id => line(id));
  const again = rules.addGuestLine(lines, line('2', { adultCount: 4 }));
  assert.deepEqual(plain(again.lines).map(entry => [entry.departureId, entry.adultCount]),
    [['2', 4], ['1', 2], ['3', 2]]);

  const full = Array.from({ length: rules.MAX_CART_ITEMS }, (_, index) => line(String(index + 1)));
  assert.equal(rules.addGuestLine(full, line('99')).error, rules.CART_FULL_MESSAGE);
  assert.equal(rules.addGuestLine(full, line('3', { adultCount: 5 })).lines.length, rules.MAX_CART_ITEMS);
  assert.deepEqual(plain(rules.removeGuestLine(lines, '2')).map(entry => entry.departureId), ['1', '3']);
});

// Intl puts a no-break space before ₫; compare the words, not the kind of space.
const spaced = text => text.replace(/\s/g, ' ');

test('warnings say exactly what changed', () => {
  assert.equal(rules.cartWarning(item()), null);
  assert.equal(spaced(rules.cartWarning(item({ status: 'price_changed', adultPrice: 4_790_000 }))),
    'Giá người lớn đã tăng từ 4.590.000 ₫ lên 4.790.000 ₫.');
  assert.equal(spaced(rules.cartWarning(item({ status: 'price_changed', adultPrice: 4_290_000 }))),
    'Giá người lớn đã giảm từ 4.590.000 ₫ xuống 4.290.000 ₫.');
  assert.match(rules.cartWarning(item({ status: 'price_changed', childPrice: 2_990_000 })), /Giá trẻ em/);
  assert.equal(rules.cartWarning(item({ status: 'not_enough_seats', availableSeats: 2 })),
    'Chỉ còn 2 chỗ, ít hơn 3 khách bạn chọn.');
  assert.match(rules.cartWarning(item({ status: 'sold_out' })), /hết chỗ/);
  assert.match(rules.cartWarning(item({ status: 'unavailable' })), /không còn nhận khách/);
  assert.equal(rules.canBook('price_changed'), true);
  assert.equal(rules.canBook('sold_out'), false);
});

test('"Đặt ngay" link pre-fills the tour page, and the tour page reads it back safely', () => {
  const href = rules.bookingHref(item());
  assert.equal(href, '/tours/1?departure=100&adults=2&children=1#tour-booking');
  const query = Object.fromEntries(new URLSearchParams(href.split('?')[1].split('#')[0]));
  assert.deepEqual(plain(rules.parseBookingPrefill(query)), { departureId: '100', adultCount: 2, childCount: 1 });
  assert.deepEqual(plain(rules.parseBookingPrefill({ departure: '1 OR 1=1', adults: '0', children: '-2' })), {});
  assert.deepEqual(plain(rules.parseBookingPrefill({ adults: '15', children: '9' })), { adultCount: 15 });
});

test('cart responses are decoded strictly, including the merge result', async () => {
  const cart = { items: [item()], estimatedTotal: 12_470_000, maxItems: 10 };
  const api = {
    apiGet: async () => ({ data: cart }),
    apiPost: async path => (path === '/api/cart/merge' ? { data: { cart, notMoved: 2 } } : { data: cart }),
    apiDelete: async () => ({ data: { ...cart, items: [] } }),
  };
  const cartService = service(api);
  assert.equal((await cartService.getCart()).items[0].status, 'ok');
  assert.equal((await cartService.mergeGuestCart([line('100')])).notMoved, 2);
  assert.equal((await cartService.deleteCartItem('5')).items.length, 0);
  const broken = service({ ...api, apiGet: async () => ({ data: { ...cart, items: [item({ status: 'gone' })] } }) });
  await assert.rejects(broken.getCart(), ApiError);
});

test('removing a line calls DELETE /api/cart/items/{id} with the id encoded', async () => {
  const calls = [];
  const cartService = service({
    apiGet: async () => null, apiPost: async () => null,
    apiDelete: async path => { calls.push(path); return { data: { items: [], estimatedTotal: 0, maxItems: 10 } }; },
  });
  await cartService.deleteCartItem('12');
  assert.deepEqual(calls, ['/api/cart/items/12']);
});

test('guest storage helpers survive a browser that blocks localStorage', () => {
  const blocked = { localStorage: { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); },
    removeItem() { throw Error('blocked'); } } };
  const storage = loadTs('src/lib/guest-cart.ts', { '@/lib/cart-rules': rules }, { window: blocked });
  assert.deepEqual(plain(storage.readGuestCart()), []);
  assert.equal(storage.writeGuestCart([line('100')]), false);

  const memory = new Map();
  const working = { localStorage: {
    getItem: key => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value),
    removeItem: key => memory.delete(key),
  } };
  const saved = loadTs('src/lib/guest-cart.ts', { '@/lib/cart-rules': rules }, { window: working });
  assert.equal(saved.writeGuestCart([line('100')]), true);
  assert.deepEqual(plain(saved.readGuestCart()).map(entry => entry.departureId), ['100']);
  assert.equal(saved.writeGuestCart([]), true);
  assert.equal(memory.size, 0);
});
