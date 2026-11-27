/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

const { tourCheckoutStep } = loadTs('src/lib/booking-rules.ts');
const tour = (extra = {}) => ({
  serviceType: 'tour', holdExpiresAt: '2026-11-23T10:10:00Z', status: 'pending', paidAt: null, canPay: true, ...extra,
});

test('a held tour order waiting for payment is on the payment step', () => {
  assert.equal(tourCheckoutStep(tour()), 2);
});

test('a paid or confirmed order is on the final step', () => {
  assert.equal(tourCheckoutStep(tour({ paidAt: '2026-11-23T10:05:00Z', canPay: false })), 3);
  assert.equal(tourCheckoutStep(tour({ status: 'confirmed', canPay: false })), 3);
});

test('a held order that can no longer be paid stays on the hold step', () => {
  assert.equal(tourCheckoutStep(tour({ canPay: false })), 1);
});

test('cancelled orders and partner-confirmed hotel orders show no step bar', () => {
  assert.equal(tourCheckoutStep(tour({ status: 'cancelled', canPay: false })), null);
  assert.equal(tourCheckoutStep({ ...tour(), serviceType: 'hotel', holdExpiresAt: null }), null);
});

test('a held flight deal shows no tour step bar', () => {
  assert.equal(tourCheckoutStep(tour({ serviceType: 'flight' })), null);
});
