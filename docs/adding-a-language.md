# Adding a language

This guide explains how to translate the course into a new language (French, Spanish, German...).
It is about the **language people read**. To add a new *programming* language (C++, Rust...),
see [src/languages/README.md](../src/languages/README.md) instead.

You do not need to know Italian: **English is the reference** for every translation.
Ignore the `it` files and always start from the `en` ones.

## What you will translate

| What | File | Size |
|---|---|---|
| Interface (buttons, menus, results) | `src/i18n/<code>.js` | ~80 short texts |
| C course: interface texts and interpreter error messages | `src/languages/c/locales/<code>/strings.js` | ~250 messages |
| C course: the levels | `src/languages/c/locales/<code>/levels.js` | 81 levels in 12 chapters |

The levels are by far the largest part. They are translated **completely**: not only the
instructions, but also the code, the text the programs print and the expected output.

## Before you start

- Install [Node.js](https://nodejs.org) 20 or newer. You need it only to run the tests (`npm test`);
  there is nothing to install with npm.
- Choose the **language code**: two lowercase letters from ISO 639-1, for example `fr`, `es`, `de`.
  The app matches only these two letters, so regional variants such as `pt-BR` and `pt-PT`
  cannot exist side by side.
- The test messages are in Italian. The table in [When a test fails](#when-a-test-fails) explains each one.

In this guide the new language is French (`fr`): replace it with your code.

## 1. Interface texts

1. Copy `src/i18n/en.js` to `src/i18n/fr.js`.
2. In the copy, change the line that registers the file, near the top:

   ```js
   else (root.I18N = root.I18N || {}).en = dict;   // before
   else (root.I18N = root.I18N || {}).fr = dict;   // after
   ```

3. Translate every value. Set `'locale.name'` to the name of the language **in the language itself**
   (`'Français'`): it is what people see in the language menu of the settings.

## 2. Course texts

1. Copy the folder `src/languages/c/locales/en/` to `src/languages/c/locales/fr/`.
2. In **both** copied files, change the line that registers the file. `en` appears twice on it.
   In `strings.js` it is near the top:

   ```js
   else ((root.CLocales = root.CLocales || {}).en = root.CLocales.en || {}).strings = dict;   // before
   else ((root.CLocales = root.CLocales || {}).fr = root.CLocales.fr || {}).strings = dict;   // after
   ```

   In `levels.js` it is the second to last line, and ends with `.levels = CHAPTERS;`.
3. Translate `strings.js` following the rules in [Translating texts](#translating-texts).
4. Translate `levels.js` following the rules in [Translating levels](#translating-levels).

Tip: since you start from a copy of English, the parts you have not translated yet still pass the
tests. You can work one chapter at a time and run the tests after each one.

## 3. Load the files

Add three `<script>` lines to `index.html`, next to the existing ones of the same kind:

```html
<script src="src/i18n/en.js"></script>
<script src="src/i18n/it.js"></script>
<script src="src/i18n/fr.js"></script>                          <!-- new -->
...
<script src="src/languages/c/locales/it/strings.js"></script>
<script src="src/languages/c/locales/it/levels.js"></script>
<script src="src/languages/c/locales/fr/strings.js"></script>   <!-- new -->
<script src="src/languages/c/locales/fr/levels.js"></script>    <!-- new -->
<script src="src/languages/c/language.js"></script>
```

The course files must come **before** `language.js`. If you forget a line, `npm test` tells you which one.

## 4. Run the tests

```sh
npm test
```

All the tests must pass. They check, among other things, that:

- your files have exactly the same keys as English, with the same `{placeholders}`;
- every level, in your language, is solved by its solution and **not** solved by its starting code;
- your chapters and levels have the same ids, in the same order, as English.

While translating the levels, you can run only the tests of your language:

```sh
node --test --test-name-pattern="c/fr/"
```

### When a test fails

| Message (in Italian) | Meaning | What to do |
|---|---|---|
| `le chiavi devono essere quelle dell'inglese` | A key is missing or added | Compare with the English file: the diff below the message lists the keys |
| `segnaposto diversi in "key"` | A `{placeholder}` was translated, removed or added | Keep every `{name}` exactly as in English |
| `"key" è plurale, serve almeno "other"` | A plural is missing the `other` form | See [Plurals](#plurals) |
| `serve il nome della lingua nella lingua stessa` | `locale.name` is empty | Write the name of your language |
| `"fr" non è una lingua dell'interfaccia` | Course texts exist but `src/i18n/fr.js` does not | Do step 1 |
| `chiavi mancanti` / `chiavi non usate` | `strings.js` lacks interpreter messages, or has extra ones | Compare with the English `strings.js` |
| `stessi capitoli e livelli dell'inglese` | A chapter or level id is different, or in a different order | Never change `id` values or the order |
| `manca <script src="..."> in index.html` | A file is not loaded | Do step 3 |
| `il codice di partenza supera già il livello` | The starting `code` already solves the level | The starting code must keep its mistake or its missing part |
| `la soluzione non supera il livello: {...}` | The `solution` does not solve the level | Look at `kind` in the details, see below |

For `la soluzione non supera il livello`, the `kind` in the details says why:

- `output`: the solution prints `got`, but the test expects `expect`. Usually a text was translated
  in the code but not in `expect`, or the other way round. Spaces and punctuation count.
- `rule`: a check in `must`, `mustNot` or `maxCount` failed; `msg` tells which one. Its regular
  expression probably still contains an English name you renamed.
- `patch`: a regular expression in `patch` no longer finds its text in the code (see [Translating levels](#translating-levels)).
- `error`: the solution does not compile or crashes; `error` contains the C error.

## 5. Try it in the browser

Open `index.html?locale=fr`, or choose the language in **Settings**: the choice is remembered.

Check at least:

- the header, the settings and the confirmation dialogs;
- a level with an **Input** box (chapter 2, *Reading a number*);
- a few errors: delete a `;`, misspell `printf`, use an undeclared variable;
- a wrong output, to see the comparison table;
- the page on a phone-sized window: long words must not break the layout.

## Translating texts

These rules apply to `src/i18n/fr.js` and to `strings.js`.

- **Translate only the values**, never the keys (`'err.noMain'`, `'run'`...).
- **Keep every `{placeholder}`**. You can move it inside the sentence, but not rename or remove it.
- **Keep the markup**: `` `code` `` and `**bold**` are the only ones. Do not translate C code inside
  messages (`int main()`, `#include <stdio.h>`, `printf`, `%d`, `&x`).
- **Write for beginners**: short sentences, second person, and say what to do, not only what is wrong.
  The interpreter messages are often the first thing a student reads after a mistake.
- `'run.shortcut'` is the keyboard shortcut as people know it in your language (`Ctrl+Entrée`).
- `'app.name'` is the name of the course (`Step by Step`): translate it or keep it, as you prefer.

### Messages built from pieces

Some interpreter messages contain other messages. The keys that start with `ctx.`, `frag.` and
`hint.` are **pieces** that end up inside another sentence. For example:

```js
'err.expectedCtx': 'I expected \'{v}\' {ctx}, but I found {found}. {hint}',
'ctx.after': 'after {what}',          // {ctx} can be this piece...
'frag.endOfProgram': 'the end of the program',   // ...and {found} this one
```

The result is: *I expected '(' after for, but I found the end of the program.*

- Before translating a piece, search for where it is used (the placeholder with the same role
  in the other messages) and check that the full sentence reads well.
- If the grammar of your language does not fit, change the **sentence around the placeholder**,
  not the piece alone.
- `{suggest}` and `{hint}` at the end of a message are sometimes empty: the sentence must also
  make sense without them.

### Plurals

A text with forms for different numbers is an object:

```js
'frag.values': { one: '{n} value', other: '{n} values' },
```

The categories are the ones of your language in the browser's `Intl.PluralRules`. To see them,
run this in Node or in the browser console:

```js
new Intl.PluralRules('fr').resolvedOptions().pluralCategories   // [ 'one', 'many', 'other' ]
```

Write the categories your language needs. `other` is always required and is used when a category is missing.

## Translating levels

Each level is an object. Some fields are translated and some must not be touched:

```js
{ id: 'var-anni', title: 'A box for numbers',      // id: never change it
  task: '...', hint: '...', learn: '...',          // translate
  code: H + R`...`,                                // translate the texts inside the C code
  tests: [{ input: '5', expect: '...' }],          // keep consistent with the code
  must: [{ re: /.../, msg: '...' }],               // translate msg, update re if needed
  solution: H + R`...` },                          // translate like code
```

### Never change

- `id` of chapters and levels, and their order. Saved progress depends on them.
- The number of tests, `noLeak`, and the `H` and `R` helpers.
- The **kind** of exercise. If the starting code has a mistake (a missing `;`, a wrong loop),
  the translated starting code must have the same mistake.

### Translate everything people read

- Chapter titles, level titles, `task`, `hint`, `learn`, and every `msg`.
- In `code` and `solution`: the texts in `printf`, the comments, and the names of variables
  and functions when they are words (`age`, `total`, `is_prime`).

### Keep everything consistent

A level only works if all its parts agree. When you change a text or a name, update it everywhere.
For example, in the level *Create a variable* (`var-crea`) a French translation could rename
`points` to `score` and print `Score : 100`:

| Where | English | French |
|---|---|---|
| `code` and `solution` | `int points = 100;` | `int score = 100;` |
| `task`, `hint`, `learn` | ``variable called `points` `` | ``variable appelée `score` `` |
| `tests[].expect` | `'Points: 100\n'` | `'Score : 100\n'` |
| `must` | `/int\s+points\s*=\s*100\s*;/` | `/int\s+score\s*=\s*100\s*;/` |
| `mustNot` | `/"Points: 100/` | `/"Score : 100/` |
| `patch` (and its `expect`) | `[[/points\s*=\s*100/, 'points = 250']]` | `[[/score\s*=\s*100/, 'score = 250']]` |

`patch` is how a level checks that the student did not just print the expected answer: the test
rewrites a line of the student's code (for example a starting value) and runs it again. Its regular
expression must find that line both in the starting code and in the solution.

### C rules for names and texts

- **Names must be valid C names**: letters without accents, digits and `_`, not starting with a digit.
  Use `annee`, not `année`.
- **Names must not be C keywords or library functions**. For example the Italian `doppio` ("double")
  became `twice` in English, because `double` is a C type. Keywords to avoid include `int`, `char`,
  `short`, `long`, `float`, `double`, `void`, `if`, `else`, `for`, `while`, `do`, `switch`, `case`,
  `default`, `break`, `continue`, `return`, `struct`, `union`, `enum`, `typedef`, `static`, `const`,
  `sizeof`, `signed`, `unsigned`; and functions such as `printf`, `scanf`, `strlen`, `free`, `exit`.
- **Accented letters are fine in printed texts** (`printf("Très bien\n");`), but:
  - not in single quotes: `'é'` is not a valid `char`;
  - in exercises that work letter by letter (counting letters, uppercase, palindromes),
    the test inputs must use only letters without accents. An accented letter takes 2 bytes,
    so `été` would have length 5 and would not become uppercase.

### Writing the texts in the file

- Inside `` R`...` `` blocks (the C code), write C exactly as it is: `printf("Hello\n");`.
- Inside normal JavaScript strings (`"..."` or `'...'`), a backslash must be doubled:
  write ``"Leave `\\n` at the end"`` to show *Leave `\n` at the end*.
- In `expect`, `\n` is a real new line: `'Sum: 12\n'`. Spaces and punctuation must match exactly;
  only spaces at the end of a line and empty lines at the end are ignored.
- If `task` shows a text the program must print (`` `Sum: 12` ``), it must match `expect`.

## Checklist

- [ ] `src/i18n/fr.js`, `src/languages/c/locales/fr/strings.js` and `levels.js` exist,
      each with its registration line changed to `fr`.
- [ ] Three `<script>` lines added to `index.html`.
- [ ] `'locale.name'` is the name of the language in the language itself.
- [ ] No English left: search the three files for a few common English words.
- [ ] `npm test` passes.
- [ ] Tried in the browser with `?locale=fr`, including a few errors.
