# L'interprete: com'è fatto quello del C e come farne uno per un altro linguaggio

La prima parte spiega come è costruito l'interprete C (`src/languages/c/interpreter.js`), nell'ordine
in cui conviene costruirne uno. È una **ricostruzione fatta leggendo il codice**: l'interprete esisteva
già nella prima versione del progetto e non c'è una storia di come è stato scritto.

La seconda parte spiega come affrontare un altro linguaggio, con Python e Rust come esempi.

---

## Parte 1 — Com'è fatto l'interprete C

### 0. Prima del codice: cosa deve fare

Un interprete didattico non è un compilatore più piccolo: ha obiettivi diversi, e ogni scelta
tecnica qui sotto viene da uno di questi quattro.

1. **Gira nel browser, senza server e in modo sincrono**: il codice dello studente non esce dal suo
   computer e il risultato arriva subito.
2. **Spiega gli errori a chi sta imparando**: riga giusta, linguaggio semplice, cosa fare.
3. **Trasforma i comportamenti indefiniti del C in errori spiegati**: indice fuori dai limiti, variabile
   non inizializzata, uso dopo `free`. Un compilatore vero spesso li lascia passare in silenzio.
4. **Non blocca mai la pagina**: un ciclo infinito o una ricorsione senza fine si fermano con un messaggio.

E un vincolo: implementa **solo il sottoinsieme del C che serve al corso**. Quello che non supporta
(`union`, puntatori a funzione, `goto`...) lo riconosce e lo dice, invece di comportarsi in modo strano.

### Il percorso del codice

```
testo C
  │  preprocess()        commenti, #include, #define, #ifdef        → token
  │  new Parser(...)     sintassi, tipi, nomi, chiamate              → albero sintattico (AST)
  │  new Machine(...)    esecuzione su una memoria simulata          → output, codice di uscita
  ▼
run(code, { input }) → { ok, output, exitCode, error, warnings, leaks }
```

### 1. Gli errori sono dati

La prima cosa da decidere è come rappresentare un errore, perché tutto il resto lo usa.

```js
class CError extends Error { constructor(kind, line, key, vars) { ... this.msg = [key, vars]; } }
function cerr(line, key, vars) { throw new CError('compile', line, key, vars); }   // errori del programma
function rerr(line, key, vars) { throw new CError('runtime', line, key, vars); }   // errori durante l'esecuzione
```

- Ci sono quattro tipi: `compile`, `runtime`, `limit` (fermato perché troppo lento o troppo output)
  e `internal` (un bug dell'interprete).
- Ogni errore ha la **riga** e un messaggio come **chiave + valori**, tradotto dall'interfaccia
  (`locales/<lingua>/strings.js`). I pezzi di frase sono chiavi annidate:
  `['err.unknownFunc', { name, suggest: ['hint.didYouMean', { name: 'printf' }] }]`.
- Il primo errore ferma tutto (`throw`): per un principiante un errore alla volta è meglio di venti.

### 2. I tipi

I tipi sono oggetti semplici, condivisi da parser e macchina:

- interi `{ k: 'int', size, signed }` (da `char` a `long`), `float`/`double`, `void`;
- puntatori `ptrT(to)` (memorizzati in una cache, così due `int *` sono lo stesso oggetto e si confrontano con `===`),
  array `arrT(of, len)`, struct con campi, offset e allineamento calcolati come in C;
- `promote` e `usual` applicano le conversioni del C (`char + char` diventa `int`, `int + double` diventa `double`);
- `wrap(v, t)` fa traboccare i valori come su una macchina vera: `unsigned char` 255 + 1 = 0.
  Per i tipi a 64 bit usa `BigInt`, perché i numeri di JavaScript sono esatti solo fino a 2^53.

### 3. Preprocessore e analisi lessicale

- `stripComments` toglie i commenti **conservando gli a capo**, così i numeri di riga restano giusti.
- `lexLine` divide ogni riga in token (`id`, `num`, `str`, `chr`, `op`), ciascuno con la sua riga.
  Qui nascono gli errori più frequenti dei principianti: stringa non chiusa, virgolette "tipografiche"
  copiate da Word, `'ab'` tra apici singoli.
- `preprocess` gestisce `#include` (solo le librerie conosciute in `HEADERS`, che definiscono costanti
  come `NULL` ed `EOF`), `#define` con e senza parametri (l'espansione evita la ricorsione infinita
  tenendo un insieme di macro "nascoste"), `#if`/`#ifdef`/`#else` con un piccolo valutatore di espressioni.
- Ricorda quali librerie sono incluse: così può dire *"per usare `strlen` devi includere `<string.h>`"*.

### 4. Il parser

È un **parser a discesa ricorsiva**: una funzione per ogni costrutto (`parseStmt`, `parseExpr`,
`parseDeclarator`...), ognuna legge i token che le servono e restituisce un nodo dell'albero
`{ k: 'if', c, a, b, line }`.

- **Espressioni**: `parseAssign` → `parseCond` (`?:`) → `parseBin` → `parseUnary` → `parsePostfix` → `parsePrimary`.
  Gli operatori binari usano il *precedence climbing*: una tabella di precedenze (`PREC`) al posto
  di dieci funzioni quasi uguali.
- **Dichiarazioni**: la parte più difficile del C (`int *v[10]`, `char (*p)[3]`...). `parseDeclSpecs`
  legge il tipo base, `parseDeclarator` costruisce il tipo completo intorno al nome.
- **Controlli fatti subito**, prima di eseguire, perché danno messaggi migliori:
  - variabili non dichiarate o dichiarate due volte nello stesso blocco (il parser tiene una pila di *scope*);
  - funzioni sconosciute, con il suggerimento *"forse volevi `printf`?"* (distanza di Levenshtein, `suggest`);
  - numero di argomenti sbagliato, funzione usata prima del prototipo, `return` mancante o di troppo;
  - `scanf` senza `&` davanti a una variabile;
  - **avvisi** che non fermano il programma: `=` in una condizione, `;` subito dopo `if`/`for`/`while`.
- `expectOp(';', contesto)` è il punto da cui nasce la maggior parte degli errori di sintassi:
  sa quale simbolo manca e in quale contesto (*"manca `;` dopo return"*).

### 5. La macchina

La macchina esegue l'albero direttamente (*tree-walking interpreter*): non c'è bytecode, perché per
programmi di poche righe la semplicità vale più della velocità.

**La memoria è simulata in byte.** È la scelta più importante: senza, puntatori, array e `malloc`
non si possono spiegare.

```
0        64            1 MB              2 MB                 4 MB
│ NULL   │ dati         │ stack            │ heap                │
         │ stringhe costanti (sola lettura) + variabili globali
```

- Un solo `ArrayBuffer` da 4 MB, letto e scritto con `DataView` secondo il tipo (`int` 4 byte, `double` 8...).
  Un puntatore è un numero: l'indirizzo in questo buffer. L'indirizzo 0 è `NULL`.
- Una seconda mappa, `init`, segna **quali byte sono stati scritti**: leggere un byte mai scritto dà
  *"stai usando `x` ma non contiene ancora nessun valore"*.
- L'heap è un elenco di blocchi `{ start, size, live }`: da qui vengono gli errori di `malloc`/`free`
  (fuori dal blocco, uso dopo `free`, `free` due volte) e il conteggio dei blocchi mai liberati (`leaks`).
- Lo stack ha un puntatore `sp`: un indirizzo sopra `sp` appartiene a una funzione già finita
  (*"non restituire l'indirizzo di una variabile locale!"*).
- Scrivere nella zona delle stringhe costanti è un errore spiegato (`char *s = "ciao"; s[0] = 'C';`).

**Valori.** Un valore è `{ t: tipo, v: valore }`. `evalL` calcola dove sta qualcosa (un indirizzo,
per `x = ...`, `&x`, `v[i]`), `evalR` calcola quanto vale. Gli array portano con sé nome e lunghezza,
così l'errore dice *"stai usando v[5], ma l'array ha 3 elementi"*.

**Istruzioni.** `exec` restituisce un segnale (`NORMAL`, `BRK`, `CNT`, `RET`) invece di usare eccezioni
per `break`, `continue` e `return`: è più semplice da seguire e più veloce. Solo `exit()` usa un'eccezione (`ExitSig`).

**Funzioni.** `callUser` alloca i parametri sullo stack, crea un ambiente (una `Map` nome → `{ tipo, indirizzo }`
collegata a quello globale), esegue il corpo e ripristina lo stack.

### 6. La libreria standard

- `BUILTINS` descrive ogni funzione disponibile: libreria da includere e numero minimo di argomenti.
  Il parser la usa per i controlli, la macchina (`builtin`) per eseguirla.
- `printf` e `scanf` sono scritti a mano (`format`, `scanf`) per comportarsi come in C: larghezza,
  precisione, `%g`, `%x`, `%c`... e per spiegare gli errori tipici (*"il segnaposto `%d` vuole un intero,
  ma il valore n. 2 è un `double`. Per i numeri con la virgola usa `%f`"*).

### 7. I limiti, per non bloccare la pagina

| Limite | Valore | Messaggio |
|---|---|---|
| passi di esecuzione | 3 milioni | probabilmente un ciclo infinito |
| chiamate annidate | 900 | la ricorsione non si ferma (manca il caso base?) |
| output | 20 000 byte | troppo testo, forse un ciclo infinito con `printf` |
| memoria | 4 MB | memoria esaurita / stack overflow |

Se comunque JavaScript va in errore (`RangeError`), `run` lo trasforma in un messaggio; qualunque altra
eccezione diventa un errore `internal` invece di rompere la pagina.

### 8. Come si verifica

- `tests/c-interpreter.test.js`: comportamenti del C (`printf`, `scanf`, overflow, errori con la riga giusta,
  memoria non liberata) e la corrispondenza tra chiavi usate e testi di ogni lingua.
- `tests/levels.test.js`: **ogni livello è un test** dell'interprete. La soluzione deve superarlo,
  il codice di partenza no, in ogni lingua.

---

## Parte 2 — Un interprete per un altro linguaggio

### Prima domanda: serve davvero scriverlo?

Scrivere un interprete è il lavoro più grande del progetto. Prima di farlo, secondo la scala delle regole
del progetto (`AGENTS.md`), conviene chiedersi se basta qualcosa che esiste già. Il confronto si fa su
questi criteri:

| Criterio | Interprete scritto da noi | Runtime esistente in WebAssembly | Servizio remoto |
|---|---|---|---|
| Messaggi per principianti, in più lingue | sì, li scriviamo noi | no: messaggi originali, da "tradurre" | no: messaggi originali |
| Funziona offline, senza server | sì | sì, dopo un download di qualche MB | no |
| Il codice resta nel browser | sì | sì | no |
| Sincrono (come oggi il contratto `run`) | sì | no | no |
| Copre tutto il linguaggio | no, solo il sottoinsieme del corso | sì | sì |
| Lavoro | grande | medio (integrazione, worker, messaggi) | piccolo, più un servizio da gestire |

Un runtime asincrono richiede di rendere `async` sia `run` sia `Checker.check`, e di aggiornare
`run()` in `src/core/app.js`. Va fatto una volta sola, quando arriva il primo linguaggio che ne ha bisogno.

### Cosa serve comunque, qualunque strada si scelga

Il nucleo non cambia: si aggiunge una cartella e si rispetta il contratto (`src/languages/README.md`).

```
src/languages/python/
  language.js              id, name, fileName ('main.py'), editorMode, storageKey, run, chapters, i18n
  interpreter.js           (o l'adattatore verso il runtime scelto)
  locales/en/strings.js    testi dell'interfaccia + messaggi d'errore
  locales/en/levels.js     livelli
tests/python-interpreter.test.js
```

- `run(code, { input })` restituisce `{ ok, output, exitCode, error, warnings }`, con i messaggi
  come `[chiave, valori]`.
- In `index.html` si aggiungono i suoi `<script>` e il modo di CodeMirror 5 per l'evidenziazione
  (`mode/python/python.min.js`, `mode/rust/rust.min.js`).
- `npm test` trova da solo il nuovo linguaggio e prova tutti i suoi livelli.

### Il metodo: i livelli prima dell'interprete

È il modo più sicuro per non costruire più del necessario.

1. **Scrivi l'indice del corso** (capitoli e argomenti). Definisce il sottoinsieme del linguaggio da
   supportare: niente di più.
2. **Scrivi i livelli in inglese, con le soluzioni**, prima dell'interprete. Sono i test di accettazione:
   `npm test` fallirà finché l'interprete non saprà eseguirli.
3. **Costruisci l'interprete un capitolo alla volta**, nell'ordine della Parte 1: errori come dati →
   valori e tipi → lessico → parser → esecuzione → libreria. Dopo ogni capitolo, i suoi livelli passano.
4. **Per ogni errore tipico dei principianti** di quel capitolo, aggiungi un messaggio dedicato e un test.
5. **Metti i limiti fin dall'inizio**: passi, profondità di chiamata, dimensione dell'output.
6. **Non condividere codice con l'interprete C in anticipo.** Se il secondo interprete ha bisogno,
   per esempio, di `suggest` o dei limiti, allora si spostano in un modulo comune.

### Python

Rispetto al C, Python per principianti è **più facile da interpretare**: niente memoria simulata,
puntatori o dichiarazioni di tipo. La difficoltà si sposta altrove.

**Strada consigliata: un interprete per il sottoinsieme del corso**, sullo stesso modello di quello del C.

- **Lessico con l'indentazione.** È la parte tipica di Python: il lexer deve produrre token `INDENT` e
  `DEDENT` confrontando ogni riga con una pila di rientri. È anche la fonte degli errori più comuni dei
  principianti (rientro incoerente, tab mescolati a spazi, `:` dimenticati): meritano messaggi dedicati.
- **Valori dinamici**: `int` a precisione illimitata (`BigInt`), `float`, `bool`, `str`, `None`, `list`,
  `dict`, `tuple`, `range`. Ogni valore porta il suo tipo, controllato durante l'esecuzione
  (*"non puoi sommare un numero e una stringa: usa `str(n)`"*).
- **Nomi e scope**: locale, globale e built-in; `global` solo se il corso lo usa.
- **Eccezioni**: `ZeroDivisionError`, `IndexError`, `KeyError`, `NameError`, `TypeError`, `ValueError`
  diventano errori `runtime` con chiavi di messaggio; se il corso insegna `try/except`, vanno anche
  rappresentate come valori catturabili.
- **`input()` e `print()`**: `input()` legge una riga dall'input del livello, `print` gestisce
  `sep` ed `end` come Python.
- **Il controllo dei nomi prima di eseguire** non c'è in Python, ma un controllo leggero (nome mai
  assegnato da nessuna parte) permette di dare il suggerimento *"forse volevi..."* anche qui.

**Alternativa: Pyodide**, cioè CPython compilato in WebAssembly e caricato da CDN. Dà il Python vero,
con tutta la libreria standard. In cambio:

- il download è di diversi MB e il caricamento è asincrono, quindi serve il contratto asincrono;
- un ciclo infinito blocca la pagina: va eseguito in un Web Worker, da terminare dopo un tempo massimo;
- i messaggi sono i traceback originali di Python, in inglese: per i principianti vanno riconosciuti
  (tipo di eccezione e riga) e trasformati in chiavi del nostro `strings.js`.

Prima di sceglierla, conviene fare una prova con due o tre livelli per misurare il tempo di caricamento
e la qualità dei messaggi; le API per collegare `stdin` e `stdout` vanno verificate sulla documentazione
della versione in uso.

**Quando scegliere cosa**: se il corso resta sulle basi (variabili, condizioni, cicli, funzioni,
liste, stringhe, dizionari) l'interprete scritto da noi dà messaggi migliori e si integra senza
cambiare il nucleo. Se il corso deve usare moduli della libreria standard o librerie esterne, Pyodide.

### Rust

Rust è il caso più difficile, per una ragione didattica: **la parte che si impara di più è il
compilatore**. Tipi, mutabilità, ownership e borrowing sono controlli fatti prima di eseguire, e i loro
errori sono il cuore del corso. Un interprete che si limita a eseguire perderebbe proprio questo.

**Strada A: un interprete con controllo dei tipi e delle mosse, per un sottoinsieme**

- **Cosa supportare**, per un corso introduttivo: `let` e `let mut`, `i32`/`i64`/`f64`/`bool`/`char`,
  `String` e `&str`, `if`, `loop`, `while`, `for` su intervalli e su `Vec`, funzioni, `struct` con `impl`,
  `enum` e `match`, `Vec`, `Option` e `Result`, `println!` con `{}` e `{:?}`.
- **Tre passaggi invece di due**: parser → **type checker** (inferenza locale dei tipi di `let`,
  controllo di argomenti, ritorni e `match` esaustivi) → esecuzione. Il type checker è la parte nuova
  rispetto al C, ed è quella che produce gli errori più utili.
- **Ownership semplificata**: segnare una variabile come "spostata" quando il suo valore passa a un'altra
  (`let b = a;` con `a: String`) e dare errore se viene riusata (*"`a` è stata spostata alla riga 3"*);
  controllare che `&mut` sia unico nello stesso blocco. Il borrow checker vero (con i *non-lexical
  lifetimes*) è molto più sofisticato: il nostro sarà più severo o più permissivo nei casi limite,
  e conviene scrivere i livelli in modo da non incontrarli.
- **Esecuzione**: valori dinamici come per Python, più l'overflow degli interi (in Rust è un errore,
  il *panic*, nei programmi di debug) e i *panic* di `unwrap()` su `None`, indici fuori dai limiti,
  divisione per zero.

**Strada B: compilare con `rustc` vero, fuori dal browser**

- Un servizio che compila ed esegue (un server proprio in una sandbox, oppure un servizio pubblico
  come il Rust Playground, di cui vanno verificati limiti e condizioni d'uso).
- Dà gli errori originali di `rustc`, che sono ottimi ma in inglese e pensati per programmatori;
  richiede la rete, manda il codice degli studenti fuori dal browser e rende il contratto asincrono.
- Un `rustc` completo che giri nel browser oggi non è una soluzione pronta e leggera: se dovesse
  diventarlo, cambierebbe questa valutazione.

**Quando scegliere cosa**: per un corso introduttivo con messaggi in più lingue, la strada A limitata
ai primi capitoli (sintassi, tipi, mutabilità, funzioni, controllo di flusso, spostamenti); per un corso
che arriva a lifetime, trait e generics, la strada B.

### C++

Il caso più vicino a quello che esiste: un nuovo `src/languages/cpp/` che parte dall'interprete C e
aggiunge solo quello che serve ai primi livelli (`cout`/`cin`, `std::string`, `std::vector`, riferimenti `&`).
È anche il caso in cui ha più senso, a quel punto, spostare in un modulo comune le parti condivise.
