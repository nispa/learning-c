/* Il linguaggio C: tutto quello che l'interfaccia deve sapere su questo corso.
   Il contratto che ogni linguaggio deve rispettare è descritto in src/languages/README.md.
   Testi e livelli stanno in locales/<lingua>/ (strings.js e levels.js); l'inglese è il riferimento. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    // In Node le lingue si trovano leggendo la cartella; nel browser le registra ogni file caricato.
    const fs = require('fs'), path = require('path');
    const locales = {};
    for (const code of fs.readdirSync(path.join(__dirname, 'locales'))) {
      locales[code] = { strings: require(`./locales/${code}/strings.js`), levels: require(`./locales/${code}/levels.js`) };
    }
    module.exports = factory(require('./interpreter.js'), locales);
  } else (root.LANGUAGES = root.LANGUAGES || {}).c = factory(root.CInterp, root.CLocales);
})(typeof self !== 'undefined' ? self : this, function (CInterp, locales) {
'use strict';
const byLocale = (k) => Object.fromEntries(Object.entries(locales).map(([code, l]) => [code, l[k]]));
return {
  id: 'c',
  name: 'C',
  fileName: 'main.c',
  editorMode: 'text/x-csrc',
  // Non cambiarla: è la chiave dei progressi già salvati dagli studenti.
  storageKey: 'c-passo-passo-v1',
  run: CInterp.run,
  chapters: byLocale('levels'),
  i18n: byLocale('strings'),
};
});
