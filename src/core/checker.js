/* Verifica di un livello: esegue i test e i controlli sul codice.
   Non conosce nessun linguaggio: riceve la funzione run del linguaggio (vedi src/languages/README.md).
   Toglie i commenti in stile C (di riga e di blocco), che valgono anche per C++, Rust, Java, JavaScript. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Checker = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';
function stripComments(code) {
  return code.replace(/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, m => (m[0] === '/' ? m.replace(/[^\n]/g, ' ') : m));
}
function norm(s) {
  const lines = s.replace(/\r/g, '').split('\n').map(l => l.replace(/[ \t]+$/, ''));
  while (lines.length && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
}
function applyPatches(code, patches) {
  for (const [re, rep] of patches) {
    const r = re instanceof RegExp ? re : new RegExp(re);
    if (!r.test(code)) return null;
    code = code.replace(r, rep);
  }
  return code;
}
// run(code, { input }) -> { output, error, leaks? }
// Ritorna { passed, passedTests, totalTests, fail } senza frasi pronte: i testi li sceglie l'interfaccia nella lingua giusta.
// fail.kind: 'patch' | 'leak' (leaks) | 'rule' (msg del livello) | 'error' (test, error) | 'output' (test, got)
function check(level, code, run) {
  const clean = stripComments(code);
  const tests = level.tests || [];
  let passedTests = 0;
  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    let src = code;
    if (t.patch) {
      src = applyPatches(code, t.patch);
      if (src === null) return { passed: false, passedTests, totalTests: tests.length, fail: { kind: 'patch' } };
    }
    const r = run(src, { input: t.input || '' });
    if (r.error) return { passed: false, passedTests, totalTests: tests.length, fail: { kind: 'error', test: t, index: i, got: r.output, error: r.error, patched: !!t.patch } };
    if (norm(r.output) !== norm(t.expect)) return { passed: false, passedTests, totalTests: tests.length, fail: { kind: 'output', test: t, index: i, got: r.output, patched: !!t.patch } };
    if (level.noLeak && r.leaks > 0) return { passed: false, passedTests, totalTests: tests.length, fail: { kind: 'leak', leaks: r.leaks } };
    passedTests++;
  }
  for (const m of level.must || []) {
    const re = m.re; re.lastIndex = 0;
    if (!re.test(m.raw ? code : clean)) return { passed: false, passedTests, totalTests: tests.length, fail: { kind: 'rule', msg: m.msg } };
  }
  for (const m of level.mustNot || []) {
    const re = m.re; re.lastIndex = 0;
    if (re.test(m.raw ? code : clean)) return { passed: false, passedTests, totalTests: tests.length, fail: { kind: 'rule', msg: m.msg } };
  }
  for (const m of level.maxCount || []) {
    const re = new RegExp(m.re.source, 'g');
    const n = (clean.match(re) || []).length;
    if (n > m.max) return { passed: false, passedTests, totalTests: tests.length, fail: { kind: 'rule', msg: m.msg } };
  }
  return { passed: true, passedTests, totalTests: tests.length };
}
return { check, norm, stripComments };
});
