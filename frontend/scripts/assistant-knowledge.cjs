/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS build script. */
/**
 * Builds the assistant's knowledge base from the site's own content (help FAQ, policies, travel guides), so the
 * backend answers from the same approved text the pages show. One entry per FAQ item or page section, with the
 * link of that exact anchor. Used by export-assistant-knowledge.cjs and by tests/assistant-knowledge.test.cjs.
 */
const path = require('node:path');
const { loadTs } = require('../tests/load-ts.cjs');

const root = path.join(__dirname, '..');
const OUTPUT = path.join(root, '..', 'backend', 'src', 'TravelHub.Api', 'Features', 'Assistant',
  'assistant-knowledge.json');

const POLICY_PAGES = [
  ['privacyPolicy', '/privacy'],
  ['dataProtectionPolicy', '/bao-ve-du-lieu-ca-nhan'],
  ['termsOfUse', '/terms'],
  ['cancellationPolicy', '/huy-va-hoan-tien'],
];

function load() {
  const at = file => path.join(root, file);
  const contact = loadTs(at('src/data/site-contact.ts'));
  const deps = { '@/data/site-contact': contact };
  return {
    faq: loadTs(at('src/data/help-faq.ts'), deps),
    policies: loadTs(at('src/data/policies.ts'), deps),
    guides: loadTs(at('src/data/travel-guides.ts'), deps),
  };
}

const joinText = (...parts) => parts.flat().filter(Boolean).join('\n');

function faqEntries(faq) {
  const items = faq.FAQ_GROUPS.flatMap(group => group.items.map(item => ({
    id: `faq:${item.id}`, kind: 'faq', title: item.question, section: group.title,
    url: `/tro-giup#${item.id}`, text: joinText(item.answer),
  })));
  const contact = faq.HELP_CONTACT;
  return [...items, {
    id: 'faq:lien-he', kind: 'faq', title: contact.heading, section: 'Trợ giúp', url: '/tro-giup#lien-he',
    text: joinText(contact.lines),
  }];
}

function policyEntries(policies) {
  return POLICY_PAGES.flatMap(([name, url]) => {
    const doc = policies[name];
    return doc.sections.map(section => ({
      id: `policy:${url.slice(1)}#${section.id}`, kind: 'policy', title: `${doc.title}: ${section.heading}`,
      section: doc.title, url: `${url}#${section.id}`, text: joinText(section.paragraphs ?? [], section.items ?? []),
    }));
  });
}

function guideEntries(guides) {
  return guides.TRAVEL_GUIDES.flatMap(guide => guide.sections.map(section => ({
    id: `guide:${guide.slug}#${section.id}`, kind: 'guide', title: `${guide.title}: ${section.heading}`,
    section: guide.title, url: `/cam-nang/${guide.slug}#${section.id}`, text: joinText(section.paragraphs),
  })));
}

/** Plain JSON (no vm-realm objects), stable order, so the committed file only changes when the content does. */
function buildKnowledge() {
  const { faq, policies, guides } = load();
  const entries = [...faqEntries(faq), ...policyEntries(policies), ...guideEntries(guides)];
  return JSON.parse(JSON.stringify({ source: 'frontend/src/data (help-faq, policies, travel-guides)', entries }));
}

const serialize = knowledge => JSON.stringify(knowledge, null, 2) + '\n';

module.exports = { buildKnowledge, serialize, OUTPUT };
