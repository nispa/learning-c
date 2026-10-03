/* Per ogni linguaggio in src/languages/<id>/language.js controlla il contratto e tutti i livelli, in ogni lingua:
   la soluzione deve superare il livello, il codice di partenza no. Le lingue devono avere gli stessi
   capitoli e livelli dell'inglese, nello stesso ordine: i progressi salvati usano gli id. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Checker = require('../src/core/checker.js');

const dir = path.join(__dirname, '..', 'src', 'languages');
const languages = fs.readdirSync(dir, { withFileTypes: true })
  .filter(d => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'language.js')))
  .map(d => require(path.join(dir, d.name, 'language.js')));

const shape = (chapters) => chapters.map(c => c.id + ': ' + c.levels.map(l => l.id).join(' '));

test('esiste almeno un linguaggio', () => assert.ok(languages.length > 0));

for (const lang of languages) {
  test(`${lang.id}: rispetta il contratto`, () => {
    for (const k of ['id', 'name', 'fileName', 'editorMode', 'storageKey']) {
      assert.equal(typeof lang[k], 'string', `manca il campo ${k}`);
    }
    assert.equal(typeof lang.run, 'function');
    assert.ok(Array.isArray(lang.chapters.en) && lang.chapters.en.length > 0, 'servono i livelli in inglese');
  });

  for (const [locale, chapters] of Object.entries(lang.chapters)) {
    test(`${lang.id}/${locale}: stessi capitoli e livelli dell'inglese`, () => {
      assert.deepEqual(shape(chapters), shape(lang.chapters.en));
      const ids = chapters.flatMap(c => c.levels.map(l => l.id));
      assert.equal(new Set(ids).size, ids.length, 'ci sono id duplicati');
    });

    for (const chapter of chapters) {
      for (const level of chapter.levels) {
        test(`${lang.id}/${locale}/${chapter.id}/${level.id}`, () => {
          for (const k of ['title', 'task', 'code', 'solution']) assert.equal(typeof level[k], 'string', `manca il campo ${k}`);
          assert.ok(level.tests && level.tests.length > 0, 'serve almeno un test');

          const sol = Checker.check(level, level.solution, lang.run);
          assert.ok(sol.passed, 'la soluzione non supera il livello: ' + JSON.stringify(sol.fail));
          assert.ok(!Checker.check(level, level.code, lang.run).passed, 'il codice di partenza supera già il livello');
        });
      }
    }
  }
}
