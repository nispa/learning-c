/* Per ogni linguaggio in src/languages/<id>/language.js controlla il contratto e tutti i livelli:
   la soluzione deve superare il livello, il codice di partenza no. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Checker = require('../src/core/checker.js');

const dir = path.join(__dirname, '..', 'src', 'languages');
const languages = fs.readdirSync(dir, { withFileTypes: true })
  .filter(d => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'language.js')))
  .map(d => require(path.join(dir, d.name, 'language.js')));

test('esiste almeno un linguaggio', () => assert.ok(languages.length > 0));

for (const lang of languages) {
  test(`${lang.id}: rispetta il contratto`, () => {
    for (const k of ['id', 'name', 'fileName', 'editorMode', 'storageKey']) {
      assert.equal(typeof lang[k], 'string', `manca il campo ${k}`);
    }
    assert.equal(typeof lang.run, 'function');
    assert.ok(Array.isArray(lang.chapters) && lang.chapters.length > 0);
  });

  const ids = new Set();
  for (const chapter of lang.chapters) {
    for (const level of chapter.levels) {
      test(`${lang.id}/${chapter.id}/${level.id}`, () => {
        assert.ok(!ids.has(level.id), `id duplicato: ${level.id} (i progressi salvati usano l'id)`);
        ids.add(level.id);
        for (const k of ['title', 'task', 'code', 'solution']) assert.equal(typeof level[k], 'string', `manca il campo ${k}`);
        assert.ok(level.tests && level.tests.length > 0, 'serve almeno un test');

        const sol = Checker.check(level, level.solution, lang.run);
        assert.ok(sol.passed, 'la soluzione non supera il livello: ' + JSON.stringify(sol.fail));
        assert.ok(!Checker.check(level, level.code, lang.run).passed, 'il codice di partenza supera già il livello');
      });
    }
  }
}
