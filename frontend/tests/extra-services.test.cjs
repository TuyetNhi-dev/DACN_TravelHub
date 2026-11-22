/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs, plain } = require('./load-ts.cjs');

const { EXTRA_SERVICES, findExtraService } = loadTs('src/data/extra-services.ts');
const { SERVICE_REQUEST_TYPES } = loadTs('src/types/service-request.ts');
const phoneVn = loadTs('src/lib/phone-vn.ts');
const form = loadTs('src/lib/service-request-form.ts', { '@/lib/phone-vn': phoneVn }, { Date });

const textOf = service => [service.name, service.summary, service.lead, ...service.intro,
  ...service.highlights.flatMap(h => [h.title, h.text]), ...service.faqs.flatMap(f => [f.question, f.answer])].join('\n');

test('four services with unique URL-safe slugs, one per request type', () => {
  assert.equal(EXTRA_SERVICES.length, 4);
  const slugs = EXTRA_SERVICES.map(s => s.slug);
  assert.equal(new Set(slugs).size, 4);
  assert.equal(findExtraService('esim'), undefined, 'eSIM was dropped: domestic travel only');
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.deepEqual(plain(EXTRA_SERVICES.map(s => s.type).sort()), [...SERVICE_REQUEST_TYPES].sort());
  for (const service of EXTRA_SERVICES) assert.ok(form.DETAIL_FIELDS[service.type].length > 0, service.type);
  assert.equal(findExtraService('visa').type, 'visa');
  assert.equal(findExtraService('khong-co'), undefined);
});

test('every page has an introduction, 3–4 highlights and 4–5 questions', () => {
  for (const service of EXTRA_SERVICES) {
    assert.ok(service.intro.length >= 1, service.slug);
    assert.ok(service.highlights.length >= 3 && service.highlights.length <= 4, service.slug);
    assert.ok(service.faqs.length >= 4 && service.faqs.length <= 5, service.slug);
    assert.ok(service.summary.length <= 50, `${service.slug} summary fits one menu line`);
  }
});

test('no prices and no legal promises in the content', () => {
  for (const service of EXTRA_SERVICES) {
    assert.doesNotMatch(textOf(service), /\d[\d.,]*\s*(₫|vnd|đồng|nghìn|triệu|k\b|đ(?!\p{L}))/iu, service.slug);
    assert.doesNotMatch(textOf(service), /chắc chắn đậu|bao đậu|đảm bảo đậu|100\s*%/i, service.slug);
  }
  const visa = findExtraService('visa');
  assert.match(textOf(visa), /không thể cam kết kết quả/i);
  assert.match(textOf(visa), /không nhập số hộ chiếu hay CCCD/i);
});
