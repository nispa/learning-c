# Linguaggi

Ogni linguaggio vive in `src/languages/<id>/` e si registra in `window.LANGUAGES[<id>]`
con un file `language.js`. Il nucleo (`src/core/`) non sa niente dei singoli linguaggi:
legge solo l'oggetto descritto qui.

## Il contratto

```js
{
  id: 'c',                    // anche il valore di ?language=c nell'URL
  name: 'C',                  // compare nel titolo: "C Passo Passo" / "C Step by Step"
  fileName: 'main.c',         // intestazione dell'editor e messaggi d'errore
  editorMode: 'text/x-csrc',  // modo di CodeMirror 5
  storageKey: 'c-passo-passo-v1', // chiave in localStorage: non cambiarla mai dopo il rilascio
  run(code, { input }) { ... },
  chapters: [ ... ],          // vedi "Livelli" più sotto
  i18n: {                     // testi dell'interfaccia che dipendono dal linguaggio; en obbligatorio
    en: { 'input.label', 'finished.text', 'fail.leak' (se usa leaks) },
    it: { ... },              // stesse chiavi dell'inglese (vedi AGENTS.md, sezione i18n)
  },
}
```

`run` è **sincrona** e restituisce:

```js
{
  ok: true,           // il programma è terminato senza errori
  output: '...',      // tutto quello che ha stampato
  exitCode: 0,
  error: null,        // oppure { kind: 'compile' | 'runtime' | 'limit' | 'internal', line, message }
  warnings: [],       // [{ line, msg }]
  leaks: 0,           // facoltativo: blocchi di memoria non liberati (serve ai livelli con noLeak)
}
```

I messaggi (`error.message`, `warnings[].msg`) sono rivolti a chi sta imparando: in italiano,
con la riga giusta, e devono dire cosa fare, non solo cosa è andato storto.

## Livelli

```js
{ id: 'primi', title: 'Primi passi', levels: [
  { id: 'ciao',             // stabile: i progressi salvati usano l'id
    title, task,            // nel testo `codice` e **grassetto**
    code,                   // codice di partenza: non deve già superare il livello
    solution,               // deve superare il livello (lo controlla npm test)
    tests: [{ input, expect, patch: [[regex, sostituzione]] }],
    must, mustNot,          // [{ re, msg, raw? }] controlli sul codice (raw: senza togliere i commenti)
    maxCount,               // [{ re, max, msg }]
    noLeak,                 // tutta la memoria presa va liberata
    hint, learn },
]}
```

## Aggiungere un linguaggio

1. Crea `src/languages/<id>/` con `language.js` (copia quello del C) e i livelli.
2. Aggiungi i suoi `<script>` in `index.html`, prima di `src/core/`. Se l'editor ha bisogno
   di un altro modo di CodeMirror (per esempio `mode/rust/rust.min.js`), aggiungi anche quello.
3. Apri `index.html?language=<id>`.
4. `npm test` trova da solo il nuovo linguaggio e prova tutti i suoi livelli.

Per eseguire il codice ci sono tre strade, dalla più semplice da mantenere alla più completa:

- **C++**: estendere l'interprete C in un nuovo `src/languages/cpp/` può bastare per i livelli
  iniziali (`cout`, `string`, `vector`), che sono quelli che contano in un corso per principianti.
- **Un compilatore in WebAssembly** caricato da CDN: linguaggio completo, ma niente messaggi
  d'errore pensati per chi impara.
- **Un servizio remoto** che compila ed esegue: richiede rete e manda il codice degli studenti
  fuori dal browser.

Le ultime due sono asincrone. Quando servirà, si rendono `async` sia `run` sia `Checker.check`
e si aggiorna `run()` in `app.js`; prima di allora non serve farlo.
