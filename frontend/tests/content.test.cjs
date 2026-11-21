/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { loadTs, plain } = require('./load-ts.cjs');

const format = loadTs('src/lib/format.ts');
const contact = loadTs('src/data/site-contact.ts');
const faq = loadTs('src/data/help-faq.ts', { '@/data/site-contact': contact });
const policies = loadTs('src/data/policies.ts', { '@/data/site-contact': contact });
const about = loadTs('src/data/about.ts');
const guides = loadTs('src/data/travel-guides.ts');
const search = loadTs('src/lib/content-search.ts', { '@/lib/format': format });

const DOCUMENTS = [policies.privacyPolicy, policies.dataProtectionPolicy, policies.termsOfUse,
  policies.cancellationPolicy, about.aboutPage];

test('the FAQ filter ignores accents and case and needs every word', () => {
  const hits = search.filterFaq(faq.FAQ_GROUPS, 'huy DON');
  assert.ok(hits.length > 0);
  assert.ok(hits.every(group => group.items.length > 0));
  assert.ok(hits.flatMap(group => group.items).some(item => item.id === 'tu-huy'));
  assert.equal(search.filterFaq(faq.FAQ_GROUPS, 'giữ chỗ 10 phút').some(g => g.id === 'dat-tour'), true);
  assert.deepEqual(plain(search.filterFaq(faq.FAQ_GROUPS, 'khongcocauhoinay')), []);
  assert.equal(search.filterFaq(faq.FAQ_GROUPS, '   ').length, faq.FAQ_GROUPS.length);
});

test('guides suggest tours whose destination or title matches a keyword', () => {
  const tour = (id, destination, title) => ({ id, destination, title });
  const tours = [tour('1', 'Đà Lạt', 'Săn mây'), tour('2', 'Huế', 'Cố đô'), tour('3', 'Hội An', 'Tết phố cổ'),
    tour('4', 'Phú Quốc', 'Biển')];
  assert.deepEqual(plain(search.relatedTours(tours, ['da lat', 'Phú Quốc'], 3)).map(t => t.id), ['1', '4']);
  assert.deepEqual(plain(search.relatedTours(tours, ['Tết'], 3)).map(t => t.id), ['3']);
  assert.equal(search.relatedTours(tours, ['Đà Lạt', 'Huế', 'Hội An', 'Phú Quốc'], 2).length, 2);
});

test('every page has a date, sections with unique anchors, and content in each section', () => {
  for (const doc of DOCUMENTS) {
    assert.match(doc.updated, /^\d{2}\/\d{2}\/\d{4}$/, doc.title);
    const ids = doc.sections.map(section => section.id);
    assert.equal(new Set(ids).size, ids.length, doc.title);
    assert.ok(doc.sections.every(s => (s.paragraphs?.length ?? 0) + (s.items?.length ?? 0) > 0), doc.title);
  }
  const faqIds = faq.FAQ_GROUPS.flatMap(group => [group.id, ...group.items.map(item => item.id)]);
  assert.equal(new Set(faqIds).size, faqIds.length);
  const slugs = guides.TRAVEL_GUIDES.map(guide => guide.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  assert.equal(guides.TRAVEL_GUIDES.length, 4);
  assert.ok(guides.TRAVEL_GUIDES.every(guide => guide.relatedKeywords.length > 0 && guide.sections.length > 0));
  assert.equal(guides.findGuide('du-lich-dip-tet').title, 'Du lịch dịp Tết: lên kế hoạch sớm');
  assert.equal(guides.findGuide('khong-co'), undefined);
});

test('contact details are visibly simulated and the old 1900 hotline is gone from the code', () => {
  assert.match(contact.SITE_CONTACT.email, /\.example$/);
  assert.match(contact.SITE_CONTACT.simulatedNote, /mô phỏng/);
  assert.match(contact.SITE_CONTACT.githubUrl, /^https:\/\/github\.com\//);
  const files = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => (entry.isDirectory()
    ? files(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]));
  const offenders = files('src').filter(path => /\.(tsx?|css)$/.test(path) && !path.endsWith('lib/branches.ts')
    && !path.endsWith('data/legal.ts') && /1900\s?6886|19006886/.test(readFileSync(path, 'utf8')));
  assert.deepEqual(offenders, []);
});

test('the data protection page cites the law in force and the decree that replaced Decree 13/2023', () => {
  const text = JSON.stringify(policies.dataProtectionPolicy);
  assert.match(text, /91\/2025\/QH15/);
  assert.match(text, /356\/2025\/NĐ-CP/);
  assert.match(text, /13\/2023\/NĐ-CP[^"]*hết hiệu lực/);
});
