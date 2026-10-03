# Linguaggi

Ogni linguaggio vive in `src/languages/<id>/` e si registra in `window.LANGUAGES[<id>]`
con un file `language.js`. Il nucleo (`src/core/`) non sa niente dei singoli linguaggi:
legge solo l'oggetto descritto qui.

```
src/languages/c/
  interpreter.js          esegue il codice; non contiene testi, solo chiavi
  language.js             l'oggetto del contratto
  locales/en/strings.js   testi dell'interfaccia legati al C + messaggi dell'interprete (riferimento)
  locales/en/levels.js    capitoli e livelli in inglese (riferimento)
  locales/it/...          stessi file in italiano
```

## Il contratto

```js
{
  id: 'c',                    // anche il valore di ?language=c nell'URL
  name: 'C',                  // compare nel titolo: "C Passo Passo" / "C Step by Step"
  fileName: 'main.c',         // intestazione dell'editor e messaggi d'errore
  editorMode: 'text/x-csrc',  // modo di CodeMirror 5
  storageKey: 'c-passo-passo-v1', // chiave in localStorage: non cambiarla mai dopo il rilascio
  run(code, { input }) { ... },
  chapters: { en: [...], it: [...] },  // livelli per lingua; en obbligatorio (vedi "Livelli")
  i18n: { en: {...}, it: {...} },      // testi per lingua; en obbligatorio (vedi "Testi")
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

`message` e `msg` sono **messaggi da tradurre**: `[chiave, valori]`, per esempio
`['err.undeclaredVar', { name: 'x', suggest: ['hint.didYouMean', { name: 'y' }] }]`.
Un valore può essere a sua volta `[chiave, valori]`: l'interfaccia traduce tutto con `t()`.
(Un linguaggio può anche restituire testo già pronto, ma allora non è traducibile.)

I messaggi sono rivolti a chi sta imparando: semplici, con la riga giusta, e devono dire cosa
fare, non solo cosa è andato storto.

## Testi

`i18n[<lingua>]` contiene le chiavi che dipendono dal linguaggio: quelle dell'interfaccia
(`input.label`, `finished.text`, `fail.leak` se usa `leaks`) e tutti i messaggi dell'interprete.
Si aggiungono a quelle comuni di `src/i18n/`. Stesse regole: l'inglese è il riferimento,
ogni lingua ha le stesse chiavi e gli stessi `{segnaposto}`, i plurali sono `{ one, other }`.

## Livelli

```js
{ id: 'primi', title: 'Primi passi', levels: [
  { id: 'ciao',             // stabile e uguale in tutte le lingue: i progressi salvati usano l'id
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

Una traduzione dei livelli traduce **tutto**: consegne, suggerimenti, ma anche le stringhe stampate
nel codice, gli output attesi, i nomi delle variabili e le regole (`must`, `patch`...) che li citano.
`npm test` controlla ogni livello in ogni lingua e che capitoli e id siano gli stessi dell'inglese.

## Aggiungere una lingua a un linguaggio

1. Copia `locales/en/` in `locales/<codice>/` e traduci `strings.js` e `levels.js`
   (cambia anche la riga finale che registra il file: `.en` diventa `.<codice>`).
2. Aggiungi i due `<script>` in `index.html`, prima di `language.js`.
3. Se la lingua dell'interfaccia non esiste ancora, aggiungi anche `src/i18n/<codice>.js`.
4. `npm test`.

## Aggiungere un linguaggio

1. Crea `src/languages/<id>/` con `language.js` (copia quello del C), l'interprete e `locales/en/`.
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
