/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const phoneVn = loadTs('src/lib/phone-vn.ts');
const form = loadTs('src/lib/service-request-form.ts', { '@/lib/phone-vn': phoneVn }, { Date });
const TODAY = '2026-11-20';

const contact = { fullName: 'Nguyễn Văn A', phone: '0903 123 456', email: '', note: '', website: '' };
const withDetails = (type, details) => {
  const values = { ...plain(form.initialValues(type)), ...contact };
  for (const [key, value] of Object.entries(details)) values[`details.${key}`] = value;
  return values;
};
const errorsOf = (type, values, consent = true) => plain(form.validateForm(type, values, consent, TODAY));

test('choices and limits mirror the server', () => {
  assert.deepEqual(plain(form.VEHICLE_OPTIONS.map(o => o.value)), ['4', '7', '16', '29', '45']);
  assert.deepEqual(plain(form.AIRPORT_OPTIONS.map(o => o.value)), ['none', 'pickup', 'dropoff', 'both']);
  assert.deepEqual(plain(form.VISA_OPTIONS.map(o => o.value)), ['tourist', 'business', 'family']);
  assert.deepEqual(plain(form.BUDGET_OPTIONS.map(o => o.value)), ['under_3m', '3m_5m', '5m_10m', 'over_10m']);
  assert.deepEqual(plain(form.PROGRAM_OPTIONS.map(o => o.value)), ['team_building', 'conference', 'incentive', 'custom']);
  assert.equal(form.LIMITS.maxNote, 1000);
});

test('an empty form reports every required field with the server keys and messages', () => {
  const values = plain(form.initialValues('attraction_tickets'));
  assert.equal(values['details.children'], '0');
  const errors = errorsOf('attraction_tickets', values, false);
  assert.deepEqual(Object.keys(errors).sort(), [
    'consent', 'details.adults', 'details.destination', 'details.visitDate', 'fullName', 'phone',
  ]);
  assert.equal(errors.phone, 'Số điện thoại chưa đúng định dạng Việt Nam, ví dụ 0912 345 678 hoặc 028 3812 3456.');
  assert.equal(errors['details.adults'], 'Số người lớn từ 1 đến 50.');
  assert.equal(errors['details.visitDate'], 'Ngày phải từ hôm nay trở đi và trong vòng 2 năm.');
});

test('valid requests for every service pass', () => {
  assert.equal(form.DETAIL_FIELDS.esim, undefined, 'eSIM was dropped: domestic travel only');
  const cases = {
    attraction_tickets: { destination: 'Đà Nẵng', visitDate: TODAY, adults: '2', children: '' },
    car_rental: { vehicleSeats: '7', passengers: '6', departDate: '2026-12-01', returnDate: '2026-12-01',
      pickupPlace: 'Quận 1', dropoffPlace: 'Vũng Tàu' },
    visa: { country: 'Nhật Bản', visaType: 'tourist', travelDate: '2027-03-01', applicants: '1' },
    group_tour: { companyName: 'Công ty ABC', groupSize: '10', startDate: '2027-04-01', endDate: '2027-05-01',
      budget: '3m_5m', programType: 'custom' },
  };
  for (const [type, details] of Object.entries(cases)) {
    assert.deepEqual(errorsOf(type, withDetails(type, details)), {}, type);
  }
});

test('contact rules: Vietnamese phone with separators, optional email, note length', () => {
  const values = withDetails('visa', { country: 'Úc', visaType: 'tourist', travelDate: '2027-01-10', applicants: '1' });
  assert.equal(form.buildPayload('visa', { ...values, phone: ' (090) 312-34.56 ' }, true).phone, '0903123456');
  assert.deepEqual(Object.keys(errorsOf('visa', { ...values, phone: '+1 415 555 0100' })), ['phone']);
  assert.deepEqual(Object.keys(errorsOf('visa', { ...values, phone: '12ab', email: 'khach@', note: 'x'.repeat(1001) })).sort(),
    ['email', 'note', 'phone']);
  assert.deepEqual(errorsOf('visa', { ...values, phone: '+84903123456', email: 'khach@example.com' }), {});
});

test('car rental: seats include the driver, return date within 60 days', () => {
  const base = { vehicleSeats: '4', passengers: '4', departDate: '2026-12-05', returnDate: '2026-12-04',
    pickupPlace: 'Quận 1', dropoffPlace: 'Đà Lạt' };
  const errors = errorsOf('car_rental', withDetails('car_rental', base));
  assert.equal(errors['details.passengers'], 'Số khách từ 1 đến 3.');
  assert.equal(errors['details.returnDate'], 'Ngày về phải từ ngày đi trở đi, tối đa 60 ngày.');
  assert.ok(errorsOf('car_rental', withDetails('car_rental', { ...base, passengers: '3', returnDate: '2027-02-04' }))
    ['details.returnDate']);
  assert.deepEqual(errorsOf('car_rental', withDetails('car_rental', { ...base, passengers: '3', returnDate: '2027-02-03' })), {});
});

test('dates: from today up to two years ahead, real calendar days only', () => {
  const at = visitDate => errorsOf('attraction_tickets',
    withDetails('attraction_tickets', { destination: 'Huế', visitDate, adults: '1' }))['details.visitDate'];
  assert.equal(at(TODAY), undefined);
  assert.ok(at('2026-11-19'));
  assert.equal(at('2028-11-19'), undefined);
  assert.ok(at('2028-11-20'));
  assert.ok(at('2027-02-30'));
});

test('group tour: at least 10 people, end within 30 days of start', () => {
  const errors = errorsOf('group_tour', withDetails('group_tour', { companyName: 'X', groupSize: '9',
    startDate: '2027-04-01', endDate: '2027-05-02', budget: 'free', programType: '' }));
  assert.deepEqual(Object.keys(errors).sort(), ['details.budget', 'details.companyName', 'details.endDate',
    'details.groupSize', 'details.programType']);
});

test('payload carries only the chosen service fields, numbers as numbers', () => {
  const values = withDetails('car_rental', { vehicleSeats: '16', passengers: '12', departDate: '2026-12-01',
    returnDate: '2026-12-02', pickupPlace: ' Sân bay ', dropoffPlace: 'Phan Thiết' });
  values.website = 'bot';
  values.note = '  ';
  const payload = plain(form.buildPayload('car_rental', values, true));
  assert.deepEqual(payload, {
    serviceType: 'car_rental', fullName: 'Nguyễn Văn A', phone: '0903123456', email: null, note: null,
    consent: true, website: 'bot',
    details: { vehicleSeats: 16, passengers: 12, departDate: '2026-12-01', returnDate: '2026-12-02',
      pickupPlace: 'Sân bay', dropoffPlace: 'Phan Thiết', airportTransfer: 'none' },
  });
  const attraction = plain(form.buildPayload('attraction_tickets',
    withDetails('attraction_tickets', { destination: 'Huế', visitDate: TODAY, adults: '2', children: '' }), true));
  assert.deepEqual(Object.keys(attraction.details), ['destination', 'visitDate', 'adults']);
});

test('a 429 gets the dedicated rate-limit message', () => {
  assert.equal(form.submitErrorMessage({ status: 429, message: 'x' }), 'Bạn gửi quá nhiều yêu cầu, thử lại sau ít phút.');
  assert.equal(form.submitErrorMessage({ status: 400, message: 'Email không hợp lệ.' }), 'Email không hợp lệ.');
});
