/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const phoneVn = loadTs('src/lib/phone-vn.ts');
const form = loadTs('src/lib/service-request-form.ts', { '@/lib/phone-vn': phoneVn }, { Date });
const types = loadTs('src/types/service-request.ts');
const admin = loadTs('src/lib/service-request-admin.ts', {
  '@/lib/service-request-form': form,
  '@/types/service-request': types,
});

const read = query => plain(admin.readFilter(new URLSearchParams(query)));

test('details become Vietnamese label/value lines in form order', () => {
  const lines = plain(admin.describeDetails('car_rental', {
    vehicleSeats: 16, passengers: 12, departDate: '2026-12-01', returnDate: '2026-12-03',
    pickupPlace: 'Sân bay Tân Sơn Nhất', dropoffPlace: 'Phan Thiết', airportTransfer: 'both',
  }));
  assert.deepEqual(lines, [
    { label: 'Loại xe', value: 'Xe 16 chỗ' },
    { label: 'Số khách', value: '12' },
    { label: 'Ngày đi', value: '01/12/2026' },
    { label: 'Ngày về', value: '03/12/2026' },
    { label: 'Điểm đón', value: 'Sân bay Tân Sơn Nhất' },
    { label: 'Điểm đến', value: 'Phan Thiết' },
    { label: 'Đón/tiễn sân bay', value: 'Cả đón và tiễn' },
  ]);
});

test('choice codes of every service get their Vietnamese label', () => {
  assert.deepEqual(plain(admin.describeDetails('visa',
    { country: 'Nhật Bản', visaType: 'family', travelDate: '2027-03-10', applicants: 2 })), [
    { label: 'Quốc gia', value: 'Nhật Bản' },
    { label: 'Loại visa', value: 'Thăm thân' },
    { label: 'Ngày dự kiến đi', value: '10/03/2027' },
    { label: 'Số người', value: '2' },
  ]);
  const group = plain(admin.describeDetails('group_tour', { companyName: 'Công ty ABC', groupSize: 80,
    startDate: '2027-04-01', endDate: '2027-04-03', budget: '5m_10m', programType: 'incentive' }));
  assert.deepEqual(group.slice(-2), [
    { label: 'Ngân sách dự kiến', value: '5–10 triệu/người' },
    { label: 'Loại chương trình', value: 'Du lịch khen thưởng' },
  ]);
});

test('unknown keys, nested values and unknown services are never printed raw', () => {
  const lines = plain(admin.describeDetails('attraction_tickets', {
    destination: 'Huế', visitDate: '2026-12-24', adults: 2, children: 0,
    passportNumber: 'B1234567', extra: { nested: true },
  }));
  assert.deepEqual(lines.map(l => l.label), ['Điểm đến / khu vui chơi', 'Ngày dự kiến', 'Số người lớn', 'Số trẻ em']);
  assert.ok(!JSON.stringify(lines).includes('B1234567'));
  assert.deepEqual(plain(admin.describeDetails('attraction_tickets', { destination: { x: 1 }, adults: null })), []);
  assert.deepEqual(plain(admin.describeDetails('esim', { country: 'Nhật' })), []);
});

test('status labels and tones', () => {
  assert.deepEqual(plain(admin.statusMeta('new')), { label: 'Mới', tone: 'warning' });
  assert.deepEqual(plain(admin.statusMeta('contacted')), { label: 'Đã liên hệ', tone: 'info' });
  assert.deepEqual(plain(admin.statusMeta('closed')), { label: 'Đã đóng', tone: 'neutral' });
  assert.equal(admin.statusMeta('weird').label, 'weird');
});

test('filter is read from the URL, ignoring unknown or malformed values', () => {
  assert.deepEqual(read('q=%20an%20&loai=visa&trang-thai=new&trang=3'),
    { q: 'an', serviceType: 'visa', status: 'new', page: 3 });
  assert.deepEqual(read(''), plain(admin.EMPTY_FILTER));
  assert.deepEqual(read('loai=esim&trang-thai=deleted&trang=-2'), plain(admin.EMPTY_FILTER));
  assert.equal(read('trang=1.5').page, 1);
  assert.equal(read('trang=abc').page, 1);
  assert.equal(read('q=' + 'x'.repeat(150)).q.length, admin.MAX_QUERY_LENGTH);
});

test('filter is written back to a short URL and survives a round trip', () => {
  assert.equal(admin.writeFilter(admin.EMPTY_FILTER), '');
  const filter = { q: 'Nguyễn', serviceType: 'car_rental', status: 'contacted', page: 2 };
  const query = admin.writeFilter(filter);
  assert.equal(query, '?q=Nguy%E1%BB%85n&loai=car_rental&trang-thai=contacted&trang=2');
  assert.deepEqual(read(query.slice(1)), filter);
  assert.equal(admin.writeFilter({ ...admin.EMPTY_FILTER, page: 1, q: '  ' }), '');
});

test('changing a filter goes back to page 1; the API query always sends page and size', () => {
  const filter = { q: '', serviceType: 'visa', status: '', page: 4 };
  assert.deepEqual(plain(admin.changeFilter(filter, { status: 'new' })),
    { q: '', serviceType: 'visa', status: 'new', page: 1 });
  assert.equal(admin.hasActiveFilter(admin.EMPTY_FILTER), false);
  assert.equal(admin.hasActiveFilter(filter), true);
  assert.equal(admin.apiQuery(filter), '?serviceType=visa&page=4&pageSize=20');
  assert.equal(admin.pageCount(0), 1);
  assert.equal(admin.pageCount(41), 3);
});
