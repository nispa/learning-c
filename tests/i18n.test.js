/* Le lingue dell'interfaccia hanno l'inglese come riferimento: stesse chiavi, stessi {segnaposto},
   stesse forme plurali. E ogni chiave usata dall'interfaccia deve esistere in inglese. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const locales = Object.fromEntries(fs.readdirSync(path.join(root, 'src/i18n'))
  .filter(n => n.endsWith('.js')).map(n => [path.basename(n, '.js'), require(path.join(root, 'src/i18n', n))]));
const languages = fs.readdirSync(path.join(root, 'src/languages'))
  .filter(n => fs.existsSync(path.join(root, 'src/languages', n, 'language.js')))
  .map(n => require(path.join(root, 'src/languages', n, 'language.js')));

const placeholders = (v) => [...new Set(JSON.stringify(v).match(/\{\w+\}/g) || [])].sort();

// Confronta un dizionario con quello inglese di riferimento.
function sameShape(dict, ref, where) {
  assert.deepEqual(Object.keys(dict).sort(), Object.keys(ref).sort(), `${where}: le chiavi devono essere quelle dell'inglese`);
  for (const k of Object.keys(ref)) {
    assert.deepEqual(placeholders(dict[k]), placeholders(ref[k]), `${where}: segnaposto diversi in "${k}"`);
    if (typeof ref[k] === 'object') assert.equal(typeof dict[k].other, 'string', `${where}: "${k}" è plurale, serve almeno "other"`);
  }
}

test('esiste l\'inglese, la lingua di riferimento', () => assert.ok(locales.en));

for (const [code, dict] of Object.entries(locales)) {
  test(`i18n/${code}: stessa forma dell'inglese`, () => {
    sameShape(dict, locales.en, code);
    assert.ok(dict['locale.name'], 'serve il nome della lingua nella lingua stessa');
  });
}

for (const lang of languages) {
  test(`${lang.id}: testi del linguaggio con la stessa forma dell'inglese`, () => {
    assert.ok(lang.i18n && lang.i18n.en, 'servono almeno i testi in inglese');
    for (const [code, dict] of Object.entries(lang.i18n)) {
      assert.ok(locales[code], `"${code}" non è una lingua dell'interfaccia`);
      sameShape(dict, lang.i18n.en, `${lang.id}/${code}`);
    }
  });
}

test('ogni chiave usata dall\'interfaccia esiste in inglese', () => {
  const used = [
    ...read('src/core/app.js').matchAll(/\bt\('([\w.]+)'[,)]/g),
    ...read('index.html').matchAll(/data-i18n(?:-aria)?="([\w.]+)"/g),
  ].map(m => m[1]);
  assert.ok(used.length > 50);
  for (const lang of languages) {
    const known = { ...locales.en, ...lang.i18n.en };
    const missing = [...new Set(used)].filter(k => !(k in known));
    assert.deepEqual(missing, [], `${lang.id}: chiavi usate ma non definite`);
  }
});

test('index.html carica ogni file di src/', () => {
  const html = read('index.html');
  const walk = (d) => fs.readdirSync(path.join(root, d), { withFileTypes: true })
    .flatMap(e => e.isDirectory() ? walk(d + '/' + e.name) : e.name.endsWith('.js') ? [d + '/' + e.name] : []);
  for (const f of walk('src')) assert.ok(html.includes(`<script src="${f}">`), `manca <script src="${f}"> in index.html`);
});
