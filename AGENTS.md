# Passo Passo

Corso interattivo di programmazione per principianti, tutto nel browser: lo studente scrive
codice, lo esegue con un interprete in JavaScript e ogni livello viene verificato da test.
Oggi c'è il C (81 livelli); il nucleo è pensato per ospitare altri linguaggi di programmazione
e altre lingue dell'interfaccia.

- Avvio: apri `index.html` (funziona anche da file, senza server).
  Parametri facoltativi: `?language=c` (linguaggio del corso), `?locale=en` (lingua dell'interfaccia).
- Test: `npm test` (usa `node --test`, nessuna dipendenza da installare).

## Struttura

```
index.html                 markup (testi come chiavi data-i18n) e <script> nell'ordine giusto
css/app.css                stile dell'app (CodeMirror arriva dalla CDN)
src/i18n/en.js             testi dell'interfaccia in inglese: il riferimento per ogni lingua
src/i18n/it.js             italiano
src/core/checker.js        verifica un livello; riceve la funzione run del linguaggio, non produce frasi
src/core/app.js            interfaccia; legge tutto dall'oggetto del linguaggio e i testi da t()
src/languages/README.md    contratto di un linguaggio, formato dei livelli, come aggiungere una lingua
src/languages/c/           interprete (senza testi) e definizione del C
src/languages/c/locales/   per ogni lingua: strings.js (messaggi) e levels.js (livelli)
tests/                     node:test
```

I file in `src/` sono moduli UMD: si caricano con `<script>` nel browser e con `require` in Node.
Mantieni questo formato: niente bundler, niente build, niente ES modules (non funzionano da file://).

Due parole da non confondere: **language** è il linguaggio di programmazione del corso
(`src/languages/`), **locale** è la lingua dell'interfaccia (`src/i18n/`).

## Come scrivere codice qui (ispirato a ponytail)

Prima leggi il codice e segui il flusso vero. Poi, prima di scrivere, sali questa scala e fermati
al primo gradino che risolve il problema:

1. Serve davvero? Se no, non farlo.
2. C'è già nel progetto? Riusalo (es. `esc`, `md`, `t`, `Checker.norm`, `suggest` nell'interprete).
3. Lo fa JavaScript o il browser? Usalo (`Intl.PluralRules`, `URLSearchParams`, `node:test`...).
4. Lo fa una dipendenza già caricata (CodeMirror)? Usala.
5. Basta una riga? Una riga.
6. Solo allora: il minimo che funziona, scritto come il codice intorno.

Niente dipendenze npm, framework o astrazioni "per il futuro": un nuovo punto di estensione si
aggiunge quando arriva il secondo caso che lo usa.

### Da non sacrificare mai per fare prima

- **Messaggi per gli studenti**: semplici, con la riga giusta, che dicono cosa fare.
- **Accessibilità**: font leggibili, focus visibile, contrasto in tema chiaro e scuro,
  nessuna animazione se `prefers-reduced-motion`, tutto usabile da tastiera, `aria-label` tradotte.
- **Progressi degli studenti**: `storageKey` e gli `id` di capitoli e livelli non cambiano mai;
  ogni accesso a `localStorage` sta in un try/catch.
- **Sicurezza**: il testo che arriva dai livelli, dalle traduzioni o dal programma passa da
  `esc()` o `md()` prima di finire in `innerHTML`.
- **Limiti dell'interprete**: passi massimi, profondità della ricorsione e quantità di output
  restano, così un ciclo infinito non blocca la pagina.

## Testi dell'interfaccia (i18n)

- Nessun testo per l'utente scritto nel codice: in `app.js` si usa `t('chiave', { segnaposto })`,
  in `index.html` gli attributi `data-i18n="chiave"` (testo) e `data-i18n-aria="chiave"` (aria-label).
- Una chiave nuova si aggiunge **prima in `src/i18n/en.js`**, poi in tutte le altre lingue.
- I testi che dipendono dal linguaggio (es. `scanf`, `malloc`) e i messaggi dell'interprete stanno in
  `src/languages/<id>/locales/<lingua>/strings.js`, con le stesse regole.
- L'interprete non scrive frasi: lancia `cerr(line, 'err.chiave', { valori })`. Un valore può essere
  `[chiave, valori]` (un pezzo di frase da tradurre); `t()` li traduce in modo ricorsivo.
- I livelli sono tradotti per intero in `locales/<lingua>/levels.js` (anche codice e output attesi),
  con gli stessi capitoli e id dell'inglese.
- Plurali: il valore diventa `{ one: '...', other: '...' }` e si passa `{ n }` a `t()`.
- Nuova lingua: copia `src/i18n/en.js` in `src/i18n/<codice>.js` e `src/languages/<id>/locales/en/`
  in `locales/<codice>/`, traduci ogni valore, aggiungi i `<script>` in `index.html`.
  Compare da sola nelle impostazioni. Dettagli in `src/languages/README.md`.
- Se manca una chiave nella lingua scelta, `t()` usa l'inglese; i test però vogliono ogni lingua completa.

## Qualità

- `npm test` deve essere verde prima di considerare finito un cambiamento. Controlla:
  - ogni livello in ogni lingua: la `solution` lo supera, il `code` di partenza no;
  - ogni lingua: stessi capitoli e id dei livelli, stesse chiavi, segnaposto e plurali dell'inglese;
  - ogni chiave usata (interfaccia e interprete) esiste in ogni lingua, e nessuna è in più;
  - ogni file `.js` in `src/` è caricato da `index.html`.
- Correggi un bug dell'interprete scrivendo prima un test in `tests/` che lo riproduce.
- Commenti in italiano, brevi, che spiegano il perché, non il cosa.
- Per vedere un cambiamento nell'interfaccia apri la pagina e prova davvero un livello,
  in almeno due lingue se tocca dei testi.
