/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS harness for TypeScript modules. */
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

/**
 * Compiles one TypeScript module and runs it in an isolated context. Only the listed dependencies can
 * be imported, so a test fails loudly when a module grows an import it did not stub.
 */
function loadTs(path, dependencies = {}, globals = {}) {
  const exports = {};
  const source = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(source, {
    exports, URLSearchParams, ...globals,
    require: name => {
      if (!(name in dependencies)) throw Error('Unexpected dependency: ' + name);
      return dependencies[name];
    },
  });
  return exports;
}

/** Arrays built inside the vm context fail deepEqual against this realm's arrays; copy them first. */
const plain = value => JSON.parse(JSON.stringify(value));

module.exports = { loadTs, plain };
