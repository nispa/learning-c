/* Livelli del gioco. Ogni livello:
   title, task (testo breve, `codice` tra apici inversi), code (codice di partenza),
   tests: [{input, expect, patch:[[regex, sostituzione]]}], must/mustNot/maxCount: controlli sul codice,
   noLeak: la memoria allocata deve essere liberata, hint, learn (cosa hai scoperto), solution. */
(function (root) {
const R = String.raw;
const H = R`#include <stdio.h>

`;

const CHAPTERS = [
/* ============================== 1 ============================== */
{ id: 'primi', title: 'Primi passi', levels: [
{ id: 'ciao', title: 'Il primo programma',
  task: "Premi **▶ Esegui** e guarda cosa appare sotto. Poi cambia il testo tra le virgolette perché il programma stampi `Ciao, mondo!`",
  code: H + R`int main() {
    printf("Ciao!\n");
    return 0;
}
`,
  tests: [{ expect: 'Ciao, mondo!\n' }],
  hint: "Cambia solo le parole dentro le virgolette. Lascia `\\n` alla fine.",
  learn: "`printf` stampa il testo tra le virgolette. Ogni programma C comincia da `main`.",
  solution: H + R`int main() {
    printf("Ciao, mondo!\n");
    return 0;
}
` },
{ id: 'due-righe', title: 'Due righe',
  task: "Aggiungi una seconda `printf` sotto la prima, in modo che il programma stampi due righe.",
  code: H + R`int main() {
    printf("Prima riga\n");
    return 0;
}
`,
  tests: [{ expect: 'Prima riga\nSeconda riga\n' }],
  must: [{ re: /(printf[\s\S]*){2}/, msg: "Usa due `printf`, una per riga." }],
  hint: "Copia la riga con `printf` e incollala subito sotto. Poi cambia il testo.",
  learn: "Le istruzioni vengono eseguite in ordine, dall'alto verso il basso.",
  solution: H + R`int main() {
    printf("Prima riga\n");
    printf("Seconda riga\n");
    return 0;
}
` },
{ id: 'a-capo', title: 'Andare a capo',
  task: "Il programma stampa tutto su una riga. Fai in modo che stampi `uno`, `due` e `tre` su tre righe diverse, **usando una sola printf**.",
  code: H + R`int main() {
    printf("uno due tre\n");
    return 0;
}
`,
  tests: [{ expect: 'uno\ndue\ntre\n' }],
  maxCount: [{ re: /printf/g, max: 1, msg: "Usa una sola `printf`." }],
  hint: "`\\n` vuol dire \"vai a capo\". Puoi metterlo anche in mezzo al testo.",
  learn: "`\\n` è un carattere speciale: manda a capo. Si può mettere in qualsiasi punto del testo.",
  solution: H + R`int main() {
    printf("uno\ndue\ntre\n");
    return 0;
}
` },
{ id: 'punto-virgola', title: 'Il punto e virgola',
  task: "Questo programma ha un errore. Premi **▶ Esegui**, leggi il messaggio rosso e correggi l'errore.",
  code: H + R`int main() {
    printf("Ogni istruzione finisce con ;\n")
    printf("Anche questa!\n");
    return 0;
}
`,
  tests: [{ expect: 'Ogni istruzione finisce con ;\nAnche questa!\n' }],
  hint: "Il messaggio dice il numero della riga. Guarda come finisce quella riga e confrontala con la riga sotto.",
  learn: "In C ogni istruzione finisce con il punto e virgola `;`",
  solution: H + R`int main() {
    printf("Ogni istruzione finisce con ;\n");
    printf("Anche questa!\n");
    return 0;
}
` },
{ id: 'include', title: 'La libreria',
  task: "Anche questo programma non funziona. Leggi il messaggio d'errore e correggilo.",
  code: R`int main() {
    printf("Funziona!\n");
    return 0;
}
`,
  tests: [{ expect: 'Funziona!\n' }],
  hint: "Il messaggio ti dice esattamente quale riga aggiungere all'inizio.",
  learn: "`printf` non fa parte del linguaggio: sta nella libreria `stdio.h`, che si aggiunge con `#include <stdio.h>`.",
  solution: H + R`int main() {
    printf("Funziona!\n");
    return 0;
}
` },
{ id: 'commenti', title: 'I commenti',
  task: "Trasforma in commento la riga che stampa `Non si deve vedere`. **Non cancellarla**: aggiungi `//` all'inizio.",
  code: H + R`int main() {
    // Questa riga è un commento: il computer la ignora
    printf("Si vede\n");
    printf("Non si deve vedere\n");
    return 0;
}
`,
  tests: [{ expect: 'Si vede\n' }],
  must: [{ raw: true, re: /(\/\/[^\n]*Non si deve vedere)|(\/\*[\s\S]*Non si deve vedere[\s\S]*\*\/)/, msg: "Non cancellare la riga: scrivi `//` all'inizio della riga." }],
  hint: "Scrivi `//` prima di `printf` nella riga da nascondere.",
  learn: "Tutto quello che c'è dopo `//` è un commento: serve alle persone, il computer lo ignora. Si usa anche `/* ... */` per più righe.",
  solution: H + R`int main() {
    // Questa riga è un commento: il computer la ignora
    printf("Si vede\n");
    // printf("Non si deve vedere\n");
    return 0;
}
` },
{ id: 'virgolette', title: 'Virgolette nel testo',
  task: "Fai stampare esattamente: `Il gatto fa \"miao\"` (con le virgolette intorno a miao).",
  code: H + R`int main() {
    printf("Il gatto fa miao\n");
    return 0;
}
`,
  tests: [{ expect: 'Il gatto fa "miao"\n' }],
  hint: "Una virgoletta dentro il testo chiuderebbe il testo. Per stamparla scrivi `\\\"` (barra rovesciata + virgoletta).",
  learn: "Il carattere `\\` serve a scrivere caratteri speciali: `\\n` a capo, `\\\"` virgoletta, `\\\\` barra rovesciata.",
  solution: H + R`int main() {
    printf("Il gatto fa \"miao\"\n");
    return 0;
}
` },
]},
/* ============================== 2 ============================== */
{ id: 'variabili', title: 'Variabili e operatori', levels: [
{ id: 'var-anni', title: 'Una scatola per i numeri',
  task: "Cambia **solo il valore** della variabile `anni` in modo che il programma stampi `Ho 16 anni`.",
  code: H + R`int main() {
    int anni = 15;
    printf("Ho %d anni\n", anni);
    return 0;
}
`,
  tests: [{ expect: 'Ho 16 anni\n' }],
  mustNot: [{ re: /"Ho 16/, msg: "Non scrivere 16 dentro le virgolette: cambia il valore della variabile `anni`." }],
  hint: "Il numero da cambiare è nella riga `int anni = 15;`",
  learn: "Una variabile è una scatola con un nome che contiene un valore. `int` vuol dire \"numero intero\". Nella printf, `%d` viene sostituito dal valore della variabile.",
  solution: H + R`int main() {
    int anni = 16;
    printf("Ho %d anni\n", anni);
    return 0;
}
` },
{ id: 'var-crea', title: 'Crea una variabile',
  task: "Crea una variabile `int` chiamata `punti` che vale `100`. Poi stampala così: `Punti: 100` usando `%d`.",
  code: H + R`int main() {
    // crea qui la variabile punti

    printf("Punti: \n");
    return 0;
}
`,
  tests: [{ expect: 'Punti: 100\n' }, { patch: [[/punti\s*=\s*100/, 'punti = 250']], expect: 'Punti: 250\n' }],
  must: [{ re: /int\s+punti\s*=\s*100\s*;/, msg: "Crea la variabile scrivendo `int punti = 100;`" }, { re: /%d/, msg: "Nella printf usa il segnaposto `%d`." }],
  mustNot: [{ re: /"Punti: 100/, msg: "Non scrivere 100 nel testo: usa `%d` e la variabile `punti`." }],
  hint: "Guarda il livello precedente: `int anni = 15;` e `printf(\"... %d ...\", anni);`",
  learn: "Per creare una variabile scrivi il tipo, il nome e il valore iniziale: `int punti = 100;`",
  solution: H + R`int main() {
    int punti = 100;
    printf("Punti: %d\n", punti);
    return 0;
}
` },
{ id: 'var-calcoli', title: 'Calcoli',
  task: "Il programma stampa la somma. Aggiungi due righe per stampare anche la **differenza** e il **prodotto**, come nell'output atteso.",
  code: H + R`int main() {
    int a = 7;
    int b = 5;
    printf("%d + %d = %d\n", a, b, a + b);
    return 0;
}
`,
  tests: [{ expect: '7 + 5 = 12\n7 - 5 = 2\n7 * 5 = 35\n' },
    { patch: [[/int a = 7/, 'int a = 9'], [/int b = 5/, 'int b = 4']], expect: '9 + 4 = 13\n9 - 4 = 5\n9 * 4 = 36\n' }],
  hint: "La moltiplicazione in C si scrive con l'asterisco `*`. Non cambiare le righe con `int a = 7;` e `int b = 5;`",
  learn: "Una printf può avere più segnaposto `%d`: vengono riempiti in ordine con i valori scritti dopo le virgole.",
  solution: H + R`int main() {
    int a = 7;
    int b = 5;
    printf("%d + %d = %d\n", a, b, a + b);
    printf("%d - %d = %d\n", a, b, a - b);
    printf("%d * %d = %d\n", a, b, a * b);
    return 0;
}
` },
{ id: 'var-divisione', title: 'La divisione',
  task: "Stampa il risultato della divisione `a / b` e il resto con l'operatore `%`, come nell'output atteso.",
  code: H + R`int main() {
    int a = 17;
    int b = 5;
    printf("%d / %d = %d\n", a, b, a / b);
    return 0;
}
`,
  tests: [{ expect: '17 / 5 = 3\nresto = 2\n' },
    { patch: [[/int a = 17/, 'int a = 23'], [/int b = 5/, 'int b = 6']], expect: '23 / 6 = 3\nresto = 5\n' }],
  hint: "`a % b` dà il resto della divisione. Per stampare il simbolo % dentro una printf devi scriverlo due volte: `%%`. Qui però non serve.",
  learn: "Tra numeri interi, `/` butta via la parte dopo la virgola (17 / 5 = 3). `%` dà il resto (17 % 5 = 2).",
  solution: H + R`int main() {
    int a = 17;
    int b = 5;
    printf("%d / %d = %d\n", a, b, a / b);
    printf("resto = %d\n", a % b);
    return 0;
}
` },
{ id: 'var-incremento', title: 'Più uno',
  task: "Aumenta `punti` di 1 per **tre volte**, usando ogni volta `punti++;`. Il programma deve stampare `Punti: 3`.",
  code: H + R`int main() {
    int punti = 0;
    punti++;
    printf("Punti: %d\n", punti);
    return 0;
}
`,
  tests: [{ expect: 'Punti: 3\n' }],
  must: [{ re: /(punti\s*\+\+[\s\S]*){3}/, msg: "Scrivi `punti++;` tre volte." }],
  mustNot: [{ re: /punti\s*=\s*3/, msg: "Non scrivere `punti = 3`: usa `punti++`." }],
  hint: "Le righe `punti++;` vanno prima della printf.",
  learn: "`punti++` aumenta la variabile di 1. `punti--` la diminuisce di 1. `punti += 5` la aumenta di 5.",
  solution: H + R`int main() {
    int punti = 0;
    punti++;
    punti++;
    punti++;
    printf("Punti: %d\n", punti);
    return 0;
}
` },
{ id: 'var-scambio', title: 'Scambia i valori',
  task: "Scambia i valori di `x` e `y` usando una terza variabile `t`. Non cambiare le prime due righe e non scrivere numeri.",
  code: H + R`int main() {
    int x = 3;
    int y = 8;
    // scrivi qui lo scambio

    printf("x = %d, y = %d\n", x, y);
    return 0;
}
`,
  tests: [{ expect: 'x = 8, y = 3\n' }, { patch: [[/int x = 3/, 'int x = 4'], [/int y = 8/, 'int y = 9']], expect: 'x = 9, y = 4\n' }],
  mustNot: [{ re: /^\s*[xy]\s*=\s*\d/m, msg: "Non assegnare numeri a x e y: usa solo le variabili." }],
  hint: "Come per scambiare il contenuto di due bicchieri: serve un terzo bicchiere. `int t = x;` poi `x = y;` poi...",
  learn: "`x = y;` copia il valore di y dentro x, e il vecchio valore di x si perde. Per questo serve una variabile di appoggio.",
  solution: H + R`int main() {
    int x = 3;
    int y = 8;
    int t = x;
    x = y;
    y = t;
    printf("x = %d, y = %d\n", x, y);
    return 0;
}
` },
{ id: 'var-scanf', title: 'Leggere un numero',
  task: "Il programma legge un numero con `scanf` e stampa il doppio. Cambialo perché stampi il **triplo**, come nell'output atteso. Puoi cambiare il numero nella casella **Input**.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);
    printf("Il doppio di %d è %d\n", n, n * 2);
    return 0;
}
`,
  tests: [{ input: '5', expect: 'Il triplo di 5 è 15\n' }, { input: '7', expect: 'Il triplo di 7 è 21\n' }, { input: '-2', expect: 'Il triplo di -2 è -6\n' }],
  hint: "Cambia la parola nel testo e il calcolo `n * 2`.",
  learn: "`scanf(\"%d\", &n);` legge un numero intero e lo mette in `n`. La `&` davanti a `n` è obbligatoria (scoprirai perché con i puntatori).",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    printf("Il triplo di %d è %d\n", n, n * 3);
    return 0;
}
` },
{ id: 'var-somma-input', title: 'Due numeri',
  task: "Leggi **due** numeri interi e stampa la loro somma così: `Somma: 12`",
  code: H + R`int main() {
    int a;
    scanf("%d", &a);

    return 0;
}
`,
  tests: [{ input: '7 5', expect: 'Somma: 12\n' }, { input: '100 -1', expect: 'Somma: 99\n' }, { input: '0 0', expect: 'Somma: 0\n' }],
  hint: "Crea una seconda variabile `b` e leggila con un altro `scanf`. Oppure leggi entrambi con `scanf(\"%d %d\", &a, &b);`",
  learn: "Con un solo scanf puoi leggere più valori: `scanf(\"%d %d\", &a, &b);`",
  solution: H + R`int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("Somma: %d\n", a + b);
    return 0;
}
` },
]},
/* ============================== 3 ============================== */
{ id: 'tipi', title: 'Tipi di dato', levels: [
{ id: 'tipi-char', title: 'Caratteri',
  task: "La variabile `c` contiene una lettera. Stampa la lettera e poi il suo **codice numerico**, così: `A 65`",
  code: H + R`int main() {
    char c = 'A';
    printf("%c\n", c);
    return 0;
}
`,
  tests: [{ expect: 'A 65\n' }, { patch: [[/'A'/, "'B'"]], expect: 'B 66\n' }],
  mustNot: [{ re: /65/, msg: "Non scrivere 65: fallo calcolare al computer stampando `c` con `%d`." }],
  hint: "Puoi stampare la stessa variabile due volte: una con `%c` (carattere) e una con `%d` (numero).",
  learn: "Un `char` è un piccolo numero. Ogni lettera ha un codice (codice ASCII): 'A' vale 65, 'B' 66, 'a' 97.",
  solution: H + R`int main() {
    char c = 'A';
    printf("%c %d\n", c, c);
    return 0;
}
` },
{ id: 'tipi-lettera-dopo', title: 'La lettera dopo',
  task: "Stampa la lettera che viene **dopo** quella nella variabile `c`. Con `'g'` deve stampare `h`. Non scrivere la lettera a mano.",
  code: H + R`int main() {
    char c = 'g';
    printf("%c\n", c);
    return 0;
}
`,
  tests: [{ expect: 'h\n' }, { patch: [[/'g'/, "'m'"]], expect: 'n\n' }],
  mustNot: [{ re: /'h'/, msg: "Non scrivere 'h': calcola la lettera partendo da `c`." }],
  hint: "Se un char è un numero, puoi fargli `+ 1`.",
  learn: "Con i char si può fare aritmetica: `'a' + 1` è `'b'`.",
  solution: H + R`int main() {
    char c = 'g';
    printf("%c\n", c + 1);
    return 0;
}
` },
{ id: 'tipi-float', title: 'Numeri con la virgola',
  task: "Stampa il prezzo con **due cifre dopo la virgola**, così: `Prezzo: 2.50 euro`",
  code: H + R`int main() {
    float prezzo = 2.5;
    printf("%f\n", prezzo);
    return 0;
}
`,
  tests: [{ expect: 'Prezzo: 2.50 euro\n' }, { patch: [[/=\s*2\.5\b/, '= 3.75']], expect: 'Prezzo: 3.75 euro\n' }],
  hint: "`%f` stampa 6 cifre dopo la virgola. `%.2f` ne stampa 2.",
  learn: "`float` e `double` contengono numeri con la virgola (in C si scrive con il punto: 2.5). Si stampano con `%f`; `%.2f` sceglie quante cifre.",
  solution: H + R`int main() {
    float prezzo = 2.5;
    printf("Prezzo: %.2f euro\n", prezzo);
    return 0;
}
` },
{ id: 'tipi-media', title: 'La media sbagliata',
  task: "Il programma stampa `Media: 7.00`, ma la media vera di 7, 8 e 8 è 7.67. Trova il problema e correggilo.",
  code: H + R`int main() {
    int a = 7, b = 8, c = 8;
    float media = (a + b + c) / 3;
    printf("Media: %.2f\n", media);
    return 0;
}
`,
  tests: [{ expect: 'Media: 7.67\n' }, { patch: [[/int a = 7, b = 8, c = 8/, 'int a = 6, b = 6, c = 7']], expect: 'Media: 6.33\n' }],
  hint: "`(a + b + c)` è un int e `3` è un int: la divisione tra interi butta via i decimali. Prova a dividere per `3.0`.",
  learn: "int diviso int dà sempre un int. Se almeno uno dei due è un numero con la virgola (come `3.0`) il risultato ha i decimali.",
  solution: H + R`int main() {
    int a = 7, b = 8, c = 8;
    float media = (a + b + c) / 3.0;
    printf("Media: %.2f\n", media);
    return 0;
}
` },
{ id: 'tipi-sizeof', title: 'Quanto spazio?',
  task: "Usa `sizeof` per stampare quanti byte occupano un `char`, un `int` e un `double`, come nell'output atteso.",
  code: H + R`int main() {
    printf("char: %d\n", (int)sizeof(char));
    return 0;
}
`,
  tests: [{ expect: 'char: 1\nint: 4\ndouble: 8\n' }],
  must: [{ re: /sizeof\s*\(\s*int\s*\)/, msg: "Usa `sizeof(int)`." }, { re: /sizeof\s*\(\s*double\s*\)/, msg: "Usa `sizeof(double)`." }],
  mustNot: [{ re: /"(int|double): \d/, msg: "Non scrivere i numeri a mano: usa `sizeof`." }],
  hint: "Copia la printf del char e cambia il tipo.",
  learn: "`sizeof` dice quanti byte occupa un tipo in memoria. Un byte sono 8 bit.",
  solution: H + R`int main() {
    printf("char: %d\n", (int)sizeof(char));
    printf("int: %d\n", (int)sizeof(int));
    printf("double: %d\n", (int)sizeof(double));
    return 0;
}
` },
{ id: 'tipi-overflow', title: 'Il contachilometri',
  task: "Un `unsigned char` può contenere solo i numeri da 0 a 255. Cambia il numero da sommare a `x` in modo che il programma stampi `0`.",
  code: H + R`int main() {
    unsigned char x = 250;
    x = x + 1;
    printf("%d\n", x);
    return 0;
}
`,
  tests: [{ expect: '0\n' }],
  must: [{ re: /x\s*=\s*x\s*\+\s*\d+|x\s*\+=\s*\d+/, msg: "Continua a sommare un numero a x: `x = x + ...;`" }],
  mustNot: [{ re: /x\s*=\s*0\s*;|unsigned char x = (?!250)/, msg: "Non cambiare il 250 e non scrivere `x = 0`: trova il numero giusto da sommare." }],
  hint: "Prova: 250 + 5 = 255 (il massimo). Cosa succede con un passo in più?",
  learn: "Quando si supera il massimo, il numero ricomincia da 0, come un contachilometri. Si chiama **overflow**.",
  solution: H + R`int main() {
    unsigned char x = 250;
    x = x + 6;
    printf("%d\n", x);
    return 0;
}
` },
{ id: 'tipi-cast', title: 'Tagliare i decimali',
  task: "Stampa solo la parte intera di `v`, così: `Parte intera: 9`. Usa il cast `(int)`.",
  code: H + R`int main() {
    double v = 9.99;
    printf("%f\n", v);
    return 0;
}
`,
  tests: [{ expect: 'Parte intera: 9\n' }, { patch: [[/9\.99/, '3.2']], expect: 'Parte intera: 3\n' }],
  must: [{ re: /\(\s*int\s*\)/, msg: "Usa il cast `(int)v`." }],
  hint: "`(int)v` trasforma v in un intero. Ricordati di stamparlo con `%d`, non `%f`.",
  learn: "Il **cast** cambia il tipo di un valore: `(int)9.99` diventa `9` (i decimali vengono tagliati, non arrotondati).",
  solution: H + R`int main() {
    double v = 9.99;
    printf("Parte intera: %d\n", (int)v);
    return 0;
}
` },
{ id: 'tipi-hex', title: 'Esadecimale',
  task: "Stampa il numero anche in base 16 (esadecimale) con `%x`, così: `255 in esadecimale è ff`",
  code: H + R`int main() {
    int n = 255;
    printf("%d\n", n);
    return 0;
}
`,
  tests: [{ expect: '255 in esadecimale è ff\n' }, { patch: [[/n = 255/, 'n = 4096']], expect: '4096 in esadecimale è 1000\n' }],
  must: [{ re: /%x/, msg: "Usa `%x`." }],
  hint: "Serve una printf con `%d` e `%x` e la variabile `n` scritta due volte.",
  learn: "In esadecimale si conta da 0 a 15 con le cifre 0-9 e a-f. `ff` = 15×16 + 15 = 255.",
  solution: H + R`int main() {
    int n = 255;
    printf("%d in esadecimale è %x\n", n, n);
    return 0;
}
` },
]},
/* ============================== 4 ============================== */
{ id: 'decisioni', title: 'Decisioni: if e switch', levels: [
{ id: 'if-positivo', title: 'Positivo o no',
  task: "Se il numero è maggiore di zero il programma stampa `positivo`. Aggiungi un `else` perché negli altri casi stampi `non positivo`.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);
    if (n > 0) {
        printf("positivo\n");
    }
    return 0;
}
`,
  tests: [{ input: '5', expect: 'positivo\n' }, { input: '-3', expect: 'non positivo\n' }, { input: '0', expect: 'non positivo\n' }],
  must: [{ re: /\belse\b/, msg: "Usa `else`." }],
  hint: "Dopo la `}` dell'if scrivi `else { ... }`",
  learn: "`if (condizione) { ... } else { ... }`: se la condizione è vera si esegue il primo blocco, altrimenti il secondo.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    if (n > 0) {
        printf("positivo\n");
    } else {
        printf("non positivo\n");
    }
    return 0;
}
` },
{ id: 'if-pari', title: 'Pari o dispari',
  task: "Leggi un numero e stampa `pari` oppure `dispari`.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '4', expect: 'pari\n' }, { input: '7', expect: 'dispari\n' }, { input: '0', expect: 'pari\n' }, { input: '13', expect: 'dispari\n' }],
  hint: "Un numero è pari se il resto della divisione per 2 è zero: `n % 2 == 0`. Attenzione: per confrontare si usa `==` (due uguali).",
  learn: "`==` confronta, `=` assegna. Gli altri confronti sono `!=` (diverso), `<`, `>`, `<=`, `>=`.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    if (n % 2 == 0) {
        printf("pari\n");
    } else {
        printf("dispari\n");
    }
    return 0;
}
` },
{ id: 'if-voto', title: 'Il giudizio',
  task: "Leggi un voto da 0 a 10 e stampa: `insufficiente` (meno di 6), `sufficiente` (6), `buono` (7 o 8), `ottimo` (9 o 10).",
  code: H + R`int main() {
    int voto;
    scanf("%d", &voto);
    if (voto < 6) {
        printf("insufficiente\n");
    } else if (voto == 6) {
        printf("sufficiente\n");
    }
    return 0;
}
`,
  tests: [{ input: '4', expect: 'insufficiente\n' }, { input: '6', expect: 'sufficiente\n' }, { input: '7', expect: 'buono\n' }, { input: '8', expect: 'buono\n' }, { input: '9', expect: 'ottimo\n' }, { input: '10', expect: 'ottimo\n' }, { input: '5', expect: 'insufficiente\n' }],
  hint: "Aggiungi un altro `else if` per buono e un `else` finale per ottimo.",
  learn: "Con `else if` si possono controllare tanti casi uno dopo l'altro: il primo vero vince.",
  solution: H + R`int main() {
    int voto;
    scanf("%d", &voto);
    if (voto < 6) {
        printf("insufficiente\n");
    } else if (voto == 6) {
        printf("sufficiente\n");
    } else if (voto <= 8) {
        printf("buono\n");
    } else {
        printf("ottimo\n");
    }
    return 0;
}
` },
{ id: 'if-and', title: 'Adolescente?',
  task: "Leggi un'età. Se è tra 13 e 19 (compresi) stampa `adolescente`, altrimenti `non adolescente`. Usa **un solo if** con `&&`.",
  code: H + R`int main() {
    int eta;
    scanf("%d", &eta);

    return 0;
}
`,
  tests: [{ input: '12', expect: 'non adolescente\n' }, { input: '13', expect: 'adolescente\n' }, { input: '15', expect: 'adolescente\n' }, { input: '19', expect: 'adolescente\n' }, { input: '20', expect: 'non adolescente\n' }],
  must: [{ re: /&&/, msg: "Usa l'operatore `&&` (e)." }],
  hint: "`eta >= 13 && eta <= 19` è vero solo se tutte e due le condizioni sono vere.",
  learn: "`&&` vuol dire E (tutte e due vere). `||` vuol dire O (almeno una vera). `!` vuol dire NON.",
  solution: H + R`int main() {
    int eta;
    scanf("%d", &eta);
    if (eta >= 13 && eta <= 19) {
        printf("adolescente\n");
    } else {
        printf("non adolescente\n");
    }
    return 0;
}
` },
{ id: 'if-max3', title: 'Il più grande',
  task: "Leggi tre numeri e stampa il più grande così: `Il più grande è 9`",
  code: H + R`int main() {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);

    return 0;
}
`,
  tests: [{ input: '3 9 5', expect: 'Il più grande è 9\n' }, { input: '9 3 5', expect: 'Il più grande è 9\n' }, { input: '3 5 9', expect: 'Il più grande è 9\n' }, { input: '-1 -8 -3', expect: 'Il più grande è -1\n' }, { input: '4 4 4', expect: 'Il più grande è 4\n' }],
  hint: "Crea una variabile `max = a;`. Poi: se `b` è più grande di `max`, `max = b;`. Fai lo stesso con `c`.",
  learn: "Tenere il \"migliore finora\" in una variabile e aggiornarlo è un trucco che userai tantissimo.",
  solution: H + R`int main() {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    int max = a;
    if (b > max) max = b;
    if (c > max) max = c;
    printf("Il più grande è %d\n", max);
    return 0;
}
` },
{ id: 'if-bisestile', title: 'Anno bisestile',
  task: "Un anno è bisestile se è divisibile per 4 ma non per 100, **oppure** se è divisibile per 400. Stampa `bisestile` o `non bisestile`.",
  code: H + R`int main() {
    int anno;
    scanf("%d", &anno);

    return 0;
}
`,
  tests: [{ input: '2024', expect: 'bisestile\n' }, { input: '2023', expect: 'non bisestile\n' }, { input: '1900', expect: 'non bisestile\n' }, { input: '2000', expect: 'bisestile\n' }],
  hint: "\"divisibile per 4\" si scrive `anno % 4 == 0`. Unisci le condizioni con `&&`, `!=` e `||`, usando le parentesi.",
  learn: "Le condizioni si possono combinare: `(A && B) || C`. Le parentesi aiutano a non sbagliare.",
  solution: H + R`int main() {
    int anno;
    scanf("%d", &anno);
    if ((anno % 4 == 0 && anno % 100 != 0) || anno % 400 == 0) {
        printf("bisestile\n");
    } else {
        printf("non bisestile\n");
    }
    return 0;
}
` },
{ id: 'switch-giorni', title: 'I giorni della settimana',
  task: "Completa lo `switch`: da 1 a 7 stampa il giorno (1 = lunedì ... 7 = domenica). Con altri numeri stampa `numero non valido`.",
  code: H + R`int main() {
    int g;
    scanf("%d", &g);
    switch (g) {
        case 1:
            printf("lunedì\n");
            break;
        case 2:
            printf("martedì\n");
            break;
    }
    return 0;
}
`,
  tests: [{ input: '1', expect: 'lunedì\n' }, { input: '3', expect: 'mercoledì\n' }, { input: '5', expect: 'venerdì\n' }, { input: '6', expect: 'sabato\n' }, { input: '7', expect: 'domenica\n' }, { input: '0', expect: 'numero non valido\n' }, { input: '8', expect: 'numero non valido\n' }],
  must: [{ re: /\bswitch\b/, msg: "Usa lo `switch`." }, { re: /\bdefault\s*:/, msg: "Per i numeri non validi usa `default:`" }],
  hint: "Ogni caso finisce con `break;`. Il caso \"tutti gli altri\" si scrive `default:`. Giorni: lunedì, martedì, mercoledì, giovedì, venerdì, sabato, domenica.",
  learn: "`switch` sceglie tra tanti valori precisi. Senza `break` il programma continua nel caso successivo!",
  solution: H + R`int main() {
    int g;
    scanf("%d", &g);
    switch (g) {
        case 1: printf("lunedì\n"); break;
        case 2: printf("martedì\n"); break;
        case 3: printf("mercoledì\n"); break;
        case 4: printf("giovedì\n"); break;
        case 5: printf("venerdì\n"); break;
        case 6: printf("sabato\n"); break;
        case 7: printf("domenica\n"); break;
        default: printf("numero non valido\n");
    }
    return 0;
}
` },
]},
/* ============================== 5 ============================== */
{ id: 'cicli', title: 'Cicli: ripetere', levels: [
{ id: 'for-10', title: 'Contare fino a 10',
  task: "Il ciclo stampa i numeri da 1 a 5. Cambialo perché stampi da 1 a **10**, tutti sulla **stessa riga** separati da uno spazio.",
  code: H + R`int main() {
    for (int i = 1; i <= 5; i++) {
        printf("%d\n", i);
    }
    return 0;
}
`,
  tests: [{ expect: '1 2 3 4 5 6 7 8 9 10\n' }],
  must: [{ re: /\bfor\b/, msg: "Usa il ciclo `for`." }],
  maxCount: [{ re: /printf/g, max: 2, msg: "Usa il ciclo, non tante printf." }],
  hint: "Dentro il ciclo stampa `\"%d \"` (con lo spazio, senza `\\n`). Dopo il ciclo stampa solo `\"\\n\"`.",
  learn: "`for (inizio; condizione; passo)`: `i` parte da 1, il ciclo continua finché `i <= 10`, e ogni giro fa `i++`.",
  solution: H + R`int main() {
    for (int i = 1; i <= 10; i++) {
        printf("%d ", i);
    }
    printf("\n");
    return 0;
}
` },
{ id: 'for-n', title: 'Fino a n',
  task: "Leggi un numero `n` e stampa i numeri da 1 a `n`, **uno per riga**.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '3', expect: '1\n2\n3\n' }, { input: '1', expect: '1\n' }, { input: '5', expect: '1\n2\n3\n4\n5\n' }],
  hint: "Come il livello prima, ma la condizione è `i <= n`.",
  learn: "Il numero di giri di un ciclo può dipendere da una variabile.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) {
        printf("%d\n", i);
    }
    return 0;
}
` },
{ id: 'for-rovescia', title: 'Conto alla rovescia',
  task: "Leggi `n` e stampa i numeri da `n` fino a 1, uno per riga. Alla fine stampa `Via!`",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '3', expect: '3\n2\n1\nVia!\n' }, { input: '5', expect: '5\n4\n3\n2\n1\nVia!\n' }, { input: '1', expect: '1\nVia!\n' }],
  hint: "Un ciclo può anche andare all'indietro: `for (int i = n; i >= 1; i--)`",
  learn: "`i--` diminuisce di 1. La condizione del for decide quando fermarsi.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    for (int i = n; i >= 1; i--) {
        printf("%d\n", i);
    }
    printf("Via!\n");
    return 0;
}
` },
{ id: 'for-somma', title: 'La somma',
  task: "Leggi `n` e stampa la somma dei numeri da 1 a `n`, così: `Somma: 10` (per n = 4, perché 1+2+3+4 = 10).",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);
    int somma;

    printf("Somma: %d\n", somma);
    return 0;
}
`,
  tests: [{ input: '4', expect: 'Somma: 10\n' }, { input: '10', expect: 'Somma: 55\n' }, { input: '1', expect: 'Somma: 1\n' }, { input: '100', expect: 'Somma: 5050\n' }],
  must: [{ re: /\b(for|while)\b/, msg: "Usa un ciclo." }],
  hint: "Prima del ciclo la somma deve valere 0. Nel ciclo: `somma = somma + i;` (o `somma += i;`).",
  learn: "Una variabile che accumula (un **accumulatore**) va sempre inizializzata, di solito a 0.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    int somma = 0;
    for (int i = 1; i <= n; i++) {
        somma += i;
    }
    printf("Somma: %d\n", somma);
    return 0;
}
` },
{ id: 'for-tabellina', title: 'La tabellina',
  task: "Leggi `n` e stampa la sua tabellina da 1 a 10, nel formato dell'output atteso.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '3', expect: '3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27\n3 x 10 = 30\n' },
    { input: '7', expect: '7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63\n7 x 10 = 70\n' }],
  hint: "Ogni riga ha tre numeri: `n`, `i` e `n * i`.",
  learn: "Una sola printf dentro un ciclo può produrre molte righe diverse.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    for (int i = 1; i <= 10; i++) {
        printf("%d x %d = %d\n", n, i, n * i);
    }
    return 0;
}
` },
{ id: 'while-potenze', title: 'Le potenze di 2',
  task: "Leggi `n` e stampa sulla stessa riga le potenze di 2 (1, 2, 4, 8, ...) che sono **minori o uguali** a `n`. Usa un ciclo `while`.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);
    int p = 1;

    printf("\n");
    return 0;
}
`,
  tests: [{ input: '10', expect: '1 2 4 8\n' }, { input: '1', expect: '1\n' }, { input: '64', expect: '1 2 4 8 16 32 64\n' }],
  must: [{ re: /\bwhile\b/, msg: "Usa il ciclo `while`." }],
  hint: "`while (p <= n) { stampa p; p = p * 2; }`",
  learn: "`while (condizione) { ... }` ripete finché la condizione è vera. Si usa quando non sai in anticipo quanti giri servono.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    int p = 1;
    while (p <= n) {
        printf("%d ", p);
        p = p * 2;
    }
    printf("\n");
    return 0;
}
` },
{ id: 'while-cifre', title: 'Contare le cifre',
  task: "Leggi un numero positivo e stampa quante cifre ha, così: `Cifre: 3`",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '123', expect: 'Cifre: 3\n' }, { input: '7', expect: 'Cifre: 1\n' }, { input: '100000', expect: 'Cifre: 6\n' }, { input: '45', expect: 'Cifre: 2\n' }],
  must: [{ re: /\b(while|for)\b/, msg: "Usa un ciclo." }],
  hint: "Dividere per 10 toglie l'ultima cifra: 123 / 10 = 12. Conta quante volte puoi farlo prima di arrivare a 0.",
  learn: "`n / 10` toglie l'ultima cifra, `n % 10` la dà. Sono utilissimi con i numeri.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    int cifre = 0;
    while (n > 0) {
        n = n / 10;
        cifre++;
    }
    printf("Cifre: %d\n", cifre);
    return 0;
}
` },
{ id: 'do-while', title: 'Finché non arriva lo zero',
  task: "Leggi numeri uno alla volta finché non arriva `0`. Poi stampa la somma, così: `Totale: 15`. Usa `do { ... } while (...);`",
  code: H + R`int main() {
    int x;
    int totale = 0;

    printf("Totale: %d\n", totale);
    return 0;
}
`,
  tests: [{ input: '4 5 6 0', expect: 'Totale: 15\n' }, { input: '0', expect: 'Totale: 0\n' }, { input: '10 -3 0', expect: 'Totale: 7\n' }],
  must: [{ re: /\bdo\b/, msg: "Usa `do { ... } while (...);`" }],
  hint: "Dentro il `do`: leggi `x` con scanf e aggiungilo al totale. La condizione è `x != 0`.",
  learn: "Il `do-while` esegue il blocco **almeno una volta** e controlla la condizione alla fine.",
  solution: H + R`int main() {
    int x;
    int totale = 0;
    do {
        scanf("%d", &x);
        totale += x;
    } while (x != 0);
    printf("Totale: %d\n", totale);
    return 0;
}
` },
{ id: 'quadrato', title: 'Quadrato di asterischi',
  task: "Leggi `n` e disegna un quadrato di `n` righe con `n` asterischi ciascuna.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '3', expect: '***\n***\n***\n' }, { input: '1', expect: '*\n' }, { input: '4', expect: '****\n****\n****\n****\n' }],
  hint: "Serve un ciclo dentro un ciclo. Quello esterno conta le righe. Quello interno stampa `*` n volte. Dopo il ciclo interno stampa `\\n`.",
  learn: "I **cicli annidati** (uno dentro l'altro) servono per le cose a due dimensioni, come righe e colonne.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    for (int r = 0; r < n; r++) {
        for (int c = 0; c < n; c++) {
            printf("*");
        }
        printf("\n");
    }
    return 0;
}
` },
{ id: 'triangolo', title: 'Il triangolo',
  task: "Leggi `n` e disegna un triangolo: la riga 1 ha 1 asterisco, la riga 2 ne ha 2, ... fino alla riga `n`.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '3', expect: '*\n**\n***\n' }, { input: '5', expect: '*\n**\n***\n****\n*****\n' }, { input: '1', expect: '*\n' }],
  hint: "Come il quadrato, ma il ciclo interno fa tanti giri quanto il numero della riga.",
  learn: "Il ciclo interno può usare la variabile del ciclo esterno.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    for (int r = 1; r <= n; r++) {
        for (int c = 1; c <= r; c++) {
            printf("*");
        }
        printf("\n");
    }
    return 0;
}
` },
{ id: 'break', title: 'Fermarsi con break',
  task: "Leggi `n` e trova il primo multiplo di 7 **più grande** di `n`. Usa un ciclo e `break`. Stampa così: `Il primo multiplo di 7 dopo 20 è 21`",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);
    for (int i = n + 1; ; i++) {
        // controlla qui se i è un multiplo di 7
    }
    return 0;
}
`,
  tests: [{ input: '20', expect: 'Il primo multiplo di 7 dopo 20 è 21\n' }, { input: '7', expect: 'Il primo multiplo di 7 dopo 7 è 14\n' }, { input: '0', expect: 'Il primo multiplo di 7 dopo 0 è 7\n' }],
  must: [{ re: /\bbreak\b/, msg: "Usa `break` per uscire dal ciclo." }],
  hint: "Il for senza condizione non si ferma mai da solo. Dentro: se `i % 7 == 0`, stampa e poi `break;`",
  learn: "`break` esce subito dal ciclo.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    for (int i = n + 1; ; i++) {
        if (i % 7 == 0) {
            printf("Il primo multiplo di 7 dopo %d è %d\n", n, i);
            break;
        }
    }
    return 0;
}
` },
{ id: 'continue', title: 'Saltare con continue',
  task: "Stampa i numeri da 1 a 20 sulla stessa riga, **saltando** i multipli di 3. Usa `continue`.",
  code: H + R`int main() {
    for (int i = 1; i <= 20; i++) {
        printf("%d ", i);
    }
    printf("\n");
    return 0;
}
`,
  tests: [{ expect: '1 2 4 5 7 8 10 11 13 14 16 17 19 20\n' }],
  must: [{ re: /\bcontinue\b/, msg: "Usa `continue`." }],
  hint: "Prima della printf: se `i` è multiplo di 3, `continue;`",
  learn: "`continue` salta il resto del giro e passa subito al giro successivo.",
  solution: H + R`int main() {
    for (int i = 1; i <= 20; i++) {
        if (i % 3 == 0) {
            continue;
        }
        printf("%d ", i);
    }
    printf("\n");
    return 0;
}
` },
{ id: 'indovina', title: 'Indovina il numero',
  task: "Il numero segreto è 42. Leggi tentativi finché non è indovinato. Per ogni tentativo stampa `troppo alto` o `troppo basso`. Alla fine stampa `Indovinato in 3 tentativi!` (con il numero giusto di tentativi).",
  code: H + R`int main() {
    int segreto = 42;
    int tentativo;
    int conta = 0;

    return 0;
}
`,
  tests: [{ input: '50 30 42', expect: 'troppo alto\ntroppo basso\nIndovinato in 3 tentativi!\n' }, { input: '42', expect: 'Indovinato in 1 tentativi!\n' }, { input: '1 2 100 43 41 42', expect: 'troppo basso\ntroppo basso\ntroppo alto\ntroppo alto\ntroppo basso\nIndovinato in 6 tentativi!\n' }],
  hint: "Un ciclo `do-while` con la condizione `tentativo != segreto`. Dentro: leggi, aumenta `conta`, poi usa if / else if.",
  learn: "Hai scritto un vero gioco! Cicli + decisioni + variabili bastano per tantissime cose.",
  solution: H + R`int main() {
    int segreto = 42;
    int tentativo;
    int conta = 0;
    do {
        scanf("%d", &tentativo);
        conta++;
        if (tentativo > segreto) {
            printf("troppo alto\n");
        } else if (tentativo < segreto) {
            printf("troppo basso\n");
        }
    } while (tentativo != segreto);
    printf("Indovinato in %d tentativi!\n", conta);
    return 0;
}
` },
]},
/* ============================== 6 ============================== */
{ id: 'funzioni', title: 'Funzioni', levels: [
{ id: 'fun-saluta', title: 'La prima funzione',
  task: "La funzione `saluta` stampa `Ciao!`. In `main` chiamala **tre volte**.",
  code: H + R`void saluta() {
    printf("Ciao!\n");
}

int main() {
    saluta();
    return 0;
}
`,
  tests: [{ expect: 'Ciao!\nCiao!\nCiao!\n' }],
  maxCount: [{ re: /printf/g, max: 1, msg: "Non aggiungere printf: chiama la funzione `saluta()` più volte." }],
  hint: "Per chiamare una funzione si scrive il suo nome con le parentesi: `saluta();`",
  learn: "Una funzione è un pezzo di programma con un nome. Si scrive una volta e si può usare quante volte vuoi. `void` vuol dire che non restituisce niente.",
  solution: H + R`void saluta() {
    printf("Ciao!\n");
}

int main() {
    saluta();
    saluta();
    saluta();
    return 0;
}
` },
{ id: 'fun-linea', title: 'Funzione con parametro',
  task: "Completa la funzione `linea` in modo che stampi `n` trattini `-` e poi vada a capo.",
  code: H + R`void linea(int n) {
    // scrivi qui
}

int main() {
    int n;
    scanf("%d", &n);
    linea(n);
    return 0;
}
`,
  tests: [{ input: '5', expect: '-----\n' }, { input: '1', expect: '-\n' }, { input: '12', expect: '------------\n' }],
  hint: "Dentro la funzione, `n` è una variabile normale. Usa un ciclo for.",
  learn: "I **parametri** sono i valori che passi a una funzione tra le parentesi. Dentro la funzione si usano come variabili.",
  solution: H + R`void linea(int n) {
    for (int i = 0; i < n; i++) {
        printf("-");
    }
    printf("\n");
}

int main() {
    int n;
    scanf("%d", &n);
    linea(n);
    return 0;
}
` },
{ id: 'fun-quadrato', title: 'Restituire un valore',
  task: "La funzione `quadrato` deve **restituire** `x` per `x`. Adesso restituisce sempre 0: correggila.",
  code: H + R`int quadrato(int x) {
    return 0;
}

int main() {
    int n;
    scanf("%d", &n);
    printf("%d al quadrato fa %d\n", n, quadrato(n));
    return 0;
}
`,
  tests: [{ input: '4', expect: '4 al quadrato fa 16\n' }, { input: '9', expect: '9 al quadrato fa 81\n' }, { input: '-3', expect: '-3 al quadrato fa 9\n' }],
  hint: "Cambia solo quello che c'è dopo `return`.",
  learn: "`return` restituisce un valore a chi ha chiamato la funzione. Il tipo prima del nome (`int`) dice che tipo di valore restituisce.",
  solution: H + R`int quadrato(int x) {
    return x * x;
}

int main() {
    int n;
    scanf("%d", &n);
    printf("%d al quadrato fa %d\n", n, quadrato(n));
    return 0;
}
` },
{ id: 'fun-prototipo', title: 'Prima o dopo?',
  task: "Questo programma dà un errore anche se la funzione esiste. Leggi il messaggio e correggilo **aggiungendo il prototipo** prima di `main`.",
  code: H + R`int main() {
    printf("%d\n", doppio(21));
    return 0;
}

int doppio(int x) {
    return x * 2;
}
`,
  tests: [{ expect: '42\n' }],
  must: [{ re: /int\s+doppio\s*\([^)]*\)\s*;[\s\S]*int\s+main/, msg: "Scrivi il prototipo `int doppio(int x);` sopra `main`." }],
  hint: "Il prototipo è la prima riga della funzione, seguita da `;` invece che da `{`.",
  learn: "Il compilatore legge dall'alto in basso. Il **prototipo** annuncia una funzione che verrà scritta più avanti.",
  solution: H + R`int doppio(int x);

int main() {
    printf("%d\n", doppio(21));
    return 0;
}

int doppio(int x) {
    return x * 2;
}
` },
{ id: 'fun-massimo', title: 'Il massimo di tre',
  task: "Scrivi la funzione `int massimo(int a, int b)` che restituisce il più grande tra `a` e `b`. In `main` usala per stampare il massimo di tre numeri.",
  code: H + R`// scrivi qui la funzione massimo

int main() {
    int x, y, z;
    scanf("%d %d %d", &x, &y, &z);
    printf("%d\n", massimo(massimo(x, y), z));
    return 0;
}
`,
  tests: [{ input: '3 9 5', expect: '9\n' }, { input: '9 3 5', expect: '9\n' }, { input: '1 2 3', expect: '3\n' }, { input: '-5 -2 -9', expect: '-2\n' }],
  hint: "`int massimo(int a, int b) { if (a > b) return a; ... }`",
  learn: "Il risultato di una funzione si può passare direttamente a un'altra funzione.",
  solution: H + R`int massimo(int a, int b) {
    if (a > b) {
        return a;
    }
    return b;
}

int main() {
    int x, y, z;
    scanf("%d %d %d", &x, &y, &z);
    printf("%d\n", massimo(massimo(x, y), z));
    return 0;
}
` },
{ id: 'fun-primi', title: 'I numeri primi',
  task: "Completa `primo(n)`: deve restituire 1 se `n` è primo, 0 se non lo è. Il `main` stampa i primi fino al numero letto.",
  code: H + R`int primo(int n) {
    // un numero è primo se è maggiore di 1
    // e non è divisibile per nessun numero tra 2 e n-1
    return 1;
}

int main() {
    int n;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) {
        if (primo(i)) {
            printf("%d ", i);
        }
    }
    printf("\n");
    return 0;
}
`,
  tests: [{ input: '10', expect: '2 3 5 7\n' }, { input: '20', expect: '2 3 5 7 11 13 17 19\n' }, { input: '2', expect: '2\n' }],
  hint: "Se `n < 2` restituisci 0. Poi prova tutti i divisori `d` da 2 a n-1: se `n % d == 0` restituisci 0. Se nessuno divide, alla fine restituisci 1.",
  learn: "`return` può stare dentro un ciclo: la funzione finisce subito.",
  solution: H + R`int primo(int n) {
    if (n < 2) {
        return 0;
    }
    for (int d = 2; d < n; d++) {
        if (n % d == 0) {
            return 0;
        }
    }
    return 1;
}

int main() {
    int n;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) {
        if (primo(i)) {
            printf("%d ", i);
        }
    }
    printf("\n");
    return 0;
}
` },
{ id: 'fun-fattoriale', title: 'Ricorsione: il fattoriale',
  task: "Il fattoriale di n è 1 × 2 × ... × n (e il fattoriale di 0 è 1). Scrivi `fattoriale` **senza cicli**: la funzione deve chiamare se stessa.",
  code: H + R`int fattoriale(int n) {
    // se n è 0, il risultato è 1
    // altrimenti è n * fattoriale(n - 1)
    return 1;
}

int main() {
    int n;
    scanf("%d", &n);
    printf("%d\n", fattoriale(n));
    return 0;
}
`,
  tests: [{ input: '5', expect: '120\n' }, { input: '0', expect: '1\n' }, { input: '1', expect: '1\n' }, { input: '10', expect: '3628800\n' }],
  must: [{ re: /int\s+fattoriale\s*\([^)]*\)\s*\{[\s\S]*fattoriale\s*\([\s\S]*int\s+main/, msg: "La funzione `fattoriale` deve chiamare se stessa." }],
  mustNot: [{ re: /\b(for|while)\b/, msg: "Non usare cicli: usa la ricorsione." }],
  hint: "Due casi: il **caso base** (`if (n == 0) return 1;`) e il **passo** (`return n * fattoriale(n - 1);`).",
  learn: "Una funzione che chiama se stessa è **ricorsiva**. Serve sempre un caso base, altrimenti non si ferma mai.",
  solution: H + R`int fattoriale(int n) {
    if (n == 0) {
        return 1;
    }
    return n * fattoriale(n - 1);
}

int main() {
    int n;
    scanf("%d", &n);
    printf("%d\n", fattoriale(n));
    return 0;
}
` },
{ id: 'fun-static', title: 'Una variabile che ricorda',
  task: "Il programma stampa `1 1 1`. Aggiungi **una sola parola** dentro `contatore` perché stampi `1 2 3`. Non usare variabili globali.",
  code: H + R`int contatore() {
    int volte = 0;
    volte++;
    return volte;
}

int main() {
    printf("%d ", contatore());
    printf("%d ", contatore());
    printf("%d\n", contatore());
    return 0;
}
`,
  tests: [{ expect: '1 2 3\n' }],
  must: [{ re: /static\s+int\s+volte/, msg: "La parola da aggiungere è `static`, davanti a `int volte`." }],
  hint: "Una variabile locale normale viene creata di nuovo a ogni chiamata. Una variabile `static` invece viene creata una volta sola.",
  learn: "Una variabile locale `static` conserva il suo valore tra una chiamata e l'altra (ha **durata statica**), ma si vede solo dentro la funzione.",
  solution: H + R`int contatore() {
    static int volte = 0;
    volte++;
    return volte;
}

int main() {
    printf("%d ", contatore());
    printf("%d ", contatore());
    printf("%d\n", contatore());
    return 0;
}
` },
{ id: 'fun-scope', title: 'Dove si vede una variabile',
  task: "Il programma dà errore perché `totale` è dichiarata dentro il blocco del `for`. Spostala nel posto giusto perché stampi `Totale: 15`.",
  code: H + R`int main() {
    for (int i = 1; i <= 5; i++) {
        int totale = 0;
        totale += i;
    }
    printf("Totale: %d\n", totale);
    return 0;
}
`,
  tests: [{ expect: 'Totale: 15\n' }],
  hint: "Una variabile esiste solo dentro le graffe `{ }` dove è dichiarata. Dichiarala **prima** del for.",
  learn: "Ogni variabile ha uno **scope** (visibilità): il blocco `{ }` in cui è dichiarata. Fuori da lì non esiste.",
  solution: H + R`int main() {
    int totale = 0;
    for (int i = 1; i <= 5; i++) {
        totale += i;
    }
    printf("Totale: %d\n", totale);
    return 0;
}
` },
]},
/* ============================== 7 ============================== */
{ id: 'array', title: 'Array', levels: [
{ id: 'arr-stampa', title: 'Il primo array',
  task: "L'array `voti` contiene 5 numeri. Stampali tutti sulla stessa riga usando un ciclo `for`.",
  code: H + R`int main() {
    int voti[5] = {7, 8, 6, 9, 10};
    printf("%d\n", voti[0]);
    return 0;
}
`,
  tests: [{ expect: '7 8 6 9 10\n' }, { patch: [[/\{7, 8, 6, 9, 10\}/, '{1, 2, 3, 4, 5}']], expect: '1 2 3 4 5\n' }],
  must: [{ re: /\bfor\b/, msg: "Usa un ciclo `for`." }],
  mustNot: [{ re: /voti\s*\[\s*[1-4]\s*\]/, msg: "Non scrivere gli indici a mano: usa `voti[i]` nel ciclo." }],
  hint: "Gli elementi sono `voti[0]`, `voti[1]`, ... `voti[4]`. Il ciclo va da `i = 0` a `i < 5`.",
  learn: "Un **array** è una fila di variabili dello stesso tipo. Il primo elemento ha indice **0**, l'ultimo ha indice 4 (dimensione - 1).",
  solution: H + R`int main() {
    int voti[5] = {7, 8, 6, 9, 10};
    for (int i = 0; i < 5; i++) {
        printf("%d ", voti[i]);
    }
    printf("\n");
    return 0;
}
` },
{ id: 'arr-limiti', title: 'Fuori dai limiti',
  task: "Questo programma si ferma con un errore. Leggi il messaggio e correggi il ciclo.",
  code: H + R`int main() {
    int v[5] = {10, 20, 30, 40, 50};
    for (int i = 0; i <= 5; i++) {
        printf("%d ", v[i]);
    }
    printf("\n");
    return 0;
}
`,
  tests: [{ expect: '10 20 30 40 50\n' }],
  hint: "Un array di 5 elementi ha gli indici 0, 1, 2, 3, 4. Qual è l'ultimo valore di `i` nel ciclo?",
  learn: "Uscire dai limiti di un array è uno degli errori più pericolosi del C: un compilatore vero non ti avvisa, e il programma può fare cose strane.",
  solution: H + R`int main() {
    int v[5] = {10, 20, 30, 40, 50};
    for (int i = 0; i < 5; i++) {
        printf("%d ", v[i]);
    }
    printf("\n");
    return 0;
}
` },
{ id: 'arr-media', title: 'Somma e media',
  task: "Calcola la somma degli elementi dell'array e la media (con 2 decimali), come nell'output atteso.",
  code: H + R`int main() {
    int v[6] = {4, 8, 15, 16, 23, 42};

    return 0;
}
`,
  tests: [{ expect: 'Somma: 108\nMedia: 18.00\n' }, { patch: [[/\{4, 8, 15, 16, 23, 42\}/, '{1, 2, 3, 4, 5, 6}']], expect: 'Somma: 21\nMedia: 3.50\n' }],
  hint: "Prima la somma con un ciclo. Per la media: `somma / 6.0` (con il `.0`, ricordi la media sbagliata?).",
  learn: "Somma e media sono i calcoli più comuni con gli array.",
  solution: H + R`int main() {
    int v[6] = {4, 8, 15, 16, 23, 42};
    int somma = 0;
    for (int i = 0; i < 6; i++) {
        somma += v[i];
    }
    printf("Somma: %d\n", somma);
    printf("Media: %.2f\n", somma / 6.0);
    return 0;
}
` },
{ id: 'arr-max', title: 'Il più alto',
  task: "Trova il valore più grande nell'array e la sua posizione (indice), come nell'output atteso.",
  code: H + R`int main() {
    int altezze[7] = {150, 172, 165, 181, 177, 169, 160};

    return 0;
}
`,
  tests: [{ expect: 'Massimo: 181 (posizione 3)\n' }, { patch: [[/\{150, 172, 165, 181, 177, 169, 160\}/, '{190, 172, 165, 181, 177, 169, 160}']], expect: 'Massimo: 190 (posizione 0)\n' },
    { patch: [[/\{150, 172, 165, 181, 177, 169, 160\}/, '{150, 172, 165, 181, 177, 169, 199}']], expect: 'Massimo: 199 (posizione 6)\n' }],
  hint: "Parti con `max = altezze[0]` e `pos = 0`. Nel ciclo, se trovi un valore più grande aggiorna tutte e due.",
  learn: "Per cercare il massimo si parte dal primo elemento e si confronta con tutti gli altri.",
  solution: H + R`int main() {
    int altezze[7] = {150, 172, 165, 181, 177, 169, 160};
    int max = altezze[0];
    int pos = 0;
    for (int i = 1; i < 7; i++) {
        if (altezze[i] > max) {
            max = altezze[i];
            pos = i;
        }
    }
    printf("Massimo: %d (posizione %d)\n", max, pos);
    return 0;
}
` },
{ id: 'arr-rovescio', title: 'Al contrario',
  task: "Leggi `n` (al massimo 20), poi leggi `n` numeri e mettili in un array. Stampali al contrario sulla stessa riga.",
  code: H + R`int main() {
    int n;
    int v[20];
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '5\n1 2 3 4 5', expect: '5 4 3 2 1\n' }, { input: '3\n10 -7 0', expect: '0 -7 10\n' }, { input: '1\n42', expect: '42\n' }],
  hint: "Primo ciclo: `scanf(\"%d\", &v[i]);`. Secondo ciclo all'indietro: da `i = n - 1` fino a `i >= 0`.",
  learn: "`&v[i]` è l'indirizzo dell'elemento i: scanf lo riempie come una variabile normale.",
  solution: H + R`int main() {
    int n;
    int v[20];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }
    for (int i = n - 1; i >= 0; i--) {
        printf("%d ", v[i]);
    }
    printf("\n");
    return 0;
}
` },
{ id: 'arr-conta', title: 'Contare',
  task: "Leggi 10 numeri tra 1 e 5 (voti di stelle) e conta quante volte compare ogni voto. Stampa come nell'output atteso.",
  code: H + R`int main() {
    int conta[6] = {0};
    int x;

    return 0;
}
`,
  tests: [{ input: '5 4 5 3 5 1 4 5 2 5', expect: '1 stelle: 1\n2 stelle: 1\n3 stelle: 1\n4 stelle: 2\n5 stelle: 5\n' },
    { input: '1 1 1 1 1 1 1 1 1 1', expect: '1 stelle: 10\n2 stelle: 0\n3 stelle: 0\n4 stelle: 0\n5 stelle: 0\n' }],
  hint: "Trucco: usa il voto come indice! Ogni volta che leggi `x`, fai `conta[x]++;`. Poi stampa `conta[1]` ... `conta[5]` con un ciclo.",
  learn: "`int conta[6] = {0};` mette a zero tutti gli elementi. Usare un valore come indice è un trucco potente.",
  solution: H + R`int main() {
    int conta[6] = {0};
    int x;
    for (int i = 0; i < 10; i++) {
        scanf("%d", &x);
        conta[x]++;
    }
    for (int s = 1; s <= 5; s++) {
        printf("%d stelle: %d\n", s, conta[s]);
    }
    return 0;
}
` },
{ id: 'arr-matrice', title: 'La tabella (matrice)',
  task: "Stampa la matrice 3×3 come una tabella (numeri separati da spazio) e poi la somma della diagonale (1 + 5 + 9).",
  code: H + R`int main() {
    int m[3][3] = {
        {1, 2, 3},
        {4, 5, 6},
        {7, 8, 9}
    };

    return 0;
}
`,
  tests: [{ expect: '1 2 3\n4 5 6\n7 8 9\nDiagonale: 15\n' }],
  hint: "`m[r][c]` è l'elemento alla riga r e colonna c. Due cicli annidati per stampare. La diagonale sono gli elementi con `r == c`: `m[0][0]`, `m[1][1]`, `m[2][2]`.",
  learn: "Un array a due dimensioni è un array di righe. Si scorre con due cicli annidati.",
  solution: H + R`int main() {
    int m[3][3] = {
        {1, 2, 3},
        {4, 5, 6},
        {7, 8, 9}
    };
    int diag = 0;
    for (int r = 0; r < 3; r++) {
        for (int c = 0; c < 3; c++) {
            printf("%d ", m[r][c]);
        }
        printf("\n");
        diag += m[r][r];
    }
    printf("Diagonale: %d\n", diag);
    return 0;
}
` },
]},
/* ============================== 8 ============================== */
{ id: 'stringhe', title: 'Stringhe', levels: [
{ id: 'str-lettere', title: 'Lettera per lettera',
  task: "Una stringa è un array di `char` che finisce con `'\\0'`. Stampa ogni lettera di `nome` su una riga diversa, fermandoti quando trovi `'\\0'`.",
  code: H + R`int main() {
    char nome[] = "Ada";
    printf("%s\n", nome);
    return 0;
}
`,
  tests: [{ expect: 'A\nd\na\n' }, { patch: [[/"Ada"/, '"Luca"']], expect: 'L\nu\nc\na\n' }],
  mustNot: [{ re: /strlen/, msg: "Non usare strlen: fermati quando trovi `'\\0'`." }],
  hint: "`for (int i = 0; nome[i] != '\\0'; i++)` e dentro stampa `nome[i]` con `%c`.",
  learn: "\"Ada\" in memoria sono 4 char: 'A', 'd', 'a', '\\0'. Il carattere `'\\0'` segna la fine della stringa.",
  solution: H + R`int main() {
    char nome[] = "Ada";
    for (int i = 0; nome[i] != '\0'; i++) {
        printf("%c\n", nome[i]);
    }
    return 0;
}
` },
{ id: 'str-lunghezza', title: 'Lunghezza',
  task: "Leggi una parola e stampa quante lettere ha, **senza usare strlen**. Esempio: `Lunghezza: 5`",
  code: H + R`int main() {
    char parola[50];
    scanf("%s", parola);

    return 0;
}
`,
  tests: [{ input: 'ciao', expect: 'Lunghezza: 4\n' }, { input: 'programma', expect: 'Lunghezza: 9\n' }, { input: 'x', expect: 'Lunghezza: 1\n' }],
  mustNot: [{ re: /strlen/, msg: "Non usare strlen: conta tu le lettere." }],
  hint: "Conta i caratteri finché non trovi `'\\0'`. Nota: nello scanf con `%s` non si mette la `&` davanti a un array.",
  learn: "Con `%s` scanf legge una parola (fino al primo spazio). Il nome di un array è già un indirizzo, per questo non serve la `&`.",
  solution: H + R`int main() {
    char parola[50];
    scanf("%s", parola);
    int n = 0;
    while (parola[n] != '\0') {
        n++;
    }
    printf("Lunghezza: %d\n", n);
    return 0;
}
` },
{ id: 'str-maiuscolo', title: 'TUTTO MAIUSCOLO',
  task: "Leggi una parola e stampala in MAIUSCOLO. Non usare `toupper`: se un carattere è tra `'a'` e `'z'`, trasformalo tu.",
  code: H + R`int main() {
    char s[50];
    scanf("%s", s);

    printf("%s\n", s);
    return 0;
}
`,
  tests: [{ input: 'ciao', expect: 'CIAO\n' }, { input: 'Ciao', expect: 'CIAO\n' }, { input: 'c3po', expect: 'C3PO\n' }],
  mustNot: [{ re: /toupper/, msg: "Non usare toupper: fai il calcolo con i codici dei caratteri." }],
  hint: "Le minuscole e le maiuscole distano sempre uguale: `s[i] = s[i] - 'a' + 'A';` Solo se `s[i] >= 'a' && s[i] <= 'z'`.",
  learn: "Le lettere hanno codici consecutivi: 'a'...'z' e 'A'...'Z'. Per questo si può passare dall'una all'altra con una sottrazione.",
  solution: H + R`int main() {
    char s[50];
    scanf("%s", s);
    for (int i = 0; s[i] != '\0'; i++) {
        if (s[i] >= 'a' && s[i] <= 'z') {
            s[i] = s[i] - 'a' + 'A';
        }
    }
    printf("%s\n", s);
    return 0;
}
` },
{ id: 'str-vocali', title: 'Conta le vocali',
  task: "Leggi una parola (in minuscolo) e stampa quante vocali contiene, così: `Vocali: 3`",
  code: H + R`int main() {
    char s[50];
    scanf("%s", s);

    return 0;
}
`,
  tests: [{ input: 'banana', expect: 'Vocali: 3\n' }, { input: 'sky', expect: 'Vocali: 0\n' }, { input: 'aiuole', expect: 'Vocali: 5\n' }],
  hint: "Per ogni carattere controlla se è `'a'` o `'e'` o `'i'` o `'o'` o `'u'` (con `||`). Oppure usa uno switch!",
  learn: "Scorrere una stringa carattere per carattere è la base di quasi tutti gli esercizi sulle stringhe.",
  solution: H + R`int main() {
    char s[50];
    scanf("%s", s);
    int v = 0;
    for (int i = 0; s[i] != '\0'; i++) {
        char c = s[i];
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
            v++;
        }
    }
    printf("Vocali: %d\n", v);
    return 0;
}
` },
{ id: 'str-palindroma', title: 'Palindroma',
  task: "Una parola è palindroma se si legge uguale anche al contrario (come `anna`). Leggi una parola e stampa `palindroma` o `non palindroma`.",
  code: H + R`#include <string.h>

int main() {
    char s[50];
    scanf("%s", s);
    int n = strlen(s);

    return 0;
}
`.replace(/^/, H),
  tests: [{ input: 'anna', expect: 'palindroma\n' }, { input: 'radar', expect: 'palindroma\n' }, { input: 'ciao', expect: 'non palindroma\n' }, { input: 'a', expect: 'palindroma\n' }, { input: 'ab', expect: 'non palindroma\n' }],
  hint: "Confronta `s[i]` con `s[n - 1 - i]`. Se anche una sola coppia è diversa, non è palindroma.",
  learn: "`strlen` (da `<string.h>`) restituisce la lunghezza della stringa, senza contare `'\\0'`.",
  solution: H + R`#include <string.h>

int main() {
    char s[50];
    scanf("%s", s);
    int n = strlen(s);
    int ok = 1;
    for (int i = 0; i < n / 2; i++) {
        if (s[i] != s[n - 1 - i]) {
            ok = 0;
        }
    }
    if (ok) {
        printf("palindroma\n");
    } else {
        printf("non palindroma\n");
    }
    return 0;
}
`.replace(/^/, H) },
{ id: 'str-password', title: 'La password',
  task: "Leggi una parola. Se è uguale a `segreto` stampa `Accesso consentito`, altrimenti `Accesso negato`. Il programma dà errore: leggi il messaggio.",
  code: H + R`int main() {
    char p[50];
    scanf("%s", p);
    if (p == "segreto") {
        printf("Accesso consentito\n");
    } else {
        printf("Accesso negato\n");
    }
    return 0;
}
`,
  tests: [{ input: 'segreto', expect: 'Accesso consentito\n' }, { input: 'segret', expect: 'Accesso negato\n' }, { input: 'Segreto', expect: 'Accesso negato\n' }],
  must: [{ re: /strcmp/, msg: "Usa `strcmp`." }],
  hint: "`strcmp(a, b)` restituisce 0 se le due stringhe sono uguali. Serve `#include <string.h>`.",
  learn: "Le stringhe non si confrontano con `==`: si usa `strcmp`. Per copiarle si usa `strcpy`, non `=`.",
  solution: R`#include <stdio.h>
#include <string.h>

int main() {
    char p[50];
    scanf("%s", p);
    if (strcmp(p, "segreto") == 0) {
        printf("Accesso consentito\n");
    } else {
        printf("Accesso negato\n");
    }
    return 0;
}
` },
]},
/* ============================== 9 ============================== */
{ id: 'puntatori', title: 'Puntatori', levels: [
{ id: 'ptr-base', title: 'Indirizzo e valore',
  task: "`p` contiene l'indirizzo di `x`. Cambia il valore di `x` in `42` **usando solo `p`** (non scrivere `x = ...`).",
  code: H + R`int main() {
    int x = 5;
    int *p = &x;

    printf("x vale %d\n", x);
    return 0;
}
`,
  tests: [{ expect: 'x vale 42\n' }],
  must: [{ re: /\*\s*p\s*=\s*42/, msg: "Scrivi nella variabile puntata: `*p = 42;`" }],
  mustNot: [{ re: /\bx\s*=\s*42/, msg: "Non scrivere `x = 42`: usa il puntatore." }],
  hint: "`*p` vuol dire \"la variabile a cui punta p\".",
  learn: "`&x` è l'indirizzo di x. Un puntatore (`int *p`) contiene un indirizzo. `*p` è la variabile che si trova a quell'indirizzo.",
  solution: H + R`int main() {
    int x = 5;
    int *p = &x;
    *p = 42;
    printf("x vale %d\n", x);
    return 0;
}
` },
{ id: 'ptr-swap', title: 'Lo scambio che non funziona',
  task: "La funzione `scambia` non scambia niente: lavora su copie. Riscrivila con i **puntatori** e chiamala con `&x` e `&y`.",
  code: H + R`void scambia(int a, int b) {
    int t = a;
    a = b;
    b = t;
}

int main() {
    int x = 3, y = 8;
    scambia(x, y);
    printf("x = %d, y = %d\n", x, y);
    return 0;
}
`,
  tests: [{ expect: 'x = 8, y = 3\n' }, { patch: [[/int x = 3, y = 8/, 'int x = 1, y = 2']], expect: 'x = 2, y = 1\n' }],
  must: [{ re: /void\s+scambia\s*\(\s*int\s*\*\s*\w+\s*,\s*int\s*\*\s*\w+\s*\)/, msg: "I parametri devono essere puntatori: `void scambia(int *a, int *b)`" }],
  hint: "`void scambia(int *a, int *b)`: dentro usa `*a` e `*b`. In main: `scambia(&x, &y);`",
  learn: "In C i parametri sono passati **per valore** (copie). Per modificare una variabile di chi chiama, si passa il suo indirizzo (**per indirizzo**). Ecco perché scanf vuole la `&`!",
  solution: H + R`void scambia(int *a, int *b) {
    int t = *a;
    *a = *b;
    *b = t;
}

int main() {
    int x = 3, y = 8;
    scambia(&x, &y);
    printf("x = %d, y = %d\n", x, y);
    return 0;
}
` },
{ id: 'ptr-null', title: 'Il puntatore NULL',
  task: "`cerca` restituisce l'indirizzo dell'elemento trovato, oppure `NULL` se non lo trova. Se il numero non c'è il programma si rompe: controlla il `NULL` e stampa `non trovato`.",
  code: H + R`int *cerca(int *v, int n, int x) {
    for (int i = 0; i < n; i++) {
        if (v[i] == x) {
            return &v[i];
        }
    }
    return NULL;
}

int main() {
    int v[5] = {3, 7, 1, 9, 4};
    int x;
    scanf("%d", &x);
    int *r = cerca(v, 5, x);
    printf("trovato: %d\n", *r);
    return 0;
}
`,
  tests: [{ input: '9', expect: 'trovato: 9\n' }, { input: '100', expect: 'non trovato\n' }, { input: '3', expect: 'trovato: 3\n' }],
  must: [{ re: /NULL/, msg: "Confronta il puntatore con `NULL`." }],
  hint: "`if (r == NULL) { ... } else { ... }`",
  learn: "`NULL` è un puntatore che non punta a niente. Usare `*p` quando p è NULL fa crashare il programma: controlla sempre!",
  solution: H + R`int *cerca(int *v, int n, int x) {
    for (int i = 0; i < n; i++) {
        if (v[i] == x) {
            return &v[i];
        }
    }
    return NULL;
}

int main() {
    int v[5] = {3, 7, 1, 9, 4};
    int x;
    scanf("%d", &x);
    int *r = cerca(v, 5, x);
    if (r == NULL) {
        printf("non trovato\n");
    } else {
        printf("trovato: %d\n", *r);
    }
    return 0;
}
` },
{ id: 'ptr-aritmetica', title: 'Camminare con un puntatore',
  task: "Somma gli elementi dell'array **senza usare le parentesi quadre** `[ ]`: usa il puntatore `p` e `p++`.",
  code: H + R`int main() {
    int v[5] = {10, 20, 30, 40, 50};
    int *p = v;
    int somma = 0;

    printf("Somma: %d\n", somma);
    return 0;
}
`,
  tests: [{ expect: 'Somma: 150\n' }, { patch: [[/\{10, 20, 30, 40, 50\}/, '{1, 2, 3, 4, 5}']], expect: 'Somma: 15\n' }],
  maxCount: [{ re: /\[/g, max: 1, msg: "Non usare le parentesi quadre (tranne nella dichiarazione dell'array)." }],
  hint: "`p` punta al primo elemento. `*p` è il suo valore. `p++` sposta il puntatore all'elemento successivo. Ripeti 5 volte con un ciclo.",
  learn: "Il nome di un array è l'indirizzo del suo primo elemento. `p + 1` punta all'elemento successivo: `v[i]` è la stessa cosa di `*(v + i)`.",
  solution: H + R`int main() {
    int v[5] = {10, 20, 30, 40, 50};
    int *p = v;
    int somma = 0;
    for (int i = 0; i < 5; i++) {
        somma += *p;
        p++;
    }
    printf("Somma: %d\n", somma);
    return 0;
}
` },
{ id: 'ptr-array-funzione', title: 'Passare un array',
  task: "Scrivi la funzione `int somma(int *v, int n)` che restituisce la somma dei primi `n` elementi di `v`.",
  code: H + R`// scrivi qui la funzione somma

int main() {
    int n;
    int v[20];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }
    printf("%d\n", somma(v, n));
    return 0;
}
`,
  tests: [{ input: '3\n1 2 3', expect: '6\n' }, { input: '5\n10 20 30 40 50', expect: '150\n' }, { input: '1\n-4', expect: '-4\n' }],
  hint: "Dentro la funzione puoi usare `v[i]` come con un array normale.",
  learn: "Quando passi un array a una funzione, in realtà passi l'indirizzo del primo elemento. Per questo serve anche la dimensione `n`.",
  solution: H + R`int somma(int *v, int n) {
    int s = 0;
    for (int i = 0; i < n; i++) {
        s += v[i];
    }
    return s;
}

int main() {
    int n;
    int v[20];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }
    printf("%d\n", somma(v, n));
    return 0;
}
` },
{ id: 'ptr-minmax', title: 'Due risultati',
  task: "Una funzione restituisce un solo valore con `return`. Completa `minmax` perché scriva il minimo e il massimo nelle variabili puntate da `min` e `max`.",
  code: H + R`void minmax(int *v, int n, int *min, int *max) {
    // scrivi qui
}

int main() {
    int v[6] = {5, 2, 9, 7, 3, 8};
    int piccolo, grande;
    minmax(v, 6, &piccolo, &grande);
    printf("min = %d, max = %d\n", piccolo, grande);
    return 0;
}
`,
  tests: [{ expect: 'min = 2, max = 9\n' }, { patch: [[/\{5, 2, 9, 7, 3, 8\}/, '{-1, 0, 100, 7, 3, 99}']], expect: 'min = -1, max = 100\n' }],
  hint: "Inizia con `*min = v[0]; *max = v[0];` poi confronta con gli altri elementi.",
  learn: "I puntatori permettono a una funzione di \"restituire\" più risultati, scrivendoli nelle variabili di chi la chiama.",
  solution: H + R`void minmax(int *v, int n, int *min, int *max) {
    *min = v[0];
    *max = v[0];
    for (int i = 1; i < n; i++) {
        if (v[i] < *min) *min = v[i];
        if (v[i] > *max) *max = v[i];
    }
}

int main() {
    int v[6] = {5, 2, 9, 7, 3, 8};
    int piccolo, grande;
    minmax(v, 6, &piccolo, &grande);
    printf("min = %d, max = %d\n", piccolo, grande);
    return 0;
}
` },
]},
/* ============================== 10 ============================== */
{ id: 'memoria', title: 'Memoria dinamica', levels: [
{ id: 'mem-malloc', title: 'Chiedere memoria',
  task: "Leggi `n`, chiedi con `malloc` un array di `n` interi, riempilo con i quadrati 1, 4, 9, ... e stampalo. Alla fine libera la memoria con `free`.",
  code: R`#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    scanf("%d", &n);
    int *v = malloc(n * sizeof(int));

    return 0;
}
`,
  tests: [{ input: '5', expect: '1 4 9 16 25\n' }, { input: '1', expect: '1\n' }, { input: '8', expect: '1 4 9 16 25 36 49 64\n' }],
  must: [{ re: /malloc/, msg: "Usa `malloc`." }, { re: /free\s*\(/, msg: "Libera la memoria con `free(v);`" }],
  noLeak: true,
  hint: "`v[i] = (i + 1) * (i + 1);` Poi stampa con un altro ciclo. Ultima istruzione prima di return: `free(v);`",
  learn: "`malloc` chiede memoria mentre il programma gira (sull'**heap**). `sizeof(int)` dice quanti byte servono per un int. Tutto quello che prendi con malloc va restituito con `free`.",
  solution: R`#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    scanf("%d", &n);
    int *v = malloc(n * sizeof(int));
    for (int i = 0; i < n; i++) {
        v[i] = (i + 1) * (i + 1);
    }
    for (int i = 0; i < n; i++) {
        printf("%d ", v[i]);
    }
    printf("\n");
    free(v);
    return 0;
}
` },
{ id: 'mem-free', title: 'Non dimenticare free',
  task: "Il programma stampa il risultato giusto, ma **non restituisce la memoria**. Correggilo.",
  code: R`#include <stdio.h>
#include <stdlib.h>

int main() {
    double *prezzi = malloc(3 * sizeof(double));
    prezzi[0] = 1.5;
    prezzi[1] = 2.25;
    prezzi[2] = 4.0;
    double tot = prezzi[0] + prezzi[1] + prezzi[2];
    printf("Totale: %.2f\n", tot);
    return 0;
}
`,
  tests: [{ expect: 'Totale: 7.75\n' }],
  noLeak: true,
  hint: "Aggiungi `free(prezzi);` quando non ti serve più.",
  learn: "La memoria non liberata si chiama **memory leak**: in un programma che gira a lungo può finire tutta la memoria.",
  solution: R`#include <stdio.h>
#include <stdlib.h>

int main() {
    double *prezzi = malloc(3 * sizeof(double));
    prezzi[0] = 1.5;
    prezzi[1] = 2.25;
    prezzi[2] = 4.0;
    double tot = prezzi[0] + prezzi[1] + prezzi[2];
    printf("Totale: %.2f\n", tot);
    free(prezzi);
    return 0;
}
` },
{ id: 'mem-dopo-free', title: 'Troppo presto',
  task: "Il programma usa la memoria **dopo** averla liberata. Sistema l'ordine delle istruzioni.",
  code: R`#include <stdio.h>
#include <stdlib.h>

int main() {
    int *p = malloc(sizeof(int));
    *p = 123;
    free(p);
    printf("Valore: %d\n", *p);
    return 0;
}
`,
  tests: [{ expect: 'Valore: 123\n' }],
  noLeak: true,
  hint: "`free` va messo dopo l'ultimo uso di `p`.",
  learn: "Dopo `free(p)` la memoria non è più tua: usarla è un errore grave (**use after free**).",
  solution: R`#include <stdio.h>
#include <stdlib.h>

int main() {
    int *p = malloc(sizeof(int));
    *p = 123;
    printf("Valore: %d\n", *p);
    free(p);
    return 0;
}
` },
]},
/* ============================== 11 ============================== */
{ id: 'struct', title: 'Strutture', levels: [
{ id: 'struct-punto', title: 'La prima struct',
  task: "La struct `Punto` ha due campi, `x` e `y`. Dai a `y` il valore 4 e stampa il punto così: `(3, 4)`",
  code: H + R`struct Punto {
    int x;
    int y;
};

int main() {
    struct Punto p;
    p.x = 3;
    printf("(%d)\n", p.x);
    return 0;
}
`,
  tests: [{ expect: '(3, 4)\n' }],
  must: [{ re: /p\.y\s*=\s*4/, msg: "Assegna il campo: `p.y = 4;`" }],
  hint: "I campi si usano con il punto: `p.x`, `p.y`.",
  learn: "Una **struct** raggruppa più variabili (campi) sotto un solo nome. Ai campi si accede con il punto.",
  solution: H + R`struct Punto {
    int x;
    int y;
};

int main() {
    struct Punto p;
    p.x = 3;
    p.y = 4;
    printf("(%d, %d)\n", p.x, p.y);
    return 0;
}
` },
{ id: 'struct-persona', title: 'Una persona',
  task: "Leggi un nome e un'età dentro la struct `p` e stampa: `Ada ha 15 anni`",
  code: H + R`typedef struct {
    char nome[30];
    int eta;
} Persona;

int main() {
    Persona p;

    return 0;
}
`,
  tests: [{ input: 'Ada 15', expect: 'Ada ha 15 anni\n' }, { input: 'Linus 55', expect: 'Linus ha 55 anni\n' }],
  hint: "`scanf(\"%s %d\", p.nome, &p.eta);` (il nome è un array: niente `&`).",
  learn: "`typedef` dà un nome nuovo a un tipo: così puoi scrivere `Persona` invece di `struct ...`.",
  solution: H + R`typedef struct {
    char nome[30];
    int eta;
} Persona;

int main() {
    Persona p;
    scanf("%s %d", p.nome, &p.eta);
    printf("%s ha %d anni\n", p.nome, p.eta);
    return 0;
}
` },
{ id: 'struct-puntatore', title: 'Spostare un punto',
  task: "Completa `sposta`: deve aggiungere `dx` alla `x` e `dy` alla `y` del punto. Riceve un **puntatore**, quindi usa la freccia `->`.",
  code: H + R`struct Punto {
    int x;
    int y;
};

void sposta(struct Punto *p, int dx, int dy) {
    // scrivi qui
}

int main() {
    struct Punto a = {1, 1};
    int dx, dy;
    scanf("%d %d", &dx, &dy);
    sposta(&a, dx, dy);
    printf("(%d, %d)\n", a.x, a.y);
    return 0;
}
`,
  tests: [{ input: '2 3', expect: '(3, 4)\n' }, { input: '-1 0', expect: '(0, 1)\n' }],
  must: [{ re: /->/, msg: "Usa la freccia: `p->x`." }],
  hint: "`p->x += dx;` è lo stesso di `(*p).x += dx;`",
  learn: "Con un puntatore a struct si usa `->` invece del punto.",
  solution: H + R`struct Punto {
    int x;
    int y;
};

void sposta(struct Punto *p, int dx, int dy) {
    p->x += dx;
    p->y += dy;
}

int main() {
    struct Punto a = {1, 1};
    int dx, dy;
    scanf("%d %d", &dx, &dy);
    sposta(&a, dx, dy);
    printf("(%d, %d)\n", a.x, a.y);
    return 0;
}
` },
{ id: 'struct-array', title: 'La classe',
  task: "L'array `classe` contiene 4 studenti. Trova chi ha il voto più alto e stampa: `Il migliore è Bea con 9`",
  code: H + R`typedef struct {
    char nome[20];
    int voto;
} Studente;

int main() {
    Studente classe[4] = {
        {"Ugo", 7},
        {"Bea", 9},
        {"Leo", 6},
        {"Ada", 8}
    };

    return 0;
}
`,
  tests: [{ expect: 'Il migliore è Bea con 9\n' }, { patch: [[/\{"Leo", 6\}/, '{"Leo", 10}']], expect: 'Il migliore è Leo con 10\n' }],
  hint: "Come il massimo in un array: tieni l'indice del migliore e confronta `classe[i].voto`.",
  learn: "Un array di struct è come una tabella: ogni elemento è una riga, ogni campo è una colonna.",
  solution: H + R`typedef struct {
    char nome[20];
    int voto;
} Studente;

int main() {
    Studente classe[4] = {
        {"Ugo", 7},
        {"Bea", 9},
        {"Leo", 6},
        {"Ada", 8}
    };
    int best = 0;
    for (int i = 1; i < 4; i++) {
        if (classe[i].voto > classe[best].voto) {
            best = i;
        }
    }
    printf("Il migliore è %s con %d\n", classe[best].nome, classe[best].voto);
    return 0;
}
` },
]},
/* ============================== 12 ============================== */
{ id: 'preprocessore', title: 'Il preprocessore', levels: [
{ id: 'pp-define', title: '#define',
  task: "Il numero 5 è scritto in tre posti. Crea `#define N 8` in cima e usa `N` al posto del 5 ovunque, così il programma stampa i numeri da 1 a 8.",
  code: H + R`int main() {
    int v[5];
    for (int i = 0; i < 5; i++) {
        v[i] = i + 1;
    }
    for (int i = 0; i < 5; i++) {
        printf("%d ", v[i]);
    }
    printf("\n");
    return 0;
}
`,
  tests: [{ expect: '1 2 3 4 5 6 7 8\n' }],
  must: [{ re: /#define\s+N\s+8/, msg: "Scrivi `#define N 8` sotto l'include." }],
  mustNot: [{ re: /\b5\b/, msg: "Usa `N` al posto del 5." }],
  maxCount: [{ re: /\b8\b/g, max: 1, msg: "Il numero 8 deve comparire solo nella `#define`: altrove usa `N`." }],
  hint: "Dopo la `#define`, scrivi `int v[N];` e `i < N` nei due cicli.",
  learn: "`#define` sostituisce un nome con un valore **prima** della compilazione. Se un numero cambia, lo cambi in un posto solo.",
  solution: R`#include <stdio.h>
#define N 8

int main() {
    int v[N];
    for (int i = 0; i < N; i++) {
        v[i] = i + 1;
    }
    for (int i = 0; i < N; i++) {
        printf("%d ", v[i]);
    }
    printf("\n");
    return 0;
}
` },
{ id: 'pp-macro', title: 'La macro con la trappola',
  task: "`QUADRATO(2 + 3)` dovrebbe fare 25, ma il programma stampa 11. Correggi la macro (non cambiare `main`).",
  code: R`#include <stdio.h>
#define QUADRATO(x) x * x

int main() {
    printf("%d\n", QUADRATO(2 + 3));
    return 0;
}
`,
  tests: [{ expect: '25\n' }],
  must: [{ re: /printf\("%d\\n", QUADRATO\(2 \+ 3\)\)/, msg: "Non cambiare la riga con la printf: correggi la #define." }],
  hint: "La macro sostituisce il testo così com'è: diventa `2 + 3 * 2 + 3`. Metti le parentesi intorno a ogni `x` e a tutto: `((x) * (x))`",
  learn: "Le macro fanno una sostituzione di testo, non un calcolo. Per questo nelle macro si mettono sempre tante parentesi.",
  solution: R`#include <stdio.h>
#define QUADRATO(x) ((x) * (x))

int main() {
    printf("%d\n", QUADRATO(2 + 3));
    return 0;
}
` },
{ id: 'pp-debug', title: 'Spegnere il debug',
  task: "I messaggi `[debug]` servono solo mentre si scrive il programma. Spegnili **senza cancellare le printf**: basta una modifica alla riga con `#define DEBUG`.",
  code: R`#include <stdio.h>
#define DEBUG

int main() {
    int somma = 0;
    for (int i = 1; i <= 3; i++) {
        somma += i;
#ifdef DEBUG
        printf("[debug] i = %d, somma = %d\n", i, somma);
#endif
    }
    printf("Risultato: %d\n", somma);
    return 0;
}
`,
  tests: [{ expect: 'Risultato: 6\n' }],
  must: [{ re: /#ifdef\s+DEBUG[\s\S]*\[debug\][\s\S]*#endif/, msg: "Non cancellare il blocco `#ifdef DEBUG ... #endif`." }],
  hint: "Se `DEBUG` non è definito, il codice tra `#ifdef DEBUG` e `#endif` sparisce. Puoi commentare la riga `#define DEBUG`.",
  learn: "Con `#ifdef` il preprocessore include o toglie pezzi di codice. È la **compilazione condizionale**.",
  solution: R`#include <stdio.h>
// #define DEBUG

int main() {
    int somma = 0;
    for (int i = 1; i <= 3; i++) {
        somma += i;
#ifdef DEBUG
        printf("[debug] i = %d, somma = %d\n", i, somma);
#endif
    }
    printf("Risultato: %d\n", somma);
    return 0;
}
` },
]},
];

if (typeof module === 'object' && module.exports) module.exports = CHAPTERS;
else root.CLevels = CHAPTERS;
})(typeof self !== 'undefined' ? self : this);
