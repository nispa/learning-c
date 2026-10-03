/* Il linguaggio C: tutto quello che l'interfaccia deve sapere su questo corso.
   Il contratto che ogni linguaggio deve rispettare è descritto in src/languages/README.md. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./interpreter.js'), require('./levels.js'));
  else (root.LANGUAGES = root.LANGUAGES || {}).c = factory(root.CInterp, root.CLevels);
})(typeof self !== 'undefined' ? self : this, function (CInterp, chapters) {
'use strict';
return {
  id: 'c',
  name: 'C',
  fileName: 'main.c',
  editorMode: 'text/x-csrc',
  // Non cambiarla: è la chiave dei progressi già salvati dagli studenti.
  storageKey: 'c-passo-passo-v1',
  run: CInterp.run,
  chapters,
  // Testi dell'interfaccia che dipendono dal linguaggio; si aggiungono a quelli di src/i18n/.
  i18n: {
    en: {
      'input.label': 'Input (what the program reads with scanf)',
      'finished.text': 'You have seen the whole course: variables, loops, functions, arrays, strings, pointers, dynamic memory, structs and the preprocessor.',
      'fail.leak': {
        one: 'The output is right, but you forgot to free the memory: one block taken with malloc was not released with free.',
        other: 'The output is right, but you forgot to free the memory: {n} blocks taken with malloc were not released with free.',
      },
    },
    it: {
      'input.label': 'Input (quello che il programma legge con scanf)',
      'finished.text': 'Hai visto tutto il programma del corso: variabili, cicli, funzioni, array, stringhe, puntatori, memoria dinamica, strutture e preprocessore.',
      'fail.leak': {
        one: 'L\'output è giusto, ma hai dimenticato di liberare la memoria: un blocco preso con malloc non è stato liberato con free.',
        other: 'L\'output è giusto, ma hai dimenticato di liberare la memoria: {n} blocchi presi con malloc non sono stati liberati con free.',
      },
    },
  },
};
});
