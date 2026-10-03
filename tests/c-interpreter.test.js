/* Comportamenti dell'interprete C su cui contano i livelli e i messaggi agli studenti.
   I messaggi sono [chiave, valori]: si controllano le chiavi, non le frasi di una lingua. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../src/languages/c/interpreter.js');
const lang = require('../src/languages/c/language.js');
const R = String.raw;
const H = '#include <stdio.h>\n';

test('printf formatta come il C', () => {
  const r = C.run(H + R`int main() { printf("%d %5.2f %s %c %x\n", 42, 3.14159, "ok", 65, 255); return 3; }`);
  assert.equal(r.error, null);
  assert.equal(r.output, '42  3.14 ok A ff\n');
  assert.equal(r.exitCode, 3);
});

test('scanf legge dall\'input', () => {
  const r = C.run(H + R`int main() { int a, b; scanf("%d %d", &a, &b); printf("%d\n", a + b); return 0; }`, { input: '2 40\n' });
  assert.equal(r.output, '42\n');
});

test('gli interi traboccano come su una macchina reale', () => {
  const r = C.run(H + R`int main() { unsigned char c = 255; c++; int i = 2147483647; i++; printf("%d %d\n", c, i); return 0; }`);
  assert.equal(r.output, '0 -2147483648\n');
});

test('errore di compilazione: riga giusta e messaggio giusto', () => {
  const r = C.run(H + 'int main() {\n  int x = 1\n  return 0;\n}');
  assert.equal(r.error.kind, 'compile');
  assert.equal(r.error.line, 3); // la riga a cui manca il ;
  assert.match(r.error.message[0], /^err\.missingSemicolon/);
});

test('suggerisce il nome giusto di una funzione sbagliata', () => {
  const r = C.run(H + 'int main() { printt("x"); return 0; }');
  assert.equal(r.error.message[0], 'err.unknownFunc');
  assert.deepEqual(r.error.message[1].suggest, ['hint.didYouMean', { name: 'printf' }]);
});

test('errori a runtime: indice fuori dai limiti e divisione per zero', () => {
  const oob = C.run('int main() {\n  int a[3];\n  a[5] = 1;\n  return 0;\n}');
  assert.equal(oob.error.kind, 'runtime');
  assert.equal(oob.error.line, 3);
  const div = C.run(H + 'int main() {\n  int z = 0;\n  printf("%d", 1 / z);\n  return 0;\n}');
  assert.equal(div.error.message[0], 'err.divByZero');
});

test('un ciclo infinito viene fermato', () => {
  assert.equal(C.run('int main() { while (1) {} }').error.kind, 'limit');
});

test('conta la memoria non liberata', () => {
  const leak = '#include <stdlib.h>\nint main() { int *p = malloc(4); *p = 1; ';
  assert.equal(C.run(leak + 'return 0; }').leaks, 1);
  assert.equal(C.run(leak + 'free(p); return 0; }').leaks, 0);
});

test('ogni chiave usata dall\'interprete esiste in ogni lingua, e nessuna è in più', () => {
  const src = fs.readFileSync(path.join(__dirname, '../src/languages/c/interpreter.js'), 'utf8');
  const used = new Set([...src.matchAll(/'((?:err|warn|ctx|hint|frag)\.\w+)'/g)].map(m => m[1]));
  for (const [locale, strings] of Object.entries(lang.i18n)) {
    const own = Object.keys(strings).filter(k => /^(err|warn|ctx|hint|frag)\./.test(k));
    assert.deepEqual([...used].filter(k => !(k in strings)), [], `${locale}: chiavi mancanti`);
    assert.deepEqual(own.filter(k => !used.has(k)), [], `${locale}: chiavi non usate`);
  }
});
