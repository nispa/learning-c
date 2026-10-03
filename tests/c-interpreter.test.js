/* Comportamenti dell'interprete C su cui contano i livelli e i messaggi agli studenti. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../src/languages/c/interpreter.js');
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

test('errore di compilazione: riga giusta e messaggio in italiano', () => {
  const r = C.run(H + 'int main() {\n  int x = 1\n  return 0;\n}');
  assert.equal(r.error.kind, 'compile');
  assert.equal(r.error.line, 3); // la riga a cui manca il ;
  assert.match(r.error.message, /punto e virgola/);
});

test('suggerisce il nome giusto di una funzione sbagliata', () => {
  const r = C.run(H + 'int main() { printt("x"); return 0; }');
  assert.match(r.error.message, /Forse volevi scrivere 'printf'/);
});

test('errori a runtime: indice fuori dai limiti e divisione per zero', () => {
  const oob = C.run('int main() {\n  int a[3];\n  a[5] = 1;\n  return 0;\n}');
  assert.equal(oob.error.kind, 'runtime');
  assert.equal(oob.error.line, 3);
  const div = C.run(H + 'int main() {\n  int z = 0;\n  printf("%d", 1 / z);\n  return 0;\n}');
  assert.match(div.error.message, /Divisione per zero/);
});

test('un ciclo infinito viene fermato', () => {
  assert.equal(C.run('int main() { while (1) {} }').error.kind, 'limit');
});

test('conta la memoria non liberata', () => {
  const leak = '#include <stdlib.h>\nint main() { int *p = malloc(4); *p = 1; ';
  assert.equal(C.run(leak + 'return 0; }').leaks, 1);
  assert.equal(C.run(leak + 'free(p); return 0; }').leaks, 0);
});
