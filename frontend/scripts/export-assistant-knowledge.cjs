/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS build script. */
/** Writes the assistant knowledge base for the backend. Run after editing help-faq, policies or travel-guides. */
const { writeFileSync } = require('node:fs');
const { buildKnowledge, serialize, OUTPUT } = require('./assistant-knowledge.cjs');

const knowledge = buildKnowledge();
writeFileSync(OUTPUT, serialize(knowledge));
process.stdout.write(`Wrote ${knowledge.entries.length} entries to ${OUTPUT}\n`);
