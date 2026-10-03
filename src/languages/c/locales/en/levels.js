/* C course levels in English: the reference locale. The format is described in src/languages/README.md.
   Every other locale must have the same chapters and the same level ids, in the same order (npm test checks it):
   the saved progress uses the ids. Code, expected output and checks are translated together. */
(function (root) {
const R = String.raw;
const H = R`#include <stdio.h>

`;

const CHAPTERS = [
/* ============================== 1 ============================== */
{ id: 'primi', title: 'First steps', levels: [
{ id: 'ciao', title: 'Your first program',
  task: "Press **▶ Run** and look at what appears below. Then change the text between the quotes so that the program prints `Hello, world!`",
  code: H + R`int main() {
    printf("Hello!\n");
    return 0;
}
`,
  tests: [{ expect: 'Hello, world!\n' }],
  hint: "Change only the words inside the quotes. Leave `\\n` at the end.",
  learn: "`printf` prints the text between the quotes. Every C program starts from `main`.",
  solution: H + R`int main() {
    printf("Hello, world!\n");
    return 0;
}
` },
{ id: 'due-righe', title: 'Two lines',
  task: "Add a second `printf` below the first one, so that the program prints two lines.",
  code: H + R`int main() {
    printf("First line\n");
    return 0;
}
`,
  tests: [{ expect: 'First line\nSecond line\n' }],
  must: [{ re: /(printf[\s\S]*){2}/, msg: "Use two `printf`, one per line." }],
  hint: "Copy the line with `printf` and paste it right below. Then change the text.",
  learn: "Statements are run in order, from top to bottom.",
  solution: H + R`int main() {
    printf("First line\n");
    printf("Second line\n");
    return 0;
}
` },
{ id: 'a-capo', title: 'New lines',
  task: "The program prints everything on one line. Make it print `one`, `two` and `three` on three different lines, **using a single printf**.",
  code: H + R`int main() {
    printf("one two three\n");
    return 0;
}
`,
  tests: [{ expect: 'one\ntwo\nthree\n' }],
  maxCount: [{ re: /printf/g, max: 1, msg: "Use a single `printf`." }],
  hint: "`\\n` means \"go to a new line\". You can also put it in the middle of the text.",
  learn: "`\\n` is a special character: it starts a new line. It can go anywhere in the text.",
  solution: H + R`int main() {
    printf("one\ntwo\nthree\n");
    return 0;
}
` },
{ id: 'punto-virgola', title: 'The semicolon',
  task: "This program has a mistake. Press **▶ Run**, read the red message and fix the mistake.",
  code: H + R`int main() {
    printf("Every statement ends with ;\n")
    printf("This one too!\n");
    return 0;
}
`,
  tests: [{ expect: 'Every statement ends with ;\nThis one too!\n' }],
  hint: "The message tells you the line number. Look at how that line ends and compare it with the line below.",
  learn: "In C every statement ends with a semicolon `;`",
  solution: H + R`int main() {
    printf("Every statement ends with ;\n");
    printf("This one too!\n");
    return 0;
}
` },
{ id: 'include', title: 'The library',
  task: "This program does not work either. Read the error message and fix it.",
  code: R`int main() {
    printf("It works!\n");
    return 0;
}
`,
  tests: [{ expect: 'It works!\n' }],
  hint: "The message tells you exactly which line to add at the top.",
  learn: "`printf` is not part of the language: it lives in the `stdio.h` library, which you add with `#include <stdio.h>`.",
  solution: H + R`int main() {
    printf("It works!\n");
    return 0;
}
` },
{ id: 'commenti', title: 'Comments',
  task: "Turn the line that prints `Should not be seen` into a comment. **Do not delete it**: add `//` at the start.",
  code: H + R`int main() {
    // This line is a comment: the computer ignores it
    printf("Visible\n");
    printf("Should not be seen\n");
    return 0;
}
`,
  tests: [{ expect: 'Visible\n' }],
  must: [{ raw: true, re: /(\/\/[^\n]*Should not be seen)|(\/\*[\s\S]*Should not be seen[\s\S]*\*\/)/, msg: "Do not delete the line: write `//` at the start of the line." }],
  hint: "Write `//` before `printf` on the line to hide.",
  learn: "Everything after `//` is a comment: it is for people, the computer ignores it. You can also use `/* ... */` for several lines.",
  solution: H + R`int main() {
    // This line is a comment: the computer ignores it
    printf("Visible\n");
    // printf("Should not be seen\n");
    return 0;
}
` },
{ id: 'virgolette', title: 'Quotes in the text',
  task: "Make it print exactly: `The cat says \"meow\"` (with the quotes around meow).",
  code: H + R`int main() {
    printf("The cat says meow\n");
    return 0;
}
`,
  tests: [{ expect: 'The cat says "meow"\n' }],
  hint: "A quote inside the text would close the text. To print it write `\\\"` (backslash + quote).",
  learn: "The character `\\` is used to write special characters: `\\n` new line, `\\\"` quote, `\\\\` backslash.",
  solution: H + R`int main() {
    printf("The cat says \"meow\"\n");
    return 0;
}
` },
]},
/* ============================== 2 ============================== */
{ id: 'variabili', title: 'Variables and operators', levels: [
{ id: 'var-anni', title: 'A box for numbers',
  task: "Change **only the value** of the variable `age` so that the program prints `I am 16 years old`.",
  code: H + R`int main() {
    int age = 15;
    printf("I am %d years old\n", age);
    return 0;
}
`,
  tests: [{ expect: 'I am 16 years old\n' }],
  mustNot: [{ re: /"I am 16/, msg: "Do not write 16 inside the quotes: change the value of the variable `age`." }],
  hint: "The number to change is on the line `int age = 15;`",
  learn: "A variable is a box with a name that holds a value. `int` means \"integer number\". In printf, `%d` is replaced by the value of the variable.",
  solution: H + R`int main() {
    int age = 16;
    printf("I am %d years old\n", age);
    return 0;
}
` },
{ id: 'var-crea', title: 'Create a variable',
  task: "Create an `int` variable called `points` with the value `100`. Then print it like this: `Points: 100` using `%d`.",
  code: H + R`int main() {
    // create the variable points here

    printf("Points: \n");
    return 0;
}
`,
  tests: [{ expect: 'Points: 100\n' }, { patch: [[/points\s*=\s*100/, 'points = 250']], expect: 'Points: 250\n' }],
  must: [{ re: /int\s+points\s*=\s*100\s*;/, msg: "Create the variable by writing `int points = 100;`" }, { re: /%d/, msg: "In the printf use the placeholder `%d`." }],
  mustNot: [{ re: /"Points: 100/, msg: "Do not write 100 in the text: use `%d` and the variable `points`." }],
  hint: "Look at the previous level: `int age = 15;` and `printf(\"... %d ...\", age);`",
  learn: "To create a variable write the type, the name and the initial value: `int points = 100;`",
  solution: H + R`int main() {
    int points = 100;
    printf("Points: %d\n", points);
    return 0;
}
` },
{ id: 'var-calcoli', title: 'Calculations',
  task: "The program prints the sum. Add two lines to also print the **difference** and the **product**, as in the expected output.",
  code: H + R`int main() {
    int a = 7;
    int b = 5;
    printf("%d + %d = %d\n", a, b, a + b);
    return 0;
}
`,
  tests: [{ expect: '7 + 5 = 12\n7 - 5 = 2\n7 * 5 = 35\n' },
    { patch: [[/int a = 7/, 'int a = 9'], [/int b = 5/, 'int b = 4']], expect: '9 + 4 = 13\n9 - 4 = 5\n9 * 4 = 36\n' }],
  hint: "In C multiplication is written with the asterisk `*`. Do not change the lines `int a = 7;` and `int b = 5;`",
  learn: "A printf can have several `%d` placeholders: they are filled in order with the values written after the commas.",
  solution: H + R`int main() {
    int a = 7;
    int b = 5;
    printf("%d + %d = %d\n", a, b, a + b);
    printf("%d - %d = %d\n", a, b, a - b);
    printf("%d * %d = %d\n", a, b, a * b);
    return 0;
}
` },
{ id: 'var-divisione', title: 'Division',
  task: "Print the result of the division `a / b` and the remainder with the `%` operator, as in the expected output.",
  code: H + R`int main() {
    int a = 17;
    int b = 5;
    printf("%d / %d = %d\n", a, b, a / b);
    return 0;
}
`,
  tests: [{ expect: '17 / 5 = 3\nremainder = 2\n' },
    { patch: [[/int a = 17/, 'int a = 23'], [/int b = 5/, 'int b = 6']], expect: '23 / 6 = 3\nremainder = 5\n' }],
  hint: "`a % b` gives the remainder of the division. To print the % symbol inside a printf you must write it twice: `%%`. You do not need it here, though.",
  learn: "Between integers, `/` throws away the part after the decimal point (17 / 5 = 3). `%` gives the remainder (17 % 5 = 2).",
  solution: H + R`int main() {
    int a = 17;
    int b = 5;
    printf("%d / %d = %d\n", a, b, a / b);
    printf("remainder = %d\n", a % b);
    return 0;
}
` },
{ id: 'var-incremento', title: 'Plus one',
  task: "Increase `points` by 1 **three times**, each time using `points++;`. The program must print `Points: 3`.",
  code: H + R`int main() {
    int points = 0;
    points++;
    printf("Points: %d\n", points);
    return 0;
}
`,
  tests: [{ expect: 'Points: 3\n' }],
  must: [{ re: /(points\s*\+\+[\s\S]*){3}/, msg: "Write `points++;` three times." }],
  mustNot: [{ re: /points\s*=\s*3/, msg: "Do not write `points = 3`: use `points++`." }],
  hint: "The `points++;` lines go before the printf.",
  learn: "`points++` increases the variable by 1. `points--` decreases it by 1. `points += 5` increases it by 5.",
  solution: H + R`int main() {
    int points = 0;
    points++;
    points++;
    points++;
    printf("Points: %d\n", points);
    return 0;
}
` },
{ id: 'var-scambio', title: 'Swap the values',
  task: "Swap the values of `x` and `y` using a third variable `t`. Do not change the first two lines and do not write numbers.",
  code: H + R`int main() {
    int x = 3;
    int y = 8;
    // write the swap here

    printf("x = %d, y = %d\n", x, y);
    return 0;
}
`,
  tests: [{ expect: 'x = 8, y = 3\n' }, { patch: [[/int x = 3/, 'int x = 4'], [/int y = 8/, 'int y = 9']], expect: 'x = 9, y = 4\n' }],
  mustNot: [{ re: /^\s*[xy]\s*=\s*\d/m, msg: "Do not assign numbers to x and y: use only the variables." }],
  hint: "Like swapping the contents of two glasses: you need a third glass. `int t = x;` then `x = y;` then...",
  learn: "`x = y;` copies the value of y into x, and the old value of x is lost. That is why you need a helper variable.",
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
{ id: 'var-scanf', title: 'Reading a number',
  task: "The program reads a number with `scanf` and prints its double. Change it so that it prints the **triple**, as in the expected output. You can change the number in the **Input** box.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);
    printf("Double of %d is %d\n", n, n * 2);
    return 0;
}
`,
  tests: [{ input: '5', expect: 'Triple of 5 is 15\n' }, { input: '7', expect: 'Triple of 7 is 21\n' }, { input: '-2', expect: 'Triple of -2 is -6\n' }],
  hint: "Change the word in the text and the calculation `n * 2`.",
  learn: "`scanf(\"%d\", &n);` reads an integer and puts it in `n`. The `&` in front of `n` is required (you will find out why with pointers).",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    printf("Triple of %d is %d\n", n, n * 3);
    return 0;
}
` },
{ id: 'var-somma-input', title: 'Two numbers',
  task: "Read **two** integers and print their sum like this: `Sum: 12`",
  code: H + R`int main() {
    int a;
    scanf("%d", &a);

    return 0;
}
`,
  tests: [{ input: '7 5', expect: 'Sum: 12\n' }, { input: '100 -1', expect: 'Sum: 99\n' }, { input: '0 0', expect: 'Sum: 0\n' }],
  hint: "Create a second variable `b` and read it with another `scanf`. Or read both with `scanf(\"%d %d\", &a, &b);`",
  learn: "With a single scanf you can read several values: `scanf(\"%d %d\", &a, &b);`",
  solution: H + R`int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("Sum: %d\n", a + b);
    return 0;
}
` },
]},
/* ============================== 3 ============================== */
{ id: 'tipi', title: 'Data types', levels: [
{ id: 'tipi-char', title: 'Characters',
  task: "The variable `c` holds a letter. Print the letter and then its **numeric code**, like this: `A 65`",
  code: H + R`int main() {
    char c = 'A';
    printf("%c\n", c);
    return 0;
}
`,
  tests: [{ expect: 'A 65\n' }, { patch: [[/'A'/, "'B'"]], expect: 'B 66\n' }],
  mustNot: [{ re: /65/, msg: "Do not write 65: let the computer work it out by printing `c` with `%d`." }],
  hint: "You can print the same variable twice: once with `%c` (character) and once with `%d` (number).",
  learn: "A `char` is a small number. Every letter has a code (ASCII code): 'A' is 65, 'B' 66, 'a' 97.",
  solution: H + R`int main() {
    char c = 'A';
    printf("%c %d\n", c, c);
    return 0;
}
` },
{ id: 'tipi-lettera-dopo', title: 'The next letter',
  task: "Print the letter that comes **after** the one in the variable `c`. With `'g'` it must print `h`. Do not write the letter by hand.",
  code: H + R`int main() {
    char c = 'g';
    printf("%c\n", c);
    return 0;
}
`,
  tests: [{ expect: 'h\n' }, { patch: [[/'g'/, "'m'"]], expect: 'n\n' }],
  mustNot: [{ re: /'h'/, msg: "Do not write 'h': work out the letter starting from `c`." }],
  hint: "If a char is a number, you can add `+ 1` to it.",
  learn: "You can do arithmetic with chars: `'a' + 1` is `'b'`.",
  solution: H + R`int main() {
    char c = 'g';
    printf("%c\n", c + 1);
    return 0;
}
` },
{ id: 'tipi-float', title: 'Decimal numbers',
  task: "Print the price with **two digits after the decimal point**, like this: `Price: 2.50 euros`",
  code: H + R`int main() {
    float price = 2.5;
    printf("%f\n", price);
    return 0;
}
`,
  tests: [{ expect: 'Price: 2.50 euros\n' }, { patch: [[/=\s*2\.5\b/, '= 3.75']], expect: 'Price: 3.75 euros\n' }],
  hint: "`%f` prints 6 digits after the decimal point. `%.2f` prints 2.",
  learn: "`float` and `double` hold decimal numbers (in C they are written with a dot: 2.5). They are printed with `%f`; `%.2f` chooses how many digits.",
  solution: H + R`int main() {
    float price = 2.5;
    printf("Price: %.2f euros\n", price);
    return 0;
}
` },
{ id: 'tipi-media', title: 'The wrong average',
  task: "The program prints `Average: 7.00`, but the real average of 7, 8 and 8 is 7.67. Find the problem and fix it.",
  code: H + R`int main() {
    int a = 7, b = 8, c = 8;
    float average = (a + b + c) / 3;
    printf("Average: %.2f\n", average);
    return 0;
}
`,
  tests: [{ expect: 'Average: 7.67\n' }, { patch: [[/int a = 7, b = 8, c = 8/, 'int a = 6, b = 6, c = 7']], expect: 'Average: 6.33\n' }],
  hint: "`(a + b + c)` is an int and `3` is an int: division between integers throws away the decimals. Try dividing by `3.0`.",
  learn: "int divided by int always gives an int. If at least one of the two is a decimal number (like `3.0`) the result has decimals.",
  solution: H + R`int main() {
    int a = 7, b = 8, c = 8;
    float average = (a + b + c) / 3.0;
    printf("Average: %.2f\n", average);
    return 0;
}
` },
{ id: 'tipi-sizeof', title: 'How much space?',
  task: "Use `sizeof` to print how many bytes a `char`, an `int` and a `double` take, as in the expected output.",
  code: H + R`int main() {
    printf("char: %d\n", (int)sizeof(char));
    return 0;
}
`,
  tests: [{ expect: 'char: 1\nint: 4\ndouble: 8\n' }],
  must: [{ re: /sizeof\s*\(\s*int\s*\)/, msg: "Use `sizeof(int)`." }, { re: /sizeof\s*\(\s*double\s*\)/, msg: "Use `sizeof(double)`." }],
  mustNot: [{ re: /"(int|double): \d/, msg: "Do not write the numbers by hand: use `sizeof`." }],
  hint: "Copy the printf for char and change the type.",
  learn: "`sizeof` tells how many bytes a type takes in memory. One byte is 8 bits.",
  solution: H + R`int main() {
    printf("char: %d\n", (int)sizeof(char));
    printf("int: %d\n", (int)sizeof(int));
    printf("double: %d\n", (int)sizeof(double));
    return 0;
}
` },
{ id: 'tipi-overflow', title: 'The odometer',
  task: "An `unsigned char` can only hold the numbers from 0 to 255. Change the number added to `x` so that the program prints `0`.",
  code: H + R`int main() {
    unsigned char x = 250;
    x = x + 1;
    printf("%d\n", x);
    return 0;
}
`,
  tests: [{ expect: '0\n' }],
  must: [{ re: /x\s*=\s*x\s*\+\s*\d+|x\s*\+=\s*\d+/, msg: "Keep adding a number to x: `x = x + ...;`" }],
  mustNot: [{ re: /x\s*=\s*0\s*;|unsigned char x = (?!250)/, msg: "Do not change the 250 and do not write `x = 0`: find the right number to add." }],
  hint: "Try: 250 + 5 = 255 (the maximum). What happens with one more step?",
  learn: "When you go past the maximum, the number starts again from 0, like an odometer. This is called **overflow**.",
  solution: H + R`int main() {
    unsigned char x = 250;
    x = x + 6;
    printf("%d\n", x);
    return 0;
}
` },
{ id: 'tipi-cast', title: 'Cutting the decimals',
  task: "Print only the integer part of `v`, like this: `Integer part: 9`. Use the cast `(int)`.",
  code: H + R`int main() {
    double v = 9.99;
    printf("%f\n", v);
    return 0;
}
`,
  tests: [{ expect: 'Integer part: 9\n' }, { patch: [[/9\.99/, '3.2']], expect: 'Integer part: 3\n' }],
  must: [{ re: /\(\s*int\s*\)/, msg: "Use the cast `(int)v`." }],
  hint: "`(int)v` turns v into an integer. Remember to print it with `%d`, not `%f`.",
  learn: "A **cast** changes the type of a value: `(int)9.99` becomes `9` (the decimals are cut off, not rounded).",
  solution: H + R`int main() {
    double v = 9.99;
    printf("Integer part: %d\n", (int)v);
    return 0;
}
` },
{ id: 'tipi-hex', title: 'Hexadecimal',
  task: "Also print the number in base 16 (hexadecimal) with `%x`, like this: `255 in hexadecimal is ff`",
  code: H + R`int main() {
    int n = 255;
    printf("%d\n", n);
    return 0;
}
`,
  tests: [{ expect: '255 in hexadecimal is ff\n' }, { patch: [[/n = 255/, 'n = 4096']], expect: '4096 in hexadecimal is 1000\n' }],
  must: [{ re: /%x/, msg: "Use `%x`." }],
  hint: "You need a printf with `%d` and `%x` and the variable `n` written twice.",
  learn: "In hexadecimal you count from 0 to 15 with the digits 0-9 and a-f. `ff` = 15×16 + 15 = 255.",
  solution: H + R`int main() {
    int n = 255;
    printf("%d in hexadecimal is %x\n", n, n);
    return 0;
}
` },
]},
/* ============================== 4 ============================== */
{ id: 'decisioni', title: 'Decisions: if and switch', levels: [
{ id: 'if-positivo', title: 'Positive or not',
  task: "If the number is greater than zero the program prints `positive`. Add an `else` so that in all other cases it prints `not positive`.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);
    if (n > 0) {
        printf("positive\n");
    }
    return 0;
}
`,
  tests: [{ input: '5', expect: 'positive\n' }, { input: '-3', expect: 'not positive\n' }, { input: '0', expect: 'not positive\n' }],
  must: [{ re: /\belse\b/, msg: "Use `else`." }],
  hint: "After the `}` of the if write `else { ... }`",
  learn: "`if (condition) { ... } else { ... }`: if the condition is true the first block runs, otherwise the second.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    if (n > 0) {
        printf("positive\n");
    } else {
        printf("not positive\n");
    }
    return 0;
}
` },
{ id: 'if-pari', title: 'Even or odd',
  task: "Read a number and print `even` or `odd`.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '4', expect: 'even\n' }, { input: '7', expect: 'odd\n' }, { input: '0', expect: 'even\n' }, { input: '13', expect: 'odd\n' }],
  hint: "A number is even if the remainder of the division by 2 is zero: `n % 2 == 0`. Careful: to compare you use `==` (two equals signs).",
  learn: "`==` compares, `=` assigns. The other comparisons are `!=` (not equal), `<`, `>`, `<=`, `>=`.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    if (n % 2 == 0) {
        printf("even\n");
    } else {
        printf("odd\n");
    }
    return 0;
}
` },
{ id: 'if-voto', title: 'The grade',
  task: "Read a mark from 0 to 10 and print: `fail` (less than 6), `pass` (6), `good` (7 or 8), `excellent` (9 or 10).",
  code: H + R`int main() {
    int mark;
    scanf("%d", &mark);
    if (mark < 6) {
        printf("fail\n");
    } else if (mark == 6) {
        printf("pass\n");
    }
    return 0;
}
`,
  tests: [{ input: '4', expect: 'fail\n' }, { input: '6', expect: 'pass\n' }, { input: '7', expect: 'good\n' }, { input: '8', expect: 'good\n' }, { input: '9', expect: 'excellent\n' }, { input: '10', expect: 'excellent\n' }, { input: '5', expect: 'fail\n' }],
  hint: "Add another `else if` for good and a final `else` for excellent.",
  learn: "With `else if` you can check many cases one after the other: the first true one wins.",
  solution: H + R`int main() {
    int mark;
    scanf("%d", &mark);
    if (mark < 6) {
        printf("fail\n");
    } else if (mark == 6) {
        printf("pass\n");
    } else if (mark <= 8) {
        printf("good\n");
    } else {
        printf("excellent\n");
    }
    return 0;
}
` },
{ id: 'if-and', title: 'Teenager?',
  task: "Read an age. If it is between 13 and 19 (included) print `teenager`, otherwise `not a teenager`. Use **a single if** with `&&`.",
  code: H + R`int main() {
    int age;
    scanf("%d", &age);

    return 0;
}
`,
  tests: [{ input: '12', expect: 'not a teenager\n' }, { input: '13', expect: 'teenager\n' }, { input: '15', expect: 'teenager\n' }, { input: '19', expect: 'teenager\n' }, { input: '20', expect: 'not a teenager\n' }],
  must: [{ re: /&&/, msg: "Use the `&&` (and) operator." }],
  hint: "`age >= 13 && age <= 19` is true only if both conditions are true.",
  learn: "`&&` means AND (both true). `||` means OR (at least one true). `!` means NOT.",
  solution: H + R`int main() {
    int age;
    scanf("%d", &age);
    if (age >= 13 && age <= 19) {
        printf("teenager\n");
    } else {
        printf("not a teenager\n");
    }
    return 0;
}
` },
{ id: 'if-max3', title: 'The largest',
  task: "Read three numbers and print the largest like this: `The largest is 9`",
  code: H + R`int main() {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);

    return 0;
}
`,
  tests: [{ input: '3 9 5', expect: 'The largest is 9\n' }, { input: '9 3 5', expect: 'The largest is 9\n' }, { input: '3 5 9', expect: 'The largest is 9\n' }, { input: '-1 -8 -3', expect: 'The largest is -1\n' }, { input: '4 4 4', expect: 'The largest is 4\n' }],
  hint: "Create a variable `max = a;`. Then: if `b` is larger than `max`, `max = b;`. Do the same with `c`.",
  learn: "Keeping the \"best so far\" in a variable and updating it is a trick you will use a lot.",
  solution: H + R`int main() {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    int max = a;
    if (b > max) max = b;
    if (c > max) max = c;
    printf("The largest is %d\n", max);
    return 0;
}
` },
{ id: 'if-bisestile', title: 'Leap year',
  task: "A year is a leap year if it is divisible by 4 but not by 100, **or** if it is divisible by 400. Print `leap` or `not leap`.",
  code: H + R`int main() {
    int year;
    scanf("%d", &year);

    return 0;
}
`,
  tests: [{ input: '2024', expect: 'leap\n' }, { input: '2023', expect: 'not leap\n' }, { input: '1900', expect: 'not leap\n' }, { input: '2000', expect: 'leap\n' }],
  hint: "\"divisible by 4\" is written `year % 4 == 0`. Join the conditions with `&&`, `!=` and `||`, using parentheses.",
  learn: "Conditions can be combined: `(A && B) || C`. Parentheses help you avoid mistakes.",
  solution: H + R`int main() {
    int year;
    scanf("%d", &year);
    if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) {
        printf("leap\n");
    } else {
        printf("not leap\n");
    }
    return 0;
}
` },
{ id: 'switch-giorni', title: 'Days of the week',
  task: "Complete the `switch`: from 1 to 7 print the day (1 = Monday ... 7 = Sunday). With other numbers print `invalid number`.",
  code: H + R`int main() {
    int d;
    scanf("%d", &d);
    switch (d) {
        case 1:
            printf("Monday\n");
            break;
        case 2:
            printf("Tuesday\n");
            break;
    }
    return 0;
}
`,
  tests: [{ input: '1', expect: 'Monday\n' }, { input: '3', expect: 'Wednesday\n' }, { input: '5', expect: 'Friday\n' }, { input: '6', expect: 'Saturday\n' }, { input: '7', expect: 'Sunday\n' }, { input: '0', expect: 'invalid number\n' }, { input: '8', expect: 'invalid number\n' }],
  must: [{ re: /\bswitch\b/, msg: "Use the `switch`." }, { re: /\bdefault\s*:/, msg: "For invalid numbers use `default:`" }],
  hint: "Each case ends with `break;`. The \"all the others\" case is written `default:`. Days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday.",
  learn: "`switch` chooses among many exact values. Without `break` the program goes on into the next case!",
  solution: H + R`int main() {
    int d;
    scanf("%d", &d);
    switch (d) {
        case 1: printf("Monday\n"); break;
        case 2: printf("Tuesday\n"); break;
        case 3: printf("Wednesday\n"); break;
        case 4: printf("Thursday\n"); break;
        case 5: printf("Friday\n"); break;
        case 6: printf("Saturday\n"); break;
        case 7: printf("Sunday\n"); break;
        default: printf("invalid number\n");
    }
    return 0;
}
` },
]},
/* ============================== 5 ============================== */
{ id: 'cicli', title: 'Loops: repeating', levels: [
{ id: 'for-10', title: 'Counting to 10',
  task: "The loop prints the numbers from 1 to 5. Change it so that it prints from 1 to **10**, all on the **same line** separated by a space.",
  code: H + R`int main() {
    for (int i = 1; i <= 5; i++) {
        printf("%d\n", i);
    }
    return 0;
}
`,
  tests: [{ expect: '1 2 3 4 5 6 7 8 9 10\n' }],
  must: [{ re: /\bfor\b/, msg: "Use the `for` loop." }],
  maxCount: [{ re: /printf/g, max: 2, msg: "Use the loop, not many printfs." }],
  hint: "Inside the loop print `\"%d \"` (with the space, without `\\n`). After the loop print just `\"\\n\"`.",
  learn: "`for (start; condition; step)`: `i` starts at 1, the loop goes on while `i <= 10`, and each round does `i++`.",
  solution: H + R`int main() {
    for (int i = 1; i <= 10; i++) {
        printf("%d ", i);
    }
    printf("\n");
    return 0;
}
` },
{ id: 'for-n', title: 'Up to n',
  task: "Read a number `n` and print the numbers from 1 to `n`, **one per line**.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '3', expect: '1\n2\n3\n' }, { input: '1', expect: '1\n' }, { input: '5', expect: '1\n2\n3\n4\n5\n' }],
  hint: "Like the previous level, but the condition is `i <= n`.",
  learn: "The number of rounds of a loop can depend on a variable.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) {
        printf("%d\n", i);
    }
    return 0;
}
` },
{ id: 'for-rovescia', title: 'Countdown',
  task: "Read `n` and print the numbers from `n` down to 1, one per line. At the end print `Go!`",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '3', expect: '3\n2\n1\nGo!\n' }, { input: '5', expect: '5\n4\n3\n2\n1\nGo!\n' }, { input: '1', expect: '1\nGo!\n' }],
  hint: "A loop can also go backwards: `for (int i = n; i >= 1; i--)`",
  learn: "`i--` decreases by 1. The condition of the for decides when to stop.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    for (int i = n; i >= 1; i--) {
        printf("%d\n", i);
    }
    printf("Go!\n");
    return 0;
}
` },
{ id: 'for-somma', title: 'The sum',
  task: "Read `n` and print the sum of the numbers from 1 to `n`, like this: `Sum: 10` (for n = 4, because 1+2+3+4 = 10).",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);
    int sum;

    printf("Sum: %d\n", sum);
    return 0;
}
`,
  tests: [{ input: '4', expect: 'Sum: 10\n' }, { input: '10', expect: 'Sum: 55\n' }, { input: '1', expect: 'Sum: 1\n' }, { input: '100', expect: 'Sum: 5050\n' }],
  must: [{ re: /\b(for|while)\b/, msg: "Use a loop." }],
  hint: "Before the loop the sum must be 0. In the loop: `sum = sum + i;` (or `sum += i;`).",
  learn: "A variable that collects values (an **accumulator**) must always be initialized, usually to 0.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    int sum = 0;
    for (int i = 1; i <= n; i++) {
        sum += i;
    }
    printf("Sum: %d\n", sum);
    return 0;
}
` },
{ id: 'for-tabellina', title: 'Times table',
  task: "Read `n` and print its times table from 1 to 10, in the format of the expected output.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '3', expect: '3 x 1 = 3\n3 x 2 = 6\n3 x 3 = 9\n3 x 4 = 12\n3 x 5 = 15\n3 x 6 = 18\n3 x 7 = 21\n3 x 8 = 24\n3 x 9 = 27\n3 x 10 = 30\n' },
    { input: '7', expect: '7 x 1 = 7\n7 x 2 = 14\n7 x 3 = 21\n7 x 4 = 28\n7 x 5 = 35\n7 x 6 = 42\n7 x 7 = 49\n7 x 8 = 56\n7 x 9 = 63\n7 x 10 = 70\n' }],
  hint: "Each line has three numbers: `n`, `i` and `n * i`.",
  learn: "A single printf inside a loop can produce many different lines.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    for (int i = 1; i <= 10; i++) {
        printf("%d x %d = %d\n", n, i, n * i);
    }
    return 0;
}
` },
{ id: 'while-potenze', title: 'Powers of 2',
  task: "Read `n` and print on the same line the powers of 2 (1, 2, 4, 8, ...) that are **less than or equal to** `n`. Use a `while` loop.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);
    int p = 1;

    printf("\n");
    return 0;
}
`,
  tests: [{ input: '10', expect: '1 2 4 8\n' }, { input: '1', expect: '1\n' }, { input: '64', expect: '1 2 4 8 16 32 64\n' }],
  must: [{ re: /\bwhile\b/, msg: "Use the `while` loop." }],
  hint: "`while (p <= n) { print p; p = p * 2; }`",
  learn: "`while (condition) { ... }` repeats while the condition is true. You use it when you do not know in advance how many rounds you need.",
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
{ id: 'while-cifre', title: 'Counting digits',
  task: "Read a positive number and print how many digits it has, like this: `Digits: 3`",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '123', expect: 'Digits: 3\n' }, { input: '7', expect: 'Digits: 1\n' }, { input: '100000', expect: 'Digits: 6\n' }, { input: '45', expect: 'Digits: 2\n' }],
  must: [{ re: /\b(while|for)\b/, msg: "Use a loop." }],
  hint: "Dividing by 10 removes the last digit: 123 / 10 = 12. Count how many times you can do it before reaching 0.",
  learn: "`n / 10` removes the last digit, `n % 10` gives it. They are very useful with numbers.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    int digits = 0;
    while (n > 0) {
        n = n / 10;
        digits++;
    }
    printf("Digits: %d\n", digits);
    return 0;
}
` },
{ id: 'do-while', title: 'Until zero arrives',
  task: "Read numbers one at a time until `0` arrives. Then print the sum, like this: `Total: 15`. Use `do { ... } while (...);`",
  code: H + R`int main() {
    int x;
    int total = 0;

    printf("Total: %d\n", total);
    return 0;
}
`,
  tests: [{ input: '4 5 6 0', expect: 'Total: 15\n' }, { input: '0', expect: 'Total: 0\n' }, { input: '10 -3 0', expect: 'Total: 7\n' }],
  must: [{ re: /\bdo\b/, msg: "Use `do { ... } while (...);`" }],
  hint: "Inside the `do`: read `x` with scanf and add it to the total. The condition is `x != 0`.",
  learn: "The `do-while` runs the block **at least once** and checks the condition at the end.",
  solution: H + R`int main() {
    int x;
    int total = 0;
    do {
        scanf("%d", &x);
        total += x;
    } while (x != 0);
    printf("Total: %d\n", total);
    return 0;
}
` },
{ id: 'quadrato', title: 'Square of asterisks',
  task: "Read `n` and draw a square of `n` rows with `n` asterisks each.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '3', expect: '***\n***\n***\n' }, { input: '1', expect: '*\n' }, { input: '4', expect: '****\n****\n****\n****\n' }],
  hint: "You need a loop inside a loop. The outer one counts the rows. The inner one prints `*` n times. After the inner loop print `\\n`.",
  learn: "**Nested loops** (one inside the other) are for two-dimensional things, like rows and columns.",
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
{ id: 'triangolo', title: 'The triangle',
  task: "Read `n` and draw a triangle: row 1 has 1 asterisk, row 2 has 2, ... up to row `n`.",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '3', expect: '*\n**\n***\n' }, { input: '5', expect: '*\n**\n***\n****\n*****\n' }, { input: '1', expect: '*\n' }],
  hint: "Like the square, but the inner loop does as many rounds as the row number.",
  learn: "The inner loop can use the variable of the outer loop.",
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
{ id: 'break', title: 'Stopping with break',
  task: "Read `n` and find the first multiple of 7 **greater** than `n`. Use a loop and `break`. Print like this: `The first multiple of 7 after 20 is 21`",
  code: H + R`int main() {
    int n;
    scanf("%d", &n);
    for (int i = n + 1; ; i++) {
        // check here whether i is a multiple of 7
    }
    return 0;
}
`,
  tests: [{ input: '20', expect: 'The first multiple of 7 after 20 is 21\n' }, { input: '7', expect: 'The first multiple of 7 after 7 is 14\n' }, { input: '0', expect: 'The first multiple of 7 after 0 is 7\n' }],
  must: [{ re: /\bbreak\b/, msg: "Use `break` to leave the loop." }],
  hint: "A for without a condition never stops by itself. Inside: if `i % 7 == 0`, print and then `break;`",
  learn: "`break` leaves the loop immediately.",
  solution: H + R`int main() {
    int n;
    scanf("%d", &n);
    for (int i = n + 1; ; i++) {
        if (i % 7 == 0) {
            printf("The first multiple of 7 after %d is %d\n", n, i);
            break;
        }
    }
    return 0;
}
` },
{ id: 'continue', title: 'Skipping with continue',
  task: "Print the numbers from 1 to 20 on the same line, **skipping** the multiples of 3. Use `continue`.",
  code: H + R`int main() {
    for (int i = 1; i <= 20; i++) {
        printf("%d ", i);
    }
    printf("\n");
    return 0;
}
`,
  tests: [{ expect: '1 2 4 5 7 8 10 11 13 14 16 17 19 20\n' }],
  must: [{ re: /\bcontinue\b/, msg: "Use `continue`." }],
  hint: "Before the printf: if `i` is a multiple of 3, `continue;`",
  learn: "`continue` skips the rest of the round and goes straight to the next round.",
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
{ id: 'indovina', title: 'Guess the number',
  task: "The secret number is 42. Read guesses until it is guessed. For each guess print `too high` or `too low`. At the end print `Guessed in 3 tries!` (with the right number of tries).",
  code: H + R`int main() {
    int secret = 42;
    int guess;
    int count = 0;

    return 0;
}
`,
  tests: [{ input: '50 30 42', expect: 'too high\ntoo low\nGuessed in 3 tries!\n' }, { input: '42', expect: 'Guessed in 1 tries!\n' }, { input: '1 2 100 43 41 42', expect: 'too low\ntoo low\ntoo high\ntoo high\ntoo low\nGuessed in 6 tries!\n' }],
  hint: "A `do-while` loop with the condition `guess != secret`. Inside: read, increase `count`, then use if / else if.",
  learn: "You wrote a real game! Loops + decisions + variables are enough for lots of things.",
  solution: H + R`int main() {
    int secret = 42;
    int guess;
    int count = 0;
    do {
        scanf("%d", &guess);
        count++;
        if (guess > secret) {
            printf("too high\n");
        } else if (guess < secret) {
            printf("too low\n");
        }
    } while (guess != secret);
    printf("Guessed in %d tries!\n", count);
    return 0;
}
` },
]},
/* ============================== 6 ============================== */
{ id: 'funzioni', title: 'Functions', levels: [
{ id: 'fun-saluta', title: 'Your first function',
  task: "The function `greet` prints `Hello!`. In `main` call it **three times**.",
  code: H + R`void greet() {
    printf("Hello!\n");
}

int main() {
    greet();
    return 0;
}
`,
  tests: [{ expect: 'Hello!\nHello!\nHello!\n' }],
  maxCount: [{ re: /printf/g, max: 1, msg: "Do not add printfs: call the function `greet()` several times." }],
  hint: "To call a function write its name with the parentheses: `greet();`",
  learn: "A function is a piece of program with a name. You write it once and you can use it as many times as you want. `void` means it returns nothing.",
  solution: H + R`void greet() {
    printf("Hello!\n");
}

int main() {
    greet();
    greet();
    greet();
    return 0;
}
` },
{ id: 'fun-linea', title: 'A function with a parameter',
  task: "Complete the function `line` so that it prints `n` dashes `-` and then goes to a new line.",
  code: H + R`void line(int n) {
    // write here
}

int main() {
    int n;
    scanf("%d", &n);
    line(n);
    return 0;
}
`,
  tests: [{ input: '5', expect: '-----\n' }, { input: '1', expect: '-\n' }, { input: '12', expect: '------------\n' }],
  hint: "Inside the function, `n` is a normal variable. Use a for loop.",
  learn: "**Parameters** are the values you pass to a function between the parentheses. Inside the function they are used like variables.",
  solution: H + R`void line(int n) {
    for (int i = 0; i < n; i++) {
        printf("-");
    }
    printf("\n");
}

int main() {
    int n;
    scanf("%d", &n);
    line(n);
    return 0;
}
` },
{ id: 'fun-quadrato', title: 'Returning a value',
  task: "The function `square` must **return** `x` times `x`. Right now it always returns 0: fix it.",
  code: H + R`int square(int x) {
    return 0;
}

int main() {
    int n;
    scanf("%d", &n);
    printf("%d squared is %d\n", n, square(n));
    return 0;
}
`,
  tests: [{ input: '4', expect: '4 squared is 16\n' }, { input: '9', expect: '9 squared is 81\n' }, { input: '-3', expect: '-3 squared is 9\n' }],
  hint: "Change only what comes after `return`.",
  learn: "`return` gives a value back to whoever called the function. The type before the name (`int`) says what type of value it returns.",
  solution: H + R`int square(int x) {
    return x * x;
}

int main() {
    int n;
    scanf("%d", &n);
    printf("%d squared is %d\n", n, square(n));
    return 0;
}
` },
{ id: 'fun-prototipo', title: 'Before or after?',
  task: "This program gives an error even though the function exists. Read the message and fix it by **adding the prototype** before `main`.",
  code: H + R`int main() {
    printf("%d\n", twice(21));
    return 0;
}

int twice(int x) {
    return x * 2;
}
`,
  tests: [{ expect: '42\n' }],
  must: [{ re: /int\s+twice\s*\([^)]*\)\s*;[\s\S]*int\s+main/, msg: "Write the prototype `int twice(int x);` above `main`." }],
  hint: "The prototype is the first line of the function, followed by `;` instead of `{`.",
  learn: "The compiler reads from top to bottom. The **prototype** announces a function that will be written further down.",
  solution: H + R`int twice(int x);

int main() {
    printf("%d\n", twice(21));
    return 0;
}

int twice(int x) {
    return x * 2;
}
` },
{ id: 'fun-massimo', title: 'The maximum of three',
  task: "Write the function `int maximum(int a, int b)` that returns the larger of `a` and `b`. In `main` use it to print the maximum of three numbers.",
  code: H + R`// write the function maximum here

int main() {
    int x, y, z;
    scanf("%d %d %d", &x, &y, &z);
    printf("%d\n", maximum(maximum(x, y), z));
    return 0;
}
`,
  tests: [{ input: '3 9 5', expect: '9\n' }, { input: '9 3 5', expect: '9\n' }, { input: '1 2 3', expect: '3\n' }, { input: '-5 -2 -9', expect: '-2\n' }],
  hint: "`int maximum(int a, int b) { if (a > b) return a; ... }`",
  learn: "The result of a function can be passed directly to another function.",
  solution: H + R`int maximum(int a, int b) {
    if (a > b) {
        return a;
    }
    return b;
}

int main() {
    int x, y, z;
    scanf("%d %d %d", &x, &y, &z);
    printf("%d\n", maximum(maximum(x, y), z));
    return 0;
}
` },
{ id: 'fun-primi', title: 'Prime numbers',
  task: "Complete `is_prime(n)`: it must return 1 if `n` is prime, 0 if it is not. The `main` prints the primes up to the number read.",
  code: H + R`int is_prime(int n) {
    // a number is prime if it is greater than 1
    // and is not divisible by any number between 2 and n-1
    return 1;
}

int main() {
    int n;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) {
        if (is_prime(i)) {
            printf("%d ", i);
        }
    }
    printf("\n");
    return 0;
}
`,
  tests: [{ input: '10', expect: '2 3 5 7\n' }, { input: '20', expect: '2 3 5 7 11 13 17 19\n' }, { input: '2', expect: '2\n' }],
  hint: "If `n < 2` return 0. Then try all divisors `d` from 2 to n-1: if `n % d == 0` return 0. If none divides it, at the end return 1.",
  learn: "`return` can be inside a loop: the function ends immediately.",
  solution: H + R`int is_prime(int n) {
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
        if (is_prime(i)) {
            printf("%d ", i);
        }
    }
    printf("\n");
    return 0;
}
` },
{ id: 'fun-fattoriale', title: 'Recursion: the factorial',
  task: "The factorial of n is 1 × 2 × ... × n (and the factorial of 0 is 1). Write `factorial` **without loops**: the function must call itself.",
  code: H + R`int factorial(int n) {
    // if n is 0, the result is 1
    // otherwise it is n * factorial(n - 1)
    return 1;
}

int main() {
    int n;
    scanf("%d", &n);
    printf("%d\n", factorial(n));
    return 0;
}
`,
  tests: [{ input: '5', expect: '120\n' }, { input: '0', expect: '1\n' }, { input: '1', expect: '1\n' }, { input: '10', expect: '3628800\n' }],
  must: [{ re: /int\s+factorial\s*\([^)]*\)\s*\{[\s\S]*factorial\s*\([\s\S]*int\s+main/, msg: "The function `factorial` must call itself." }],
  mustNot: [{ re: /\b(for|while)\b/, msg: "Do not use loops: use recursion." }],
  hint: "Two cases: the **base case** (`if (n == 0) return 1;`) and the **step** (`return n * factorial(n - 1);`).",
  learn: "A function that calls itself is **recursive**. It always needs a base case, otherwise it never stops.",
  solution: H + R`int factorial(int n) {
    if (n == 0) {
        return 1;
    }
    return n * factorial(n - 1);
}

int main() {
    int n;
    scanf("%d", &n);
    printf("%d\n", factorial(n));
    return 0;
}
` },
{ id: 'fun-static', title: 'A variable that remembers',
  task: "The program prints `1 1 1`. Add **a single word** inside `counter` so that it prints `1 2 3`. Do not use global variables.",
  code: H + R`int counter() {
    int times = 0;
    times++;
    return times;
}

int main() {
    printf("%d ", counter());
    printf("%d ", counter());
    printf("%d\n", counter());
    return 0;
}
`,
  tests: [{ expect: '1 2 3\n' }],
  must: [{ re: /static\s+int\s+times/, msg: "The word to add is `static`, in front of `int times`." }],
  hint: "A normal local variable is created again at every call. A `static` variable instead is created only once.",
  learn: "A `static` local variable keeps its value from one call to the next (it has **static duration**), but it is only visible inside the function.",
  solution: H + R`int counter() {
    static int times = 0;
    times++;
    return times;
}

int main() {
    printf("%d ", counter());
    printf("%d ", counter());
    printf("%d\n", counter());
    return 0;
}
` },
{ id: 'fun-scope', title: 'Where a variable is visible',
  task: "The program gives an error because `total` is declared inside the block of the `for`. Move it to the right place so that it prints `Total: 15`.",
  code: H + R`int main() {
    for (int i = 1; i <= 5; i++) {
        int total = 0;
        total += i;
    }
    printf("Total: %d\n", total);
    return 0;
}
`,
  tests: [{ expect: 'Total: 15\n' }],
  hint: "A variable exists only inside the braces `{ }` where it is declared. Declare it **before** the for.",
  learn: "Every variable has a **scope** (visibility): the block `{ }` where it is declared. Outside of it, it does not exist.",
  solution: H + R`int main() {
    int total = 0;
    for (int i = 1; i <= 5; i++) {
        total += i;
    }
    printf("Total: %d\n", total);
    return 0;
}
` },
]},
/* ============================== 7 ============================== */
{ id: 'array', title: 'Arrays', levels: [
{ id: 'arr-stampa', title: 'Your first array',
  task: "The array `marks` holds 5 numbers. Print them all on the same line using a `for` loop.",
  code: H + R`int main() {
    int marks[5] = {7, 8, 6, 9, 10};
    printf("%d\n", marks[0]);
    return 0;
}
`,
  tests: [{ expect: '7 8 6 9 10\n' }, { patch: [[/\{7, 8, 6, 9, 10\}/, '{1, 2, 3, 4, 5}']], expect: '1 2 3 4 5\n' }],
  must: [{ re: /\bfor\b/, msg: "Use a `for` loop." }],
  mustNot: [{ re: /marks\s*\[\s*[1-4]\s*\]/, msg: "Do not write the indexes by hand: use `marks[i]` in the loop." }],
  hint: "The elements are `marks[0]`, `marks[1]`, ... `marks[4]`. The loop goes from `i = 0` to `i < 5`.",
  learn: "An **array** is a row of variables of the same type. The first element has index **0**, the last has index 4 (size - 1).",
  solution: H + R`int main() {
    int marks[5] = {7, 8, 6, 9, 10};
    for (int i = 0; i < 5; i++) {
        printf("%d ", marks[i]);
    }
    printf("\n");
    return 0;
}
` },
{ id: 'arr-limiti', title: 'Out of bounds',
  task: "This program stops with an error. Read the message and fix the loop.",
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
  hint: "An array of 5 elements has the indexes 0, 1, 2, 3, 4. What is the last value of `i` in the loop?",
  learn: "Going out of the bounds of an array is one of the most dangerous mistakes in C: a real compiler does not warn you, and the program can do strange things.",
  solution: H + R`int main() {
    int v[5] = {10, 20, 30, 40, 50};
    for (int i = 0; i < 5; i++) {
        printf("%d ", v[i]);
    }
    printf("\n");
    return 0;
}
` },
{ id: 'arr-media', title: 'Sum and average',
  task: "Compute the sum of the elements of the array and the average (with 2 decimals), as in the expected output.",
  code: H + R`int main() {
    int v[6] = {4, 8, 15, 16, 23, 42};

    return 0;
}
`,
  tests: [{ expect: 'Sum: 108\nAverage: 18.00\n' }, { patch: [[/\{4, 8, 15, 16, 23, 42\}/, '{1, 2, 3, 4, 5, 6}']], expect: 'Sum: 21\nAverage: 3.50\n' }],
  hint: "First the sum with a loop. For the average: `sum / 6.0` (with the `.0`, remember the wrong average?).",
  learn: "Sum and average are the most common calculations with arrays.",
  solution: H + R`int main() {
    int v[6] = {4, 8, 15, 16, 23, 42};
    int sum = 0;
    for (int i = 0; i < 6; i++) {
        sum += v[i];
    }
    printf("Sum: %d\n", sum);
    printf("Average: %.2f\n", sum / 6.0);
    return 0;
}
` },
{ id: 'arr-max', title: 'The tallest',
  task: "Find the largest value in the array and its position (index), as in the expected output.",
  code: H + R`int main() {
    int heights[7] = {150, 172, 165, 181, 177, 169, 160};

    return 0;
}
`,
  tests: [{ expect: 'Maximum: 181 (position 3)\n' }, { patch: [[/\{150, 172, 165, 181, 177, 169, 160\}/, '{190, 172, 165, 181, 177, 169, 160}']], expect: 'Maximum: 190 (position 0)\n' },
    { patch: [[/\{150, 172, 165, 181, 177, 169, 160\}/, '{150, 172, 165, 181, 177, 169, 199}']], expect: 'Maximum: 199 (position 6)\n' }],
  hint: "Start with `max = heights[0]` and `pos = 0`. In the loop, if you find a larger value update both.",
  learn: "To find the maximum you start from the first element and compare it with all the others.",
  solution: H + R`int main() {
    int heights[7] = {150, 172, 165, 181, 177, 169, 160};
    int max = heights[0];
    int pos = 0;
    for (int i = 1; i < 7; i++) {
        if (heights[i] > max) {
            max = heights[i];
            pos = i;
        }
    }
    printf("Maximum: %d (position %d)\n", max, pos);
    return 0;
}
` },
{ id: 'arr-rovescio', title: 'Backwards',
  task: "Read `n` (at most 20), then read `n` numbers and put them in an array. Print them backwards on the same line.",
  code: H + R`int main() {
    int n;
    int v[20];
    scanf("%d", &n);

    return 0;
}
`,
  tests: [{ input: '5\n1 2 3 4 5', expect: '5 4 3 2 1\n' }, { input: '3\n10 -7 0', expect: '0 -7 10\n' }, { input: '1\n42', expect: '42\n' }],
  hint: "First loop: `scanf(\"%d\", &v[i]);`. Second loop backwards: from `i = n - 1` down to `i >= 0`.",
  learn: "`&v[i]` is the address of element i: scanf fills it like a normal variable.",
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
{ id: 'arr-conta', title: 'Counting',
  task: "Read 10 numbers between 1 and 5 (star ratings) and count how many times each rating appears. Print as in the expected output.",
  code: H + R`int main() {
    int count[6] = {0};
    int x;

    return 0;
}
`,
  tests: [{ input: '5 4 5 3 5 1 4 5 2 5', expect: '1 stars: 1\n2 stars: 1\n3 stars: 1\n4 stars: 2\n5 stars: 5\n' },
    { input: '1 1 1 1 1 1 1 1 1 1', expect: '1 stars: 10\n2 stars: 0\n3 stars: 0\n4 stars: 0\n5 stars: 0\n' }],
  hint: "Trick: use the rating as an index! Every time you read `x`, do `count[x]++;`. Then print `count[1]` ... `count[5]` with a loop.",
  learn: "`int count[6] = {0};` sets all the elements to zero. Using a value as an index is a powerful trick.",
  solution: H + R`int main() {
    int count[6] = {0};
    int x;
    for (int i = 0; i < 10; i++) {
        scanf("%d", &x);
        count[x]++;
    }
    for (int s = 1; s <= 5; s++) {
        printf("%d stars: %d\n", s, count[s]);
    }
    return 0;
}
` },
{ id: 'arr-matrice', title: 'The table (matrix)',
  task: "Print the 3×3 matrix as a table (numbers separated by a space) and then the sum of the diagonal (1 + 5 + 9).",
  code: H + R`int main() {
    int m[3][3] = {
        {1, 2, 3},
        {4, 5, 6},
        {7, 8, 9}
    };

    return 0;
}
`,
  tests: [{ expect: '1 2 3\n4 5 6\n7 8 9\nDiagonal: 15\n' }],
  hint: "`m[r][c]` is the element at row r and column c. Two nested loops to print. The diagonal is the elements with `r == c`: `m[0][0]`, `m[1][1]`, `m[2][2]`.",
  learn: "A two-dimensional array is an array of rows. You go through it with two nested loops.",
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
    printf("Diagonal: %d\n", diag);
    return 0;
}
` },
]},
/* ============================== 8 ============================== */
{ id: 'stringhe', title: 'Strings', levels: [
{ id: 'str-lettere', title: 'Letter by letter',
  task: "A string is an array of `char` that ends with `'\\0'`. Print each letter of `name` on a different line, stopping when you find `'\\0'`.",
  code: H + R`int main() {
    char name[] = "Ada";
    printf("%s\n", name);
    return 0;
}
`,
  tests: [{ expect: 'A\nd\na\n' }, { patch: [[/"Ada"/, '"Luke"']], expect: 'L\nu\nk\ne\n' }],
  mustNot: [{ re: /strlen/, msg: "Do not use strlen: stop when you find `'\\0'`." }],
  hint: "`for (int i = 0; name[i] != '\\0'; i++)` and inside print `name[i]` with `%c`.",
  learn: "\"Ada\" in memory is 4 chars: 'A', 'd', 'a', '\\0'. The character `'\\0'` marks the end of the string.",
  solution: H + R`int main() {
    char name[] = "Ada";
    for (int i = 0; name[i] != '\0'; i++) {
        printf("%c\n", name[i]);
    }
    return 0;
}
` },
{ id: 'str-lunghezza', title: 'Length',
  task: "Read a word and print how many letters it has, **without using strlen**. Example: `Length: 5`",
  code: H + R`int main() {
    char word[50];
    scanf("%s", word);

    return 0;
}
`,
  tests: [{ input: 'hello', expect: 'Length: 5\n' }, { input: 'programming', expect: 'Length: 11\n' }, { input: 'x', expect: 'Length: 1\n' }],
  mustNot: [{ re: /strlen/, msg: "Do not use strlen: count the letters yourself." }],
  hint: "Count the characters until you find `'\\0'`. Note: in scanf with `%s` you do not put `&` in front of an array.",
  learn: "With `%s` scanf reads a word (up to the first space). The name of an array is already an address, that is why you do not need the `&`.",
  solution: H + R`int main() {
    char word[50];
    scanf("%s", word);
    int n = 0;
    while (word[n] != '\0') {
        n++;
    }
    printf("Length: %d\n", n);
    return 0;
}
` },
{ id: 'str-maiuscolo', title: 'ALL CAPS',
  task: "Read a word and print it in UPPERCASE. Do not use `toupper`: if a character is between `'a'` and `'z'`, convert it yourself.",
  code: H + R`int main() {
    char s[50];
    scanf("%s", s);

    printf("%s\n", s);
    return 0;
}
`,
  tests: [{ input: 'hello', expect: 'HELLO\n' }, { input: 'Hello', expect: 'HELLO\n' }, { input: 'c3po', expect: 'C3PO\n' }],
  mustNot: [{ re: /toupper/, msg: "Do not use toupper: do the calculation with the character codes." }],
  hint: "Lowercase and uppercase letters are always the same distance apart: `s[i] = s[i] - 'a' + 'A';` Only if `s[i] >= 'a' && s[i] <= 'z'`.",
  learn: "Letters have consecutive codes: 'a'...'z' and 'A'...'Z'. That is why you can go from one to the other with a subtraction.",
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
{ id: 'str-vocali', title: 'Count the vowels',
  task: "Read a word (in lowercase) and print how many vowels it contains, like this: `Vowels: 3`",
  code: H + R`int main() {
    char s[50];
    scanf("%s", s);

    return 0;
}
`,
  tests: [{ input: 'banana', expect: 'Vowels: 3\n' }, { input: 'sky', expect: 'Vowels: 0\n' }, { input: 'aiuole', expect: 'Vowels: 5\n' }],
  hint: "For each character check whether it is `'a'` or `'e'` or `'i'` or `'o'` or `'u'` (with `||`). Or use a switch!",
  learn: "Going through a string character by character is the basis of almost every exercise on strings.",
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
    printf("Vowels: %d\n", v);
    return 0;
}
` },
{ id: 'str-palindroma', title: 'Palindrome',
  task: "A word is a palindrome if it reads the same backwards (like `anna`). Read a word and print `palindrome` or `not a palindrome`.",
  code: H + R`#include <string.h>

int main() {
    char s[50];
    scanf("%s", s);
    int n = strlen(s);

    return 0;
}
`.replace(/^/, H),
  tests: [{ input: 'anna', expect: 'palindrome\n' }, { input: 'radar', expect: 'palindrome\n' }, { input: 'hello', expect: 'not a palindrome\n' }, { input: 'a', expect: 'palindrome\n' }, { input: 'ab', expect: 'not a palindrome\n' }],
  hint: "Compare `s[i]` with `s[n - 1 - i]`. If even a single pair is different, it is not a palindrome.",
  learn: "`strlen` (from `<string.h>`) returns the length of the string, without counting `'\\0'`.",
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
        printf("palindrome\n");
    } else {
        printf("not a palindrome\n");
    }
    return 0;
}
`.replace(/^/, H) },
{ id: 'str-password', title: 'The password',
  task: "Read a word. If it is equal to `secret` print `Access granted`, otherwise `Access denied`. The program gives an error: read the message.",
  code: H + R`int main() {
    char p[50];
    scanf("%s", p);
    if (p == "secret") {
        printf("Access granted\n");
    } else {
        printf("Access denied\n");
    }
    return 0;
}
`,
  tests: [{ input: 'secret', expect: 'Access granted\n' }, { input: 'secre', expect: 'Access denied\n' }, { input: 'Secret', expect: 'Access denied\n' }],
  must: [{ re: /strcmp/, msg: "Use `strcmp`." }],
  hint: "`strcmp(a, b)` returns 0 if the two strings are equal. You need `#include <string.h>`.",
  learn: "Strings are not compared with `==`: you use `strcmp`. To copy them you use `strcpy`, not `=`.",
  solution: R`#include <stdio.h>
#include <string.h>

int main() {
    char p[50];
    scanf("%s", p);
    if (strcmp(p, "secret") == 0) {
        printf("Access granted\n");
    } else {
        printf("Access denied\n");
    }
    return 0;
}
` },
]},
/* ============================== 9 ============================== */
{ id: 'puntatori', title: 'Pointers', levels: [
{ id: 'ptr-base', title: 'Address and value',
  task: "`p` holds the address of `x`. Change the value of `x` to `42` **using only `p`** (do not write `x = ...`).",
  code: H + R`int main() {
    int x = 5;
    int *p = &x;

    printf("x is %d\n", x);
    return 0;
}
`,
  tests: [{ expect: 'x is 42\n' }],
  must: [{ re: /\*\s*p\s*=\s*42/, msg: "Write into the pointed variable: `*p = 42;`" }],
  mustNot: [{ re: /\bx\s*=\s*42/, msg: "Do not write `x = 42`: use the pointer." }],
  hint: "`*p` means \"the variable p points to\".",
  learn: "`&x` is the address of x. A pointer (`int *p`) holds an address. `*p` is the variable found at that address.",
  solution: H + R`int main() {
    int x = 5;
    int *p = &x;
    *p = 42;
    printf("x is %d\n", x);
    return 0;
}
` },
{ id: 'ptr-swap', title: 'The swap that does not work',
  task: "The function `swap` swaps nothing: it works on copies. Rewrite it with **pointers** and call it with `&x` and `&y`.",
  code: H + R`void swap(int a, int b) {
    int t = a;
    a = b;
    b = t;
}

int main() {
    int x = 3, y = 8;
    swap(x, y);
    printf("x = %d, y = %d\n", x, y);
    return 0;
}
`,
  tests: [{ expect: 'x = 8, y = 3\n' }, { patch: [[/int x = 3, y = 8/, 'int x = 1, y = 2']], expect: 'x = 2, y = 1\n' }],
  must: [{ re: /void\s+swap\s*\(\s*int\s*\*\s*\w+\s*,\s*int\s*\*\s*\w+\s*\)/, msg: "The parameters must be pointers: `void swap(int *a, int *b)`" }],
  hint: "`void swap(int *a, int *b)`: inside use `*a` and `*b`. In main: `swap(&x, &y);`",
  learn: "In C parameters are passed **by value** (copies). To change a variable of the caller, you pass its address (**by address**). That is why scanf wants the `&`!",
  solution: H + R`void swap(int *a, int *b) {
    int t = *a;
    *a = *b;
    *b = t;
}

int main() {
    int x = 3, y = 8;
    swap(&x, &y);
    printf("x = %d, y = %d\n", x, y);
    return 0;
}
` },
{ id: 'ptr-null', title: 'The NULL pointer',
  task: "`find` returns the address of the element found, or `NULL` if it does not find it. If the number is not there the program breaks: check for `NULL` and print `not found`.",
  code: H + R`int *find(int *v, int n, int x) {
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
    int *r = find(v, 5, x);
    printf("found: %d\n", *r);
    return 0;
}
`,
  tests: [{ input: '9', expect: 'found: 9\n' }, { input: '100', expect: 'not found\n' }, { input: '3', expect: 'found: 3\n' }],
  must: [{ re: /NULL/, msg: "Compare the pointer with `NULL`." }],
  hint: "`if (r == NULL) { ... } else { ... }`",
  learn: "`NULL` is a pointer that points to nothing. Using `*p` when p is NULL crashes the program: always check!",
  solution: H + R`int *find(int *v, int n, int x) {
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
    int *r = find(v, 5, x);
    if (r == NULL) {
        printf("not found\n");
    } else {
        printf("found: %d\n", *r);
    }
    return 0;
}
` },
{ id: 'ptr-aritmetica', title: 'Walking with a pointer',
  task: "Add up the elements of the array **without using square brackets** `[ ]`: use the pointer `p` and `p++`.",
  code: H + R`int main() {
    int v[5] = {10, 20, 30, 40, 50};
    int *p = v;
    int sum = 0;

    printf("Sum: %d\n", sum);
    return 0;
}
`,
  tests: [{ expect: 'Sum: 150\n' }, { patch: [[/\{10, 20, 30, 40, 50\}/, '{1, 2, 3, 4, 5}']], expect: 'Sum: 15\n' }],
  maxCount: [{ re: /\[/g, max: 1, msg: "Do not use square brackets (except in the declaration of the array)." }],
  hint: "`p` points to the first element. `*p` is its value. `p++` moves the pointer to the next element. Repeat 5 times with a loop.",
  learn: "The name of an array is the address of its first element. `p + 1` points to the next element: `v[i]` is the same as `*(v + i)`.",
  solution: H + R`int main() {
    int v[5] = {10, 20, 30, 40, 50};
    int *p = v;
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        sum += *p;
        p++;
    }
    printf("Sum: %d\n", sum);
    return 0;
}
` },
{ id: 'ptr-array-funzione', title: 'Passing an array',
  task: "Write the function `int sum(int *v, int n)` that returns the sum of the first `n` elements of `v`.",
  code: H + R`// write the function sum here

int main() {
    int n;
    int v[20];
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }
    printf("%d\n", sum(v, n));
    return 0;
}
`,
  tests: [{ input: '3\n1 2 3', expect: '6\n' }, { input: '5\n10 20 30 40 50', expect: '150\n' }, { input: '1\n-4', expect: '-4\n' }],
  hint: "Inside the function you can use `v[i]` as with a normal array.",
  learn: "When you pass an array to a function, you actually pass the address of the first element. That is why you also need the size `n`.",
  solution: H + R`int sum(int *v, int n) {
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
    printf("%d\n", sum(v, n));
    return 0;
}
` },
{ id: 'ptr-minmax', title: 'Two results',
  task: "A function returns a single value with `return`. Complete `minmax` so that it writes the minimum and the maximum into the variables pointed to by `min` and `max`.",
  code: H + R`void minmax(int *v, int n, int *min, int *max) {
    // write here
}

int main() {
    int v[6] = {5, 2, 9, 7, 3, 8};
    int smallest, largest;
    minmax(v, 6, &smallest, &largest);
    printf("min = %d, max = %d\n", smallest, largest);
    return 0;
}
`,
  tests: [{ expect: 'min = 2, max = 9\n' }, { patch: [[/\{5, 2, 9, 7, 3, 8\}/, '{-1, 0, 100, 7, 3, 99}']], expect: 'min = -1, max = 100\n' }],
  hint: "Start with `*min = v[0]; *max = v[0];` then compare with the other elements.",
  learn: "Pointers let a function \"return\" several results, by writing them into the variables of the caller.",
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
    int smallest, largest;
    minmax(v, 6, &smallest, &largest);
    printf("min = %d, max = %d\n", smallest, largest);
    return 0;
}
` },
]},
/* ============================== 10 ============================== */
{ id: 'memoria', title: 'Dynamic memory', levels: [
{ id: 'mem-malloc', title: 'Asking for memory',
  task: "Read `n`, ask with `malloc` for an array of `n` integers, fill it with the squares 1, 4, 9, ... and print it. At the end release the memory with `free`.",
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
  must: [{ re: /malloc/, msg: "Use `malloc`." }, { re: /free\s*\(/, msg: "Release the memory with `free(v);`" }],
  noLeak: true,
  hint: "`v[i] = (i + 1) * (i + 1);` Then print with another loop. Last statement before return: `free(v);`",
  learn: "`malloc` asks for memory while the program runs (on the **heap**). `sizeof(int)` tells how many bytes an int needs. Everything you take with malloc must be given back with `free`.",
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
{ id: 'mem-free', title: 'Do not forget free',
  task: "The program prints the right result, but **does not give the memory back**. Fix it.",
  code: R`#include <stdio.h>
#include <stdlib.h>

int main() {
    double *prices = malloc(3 * sizeof(double));
    prices[0] = 1.5;
    prices[1] = 2.25;
    prices[2] = 4.0;
    double tot = prices[0] + prices[1] + prices[2];
    printf("Total: %.2f\n", tot);
    return 0;
}
`,
  tests: [{ expect: 'Total: 7.75\n' }],
  noLeak: true,
  hint: "Add `free(prices);` when you no longer need it.",
  learn: "Memory that is not released is called a **memory leak**: in a program that runs for a long time it can use up all the memory.",
  solution: R`#include <stdio.h>
#include <stdlib.h>

int main() {
    double *prices = malloc(3 * sizeof(double));
    prices[0] = 1.5;
    prices[1] = 2.25;
    prices[2] = 4.0;
    double tot = prices[0] + prices[1] + prices[2];
    printf("Total: %.2f\n", tot);
    free(prices);
    return 0;
}
` },
{ id: 'mem-dopo-free', title: 'Too early',
  task: "The program uses the memory **after** releasing it. Fix the order of the statements.",
  code: R`#include <stdio.h>
#include <stdlib.h>

int main() {
    int *p = malloc(sizeof(int));
    *p = 123;
    free(p);
    printf("Value: %d\n", *p);
    return 0;
}
`,
  tests: [{ expect: 'Value: 123\n' }],
  noLeak: true,
  hint: "`free` goes after the last use of `p`.",
  learn: "After `free(p)` the memory is no longer yours: using it is a serious mistake (**use after free**).",
  solution: R`#include <stdio.h>
#include <stdlib.h>

int main() {
    int *p = malloc(sizeof(int));
    *p = 123;
    printf("Value: %d\n", *p);
    free(p);
    return 0;
}
` },
]},
/* ============================== 11 ============================== */
{ id: 'struct', title: 'Structs', levels: [
{ id: 'struct-punto', title: 'Your first struct',
  task: "The struct `Point` has two fields, `x` and `y`. Give `y` the value 4 and print the point like this: `(3, 4)`",
  code: H + R`struct Point {
    int x;
    int y;
};

int main() {
    struct Point p;
    p.x = 3;
    printf("(%d)\n", p.x);
    return 0;
}
`,
  tests: [{ expect: '(3, 4)\n' }],
  must: [{ re: /p\.y\s*=\s*4/, msg: "Assign the field: `p.y = 4;`" }],
  hint: "Fields are used with the dot: `p.x`, `p.y`.",
  learn: "A **struct** groups several variables (fields) under a single name. You reach the fields with the dot.",
  solution: H + R`struct Point {
    int x;
    int y;
};

int main() {
    struct Point p;
    p.x = 3;
    p.y = 4;
    printf("(%d, %d)\n", p.x, p.y);
    return 0;
}
` },
{ id: 'struct-persona', title: 'A person',
  task: "Read a name and an age into the struct `p` and print: `Ada is 15 years old`",
  code: H + R`typedef struct {
    char name[30];
    int age;
} Person;

int main() {
    Person p;

    return 0;
}
`,
  tests: [{ input: 'Ada 15', expect: 'Ada is 15 years old\n' }, { input: 'Linus 55', expect: 'Linus is 55 years old\n' }],
  hint: "`scanf(\"%s %d\", p.name, &p.age);` (the name is an array: no `&`).",
  learn: "`typedef` gives a new name to a type: this way you can write `Person` instead of `struct ...`.",
  solution: H + R`typedef struct {
    char name[30];
    int age;
} Person;

int main() {
    Person p;
    scanf("%s %d", p.name, &p.age);
    printf("%s is %d years old\n", p.name, p.age);
    return 0;
}
` },
{ id: 'struct-puntatore', title: 'Moving a point',
  task: "Complete `move`: it must add `dx` to the `x` and `dy` to the `y` of the point. It receives a **pointer**, so use the arrow `->`.",
  code: H + R`struct Point {
    int x;
    int y;
};

void move(struct Point *p, int dx, int dy) {
    // write here
}

int main() {
    struct Point a = {1, 1};
    int dx, dy;
    scanf("%d %d", &dx, &dy);
    move(&a, dx, dy);
    printf("(%d, %d)\n", a.x, a.y);
    return 0;
}
`,
  tests: [{ input: '2 3', expect: '(3, 4)\n' }, { input: '-1 0', expect: '(0, 1)\n' }],
  must: [{ re: /->/, msg: "Use the arrow: `p->x`." }],
  hint: "`p->x += dx;` is the same as `(*p).x += dx;`",
  learn: "With a pointer to a struct you use `->` instead of the dot.",
  solution: H + R`struct Point {
    int x;
    int y;
};

void move(struct Point *p, int dx, int dy) {
    p->x += dx;
    p->y += dy;
}

int main() {
    struct Point a = {1, 1};
    int dx, dy;
    scanf("%d %d", &dx, &dy);
    move(&a, dx, dy);
    printf("(%d, %d)\n", a.x, a.y);
    return 0;
}
` },
{ id: 'struct-array', title: 'The class',
  task: "The array `students` holds 4 students. Find who has the highest mark and print: `The best is Bea with 9`",
  code: H + R`typedef struct {
    char name[20];
    int mark;
} Student;

int main() {
    Student students[4] = {
        {"Ugo", 7},
        {"Bea", 9},
        {"Leo", 6},
        {"Ada", 8}
    };

    return 0;
}
`,
  tests: [{ expect: 'The best is Bea with 9\n' }, { patch: [[/\{"Leo", 6\}/, '{"Leo", 10}']], expect: 'The best is Leo with 10\n' }],
  hint: "Like the maximum in an array: keep the index of the best one and compare `students[i].mark`.",
  learn: "An array of structs is like a table: each element is a row, each field is a column.",
  solution: H + R`typedef struct {
    char name[20];
    int mark;
} Student;

int main() {
    Student students[4] = {
        {"Ugo", 7},
        {"Bea", 9},
        {"Leo", 6},
        {"Ada", 8}
    };
    int best = 0;
    for (int i = 1; i < 4; i++) {
        if (students[i].mark > students[best].mark) {
            best = i;
        }
    }
    printf("The best is %s with %d\n", students[best].name, students[best].mark);
    return 0;
}
` },
]},
/* ============================== 12 ============================== */
{ id: 'preprocessore', title: 'The preprocessor', levels: [
{ id: 'pp-define', title: '#define',
  task: "The number 5 is written in three places. Create `#define N 8` at the top and use `N` instead of 5 everywhere, so that the program prints the numbers from 1 to 8.",
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
  must: [{ re: /#define\s+N\s+8/, msg: "Write `#define N 8` below the include." }],
  mustNot: [{ re: /\b5\b/, msg: "Use `N` instead of 5." }],
  maxCount: [{ re: /\b8\b/g, max: 1, msg: "The number 8 must appear only in the `#define`: elsewhere use `N`." }],
  hint: "After the `#define`, write `int v[N];` and `i < N` in the two loops.",
  learn: "`#define` replaces a name with a value **before** compiling. If a number changes, you change it in one place only.",
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
{ id: 'pp-macro', title: 'The macro with a trap',
  task: "`SQUARE(2 + 3)` should give 25, but the program prints 11. Fix the macro (do not change `main`).",
  code: R`#include <stdio.h>
#define SQUARE(x) x * x

int main() {
    printf("%d\n", SQUARE(2 + 3));
    return 0;
}
`,
  tests: [{ expect: '25\n' }],
  must: [{ re: /printf\("%d\\n", SQUARE\(2 \+ 3\)\)/, msg: "Do not change the line with the printf: fix the #define." }],
  hint: "The macro replaces the text as it is: it becomes `2 + 3 * 2 + 3`. Put parentheses around each `x` and around everything: `((x) * (x))`",
  learn: "Macros do a text replacement, not a calculation. That is why macros always have lots of parentheses.",
  solution: R`#include <stdio.h>
#define SQUARE(x) ((x) * (x))

int main() {
    printf("%d\n", SQUARE(2 + 3));
    return 0;
}
` },
{ id: 'pp-debug', title: 'Turning debug off',
  task: "The `[debug]` messages are only useful while writing the program. Turn them off **without deleting the printfs**: one change to the line with `#define DEBUG` is enough.",
  code: R`#include <stdio.h>
#define DEBUG

int main() {
    int sum = 0;
    for (int i = 1; i <= 3; i++) {
        sum += i;
#ifdef DEBUG
        printf("[debug] i = %d, sum = %d\n", i, sum);
#endif
    }
    printf("Result: %d\n", sum);
    return 0;
}
`,
  tests: [{ expect: 'Result: 6\n' }],
  must: [{ re: /#ifdef\s+DEBUG[\s\S]*\[debug\][\s\S]*#endif/, msg: "Do not delete the block `#ifdef DEBUG ... #endif`." }],
  hint: "If `DEBUG` is not defined, the code between `#ifdef DEBUG` and `#endif` disappears. You can comment out the line `#define DEBUG`.",
  learn: "With `#ifdef` the preprocessor includes or removes pieces of code. It is **conditional compilation**.",
  solution: R`#include <stdio.h>
// #define DEBUG

int main() {
    int sum = 0;
    for (int i = 1; i <= 3; i++) {
        sum += i;
#ifdef DEBUG
        printf("[debug] i = %d, sum = %d\n", i, sum);
#endif
    }
    printf("Result: %d\n", sum);
    return 0;
}
` },
]},
];

if (typeof module === 'object' && module.exports) module.exports = CHAPTERS;
else ((root.CLocales = root.CLocales || {}).en = root.CLocales.en || {}).levels = CHAPTERS;
})(typeof self !== 'undefined' ? self : this);
