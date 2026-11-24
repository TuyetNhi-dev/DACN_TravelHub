/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const tours = loadTs('src/lib/admin-tours.ts');
const forms = loadTs('src/lib/admin-forms.ts');

test('status actions offer every settable status except the current one, and none for an archived tour', () => {
  const statuses = status => plain(tours.statusActionsFor(status)).map(action => action.status);
  assert.deepEqual(statuses('draft'), ['published', 'paused']);
  assert.deepEqual(statuses('published'), ['paused', 'draft']);
  assert.deepEqual(statuses('paused'), ['published', 'draft']);
  assert.deepEqual(statuses('archived'), []);
});

test('branch select keeps manageable branches plus the tour\'s current one', () => {
  const branches = [
    { id: '1', name: 'Hà Nội', canManage: true }, { id: '2', name: 'Đà Nẵng', canManage: false },
    { id: '3', name: 'Cần Thơ', canManage: false },
  ];
  assert.deepEqual(plain(tours.branchOptions(branches)).map(b => b.id), ['1']);
  assert.deepEqual(plain(tours.branchOptions(branches, '3')).map(b => b.id), ['1', '3']);
});

test('page count follows the server page size and never drops below one', () => {
  assert.equal(tours.pageCountOf(0), 1);
  assert.equal(tours.pageCountOf(20), 1);
  assert.equal(tours.pageCountOf(21), 2);
  assert.equal(tours.tourEditHref('12'), '/admin/tours/12');
});

test('tour form round-trips a tour and sends trimmed, typed values', () => {
  const tour = {
    id: '7', code: 'SH-MB-001', title: 'Hà Nội một ngày', destinationId: '8', categoryId: null, branchId: '1',
    durationDays: 1, durationNights: 0, basePrice: 590000, description: null, status: 'draft',
    cancellationPolicy: 'Hủy trước 7 ngày hoàn 100%.', travelNotes: null,
  };
  const form = forms.tourFormFrom(tour);
  assert.equal(form.categoryId, '');
  assert.equal(form.basePrice, '590000');
  assert.equal(form.cancellationPolicy, 'Hủy trước 7 ngày hoàn 100%.');
  assert.equal(form.travelNotes, '');
  const edited = {
    ...form, code: ' sh-mb-002 ', basePrice: '1.290.000', description: ' ',
    cancellationPolicy: '  Hủy trước 3 ngày hoàn 50%.  ', travelNotes: ' ',
  };
  const input = plain(forms.toSaveTourInput(edited));
  assert.deepEqual(input, {
    code: 'SH-MB-002', title: 'Hà Nội một ngày', destinationId: '8', categoryId: null, operatingBranchId: '1',
    durationDays: 1, durationNights: 0, basePrice: 1290000, description: null,
    cancellationPolicy: 'Hủy trước 3 ngày hoàn 50%.', travelNotes: null,
  });
});
