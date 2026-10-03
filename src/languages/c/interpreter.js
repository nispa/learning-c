/* Piccolo interprete C didattico, con messaggi in italiano.
   Supporta: int/char/short/long/float/double/unsigned/_Bool, puntatori, array (anche 2D e VLA),
   stringhe, struct, typedef, enum, funzioni, ricorsione, static, #define/#if/#ifdef,
   printf/scanf/getchar/puts/fgets, string.h, stdlib.h (malloc/free...), math.h, ctype.h. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CInterp = factory();
})(typeof self !== 'undefined' ? self : this, function () {
'use strict';

// I messaggi non sono testo ma [chiave, valori]: li traduce l'interfaccia con locales/<lingua>/strings.js.
// Un valore può essere a sua volta [chiave, valori] (un pezzo di frase da tradurre).
class CError extends Error {
  constructor(kind, line, key, vars) { super(key); this.kind = kind; this.line = line; this.msg = [key, vars]; }
}
function cerr(line, key, vars) { throw new CError('compile', line, key, vars); }
function rerr(line, key, vars) { throw new CError('runtime', line, key, vars); }
class ExitSig { constructor(code) { this.code = code; } }

/* ================= TIPI ================= */
function IT(name, size, signed) { return { k: 'int', name, size, signed }; }
const TY = {
  void: { k: 'void', name: 'void', size: 1 },
  char: IT('char', 1, true), uchar: IT('unsigned char', 1, false),
  short: IT('short', 2, true), ushort: IT('unsigned short', 2, false),
  int: IT('int', 4, true), uint: IT('unsigned int', 4, false),
  long: IT('long', 8, true), ulong: IT('unsigned long', 8, false),
  bool: { k: 'int', name: 'bool', size: 1, signed: false, isBool: true },
  float: { k: 'float', name: 'float', size: 4 },
  double: { k: 'float', name: 'double', size: 8 },
};
const ptrCache = new Map();
function ptrT(to) {
  let p = ptrCache.get(to);
  if (!p) { p = { k: 'ptr', to, size: 8 }; ptrCache.set(to, p); }
  return p;
}
function arrT(of, len) { return { k: 'arr', of, len, size: len == null ? 0 : of.size * len }; }
function tname(t) {
  switch (t.k) {
    case 'ptr': return t.to.k === 'arr' ? tname(t.to.of) + ' (*)[' + t.to.len + ']' : tname(t.to) + ' *';
    case 'arr': return tname(t.of) + '[' + (t.len == null ? '' : t.len) + ']';
    case 'struct': return 'struct ' + (t.tag || '{...}');
    case 'func': return tname(t.ret) + ' (...)';
    default: return t.name;
  }
}
function alignOf(t) { return t.k === 'arr' ? alignOf(t.of) : t.k === 'struct' ? t.align : Math.max(1, t.size); }
const isInt = t => t.k === 'int';
const isFloat = t => t.k === 'float';
const isArith = t => t.k === 'int' || t.k === 'float';
const isPtr = t => t.k === 'ptr';
const isScalar = t => isArith(t) || isPtr(t);
function promote(t) { return (t.k === 'int' && t.size < 4) ? TY.int : t; }
function usual(a, b) {
  if (isFloat(a) || isFloat(b)) return (a === TY.double || b === TY.double) ? TY.double : (isFloat(a) && isFloat(b) ? TY.float : (isFloat(a) ? a : b));
  a = promote(a); b = promote(b);
  if (a === b) return a;
  if (a.size === b.size) return a.signed ? b : a;
  return a.size > b.size ? a : b;
}
function wrap(v, t) {
  if (t.isBool) return v ? 1 : 0;
  if (t.size === 8) {
    let b = typeof v === 'bigint' ? v : BigInt(Number.isFinite(v) ? Math.trunc(v) : 0);
    b = t.signed ? BigInt.asIntN(64, b) : BigInt.asUintN(64, b);
    return Number(b);
  }
  v = Number.isFinite(v) ? Math.trunc(v) : 0;
  switch (t.size) {
    case 4: return t.signed ? v | 0 : v >>> 0;
    case 2: return t.signed ? (v << 16) >> 16 : v & 0xffff;
    default: return t.signed ? (v << 24) >> 24 : v & 0xff;
  }
}

// Contesti costanti per i messaggi d'errore dei percorsi veloci (non allocano a ogni assegnamento).
const CTX_INIT = ['ctx.initValue'], CTX_RETURN = ['ctx.returnValue'], CTX_PRINTF_STRING = ['ctx.printfString'], CTX_SCANF_FORMAT = ['ctx.scanfFormat'];

/* ================= LIBRERIE ================= */
const HEADERS = {
  'stdio.h': { NULL: '((void*)0)', EOF: '(-1)', stdin: '((void*)0)', stdout: '((void*)0)' },
  'stdlib.h': { NULL: '((void*)0)', RAND_MAX: '2147483647', EXIT_SUCCESS: '0', EXIT_FAILURE: '1' },
  'string.h': { NULL: '((void*)0)' },
  'math.h': { M_PI: '3.14159265358979323846' },
  'ctype.h': {}, 'time.h': { NULL: '((void*)0)' }, 'stddef.h': { NULL: '((void*)0)' },
  'stdbool.h': { bool: '_Bool', true: '1', false: '0' },
  'limits.h': { CHAR_BIT: '8', CHAR_MAX: '127', CHAR_MIN: '(-128)', UCHAR_MAX: '255', SCHAR_MAX: '127', SCHAR_MIN: '(-128)',
    SHRT_MAX: '32767', SHRT_MIN: '(-32768)', USHRT_MAX: '65535', INT_MAX: '2147483647', INT_MIN: '(-2147483647-1)',
    UINT_MAX: '4294967295u', LONG_MAX: '9223372036854775807l', LONG_MIN: '(-9223372036854775807l-1)' },
  'float.h': {}, 'stdint.h': {},
};

/* ================= PREPROCESSORE + LESSICO ================= */
const KEYWORDS = new Set(('auto break case char const continue default do double else enum extern float for goto if inline int long ' +
  'register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while _Bool').split(' '));
const OPS = ['...', '<<=', '>>=', '->', '++', '--', '<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '+=', '-=', '*=', '/=', '%=', '&=', '^=', '|=', '##',
  '+', '-', '*', '/', '%', '<', '>', '=', '!', '~', '&', '|', '^', '?', ':', ';', ',', '.', '(', ')', '[', ']', '{', '}', '#'];

function stripComments(src) {
  let out = '', i = 0, n = src.length, line = 1;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '"' || c === "'") {
      const q = c; out += c; i++;
      while (i < n && src[i] !== q && src[i] !== '\n') { if (src[i] === '\\' && i + 1 < n && src[i + 1] !== '\n') { out += src[i]; i++; } out += src[i]; i++; }
      if (i < n && src[i] === q) { out += q; i++; }
      continue;
    }
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') {
      const start = line; i += 2; out += ' ';
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') { out += '\n'; line++; } i++; }
      if (i >= n) cerr(start, 'err.unclosedComment');
      i += 2; continue;
    }
    if (c === '\n') line++;
    out += c; i++;
  }
  return out;
}

function escapeChar(s, i, line) { // s[i] === '\\'
  const c = s[i + 1];
  const simple = { n: 10, t: 9, r: 13, '0': 0, '\\': 92, "'": 39, '"': 34, a: 7, b: 8, f: 12, v: 11, '?': 63 };
  if (c === 'x') { const m = /^[0-9a-fA-F]+/.exec(s.slice(i + 2)); if (!m) cerr(line, 'err.badHexEscape'); return [parseInt(m[0], 16) & 255, 2 + m[0].length]; }
  if (/[0-7]/.test(c)) { const m = /^[0-7]{1,3}/.exec(s.slice(i + 1)); return [parseInt(m[0], 8) & 255, 1 + m[0].length]; }
  if (c in simple) return [simple[c], 2];
  cerr(line, 'err.unknownEscape', { c });
}
const enc = new TextEncoder();
function lexLine(text, line) {
  const toks = []; let i = 0; const n = text.length;
  while (i < n) {
    const c = text[i];
    if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v') { i++; continue; }
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1; while (j < n && /[A-Za-z0-9_]/.test(text[j])) j++;
      toks.push({ t: 'id', v: text.slice(i, j), line }); i = j; continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(text[i + 1] || ''))) {
      const m = /^(0[xX][0-9a-fA-F]+|[0-9]*\.?[0-9]*(?:[eE][+-]?[0-9]+)?)([uUlLfF]*)/.exec(text.slice(i));
      const body = m[1], suf = m[2].toLowerCase();
      const after = text[i + m[0].length];
      if (after && /[A-Za-z0-9_]/.test(after)) cerr(line, 'err.badNumber', { text: text.slice(i, i + m[0].length + 1) });
      const isF = !/^0[xX]/.test(body) && /[.eE]/.test(body) || (suf.includes('f') && !/^0[xX]/.test(body));
      toks.push({ t: 'num', v: body, suf, isF, line }); i += m[0].length; continue;
    }
    if (c === '"') {
      let j = i + 1; const bytes = [];
      while (j < n && text[j] !== '"') {
        if (text[j] === '\\') { const [b, len] = escapeChar(text, j, line); bytes.push(b); j += len; }
        else { const cp = text.codePointAt(j); const ch = String.fromCodePoint(cp); for (const b of enc.encode(ch)) bytes.push(b); j += ch.length; }
      }
      if (j >= n) cerr(line, 'err.unclosedString');
      toks.push({ t: 'str', bytes, raw: text.slice(i, j + 1), line }); i = j + 1; continue;
    }
    if (c === "'") {
      let j = i + 1, val;
      if (text[j] === '\\') { const [b, len] = escapeChar(text, j, line); val = b; j += len; }
      else if (text[j] === "'") cerr(line, 'err.emptyChar');
      else { const cp = text.codePointAt(j); val = cp < 256 ? cp : 63; j += String.fromCodePoint(cp).length; }
      if (text[j] !== "'") cerr(line, 'err.charTooLong');
      toks.push({ t: 'chr', v: val, raw: text.slice(i, j + 1), line }); i = j + 1; continue;
    }
    let op = null;
    for (const o of OPS) if (text.startsWith(o, i)) { op = o; break; }
    if (op) { toks.push({ t: 'op', v: op, line }); i += op.length; continue; }
    if (c === '“' || c === '”' || c === '‘' || c === '’' || c === '«' || c === '»')
      cerr(line, 'err.smartQuote', { c });
    cerr(line, 'err.badChar', { c });
  }
  return toks;
}

// Il token trovato al posto di quello atteso, per i messaggi d'errore.
function found(t) { return !t || t.t === 'eof' ? ['frag.endOfProgram'] : "'" + tokText(t) + "'"; }
function tokText(t) {
  if (!t || t.t === 'eof') return '';
  if (t.t === 'str' || t.t === 'chr') return t.raw;
  if (t.t === 'num') return t.v + (t.suf || '');
  return t.v;
}

function preprocess(src) {
  const text = stripComments(src.replace(/\r\n?/g, '\n'));
  const raw = text.split('\n');
  const lines = [];
  for (let i = 0; i < raw.length; i++) {
    let s = raw[i]; const ln = i + 1;
    while (/\\\s*$/.test(s) && i + 1 < raw.length) { s = s.replace(/\\\s*$/, ' ') + raw[++i]; }
    lines.push({ s, ln });
  }
  const macros = new Map();
  const headers = new Set();
  const out = [];
  let pending = [];
  const conds = []; // {active, taken, line}
  const active = () => conds.every(c => c.active);
  const defineStr = (name, body) => macros.set(name, { params: null, body: lexLine(body, 0) });

  function expand(toks, hide) {
    const res = [];
    for (let i = 0; i < toks.length; i++) {
      const tk = toks[i];
      if (tk.t === 'id') {
        if (tk.v === '__LINE__') { res.push({ t: 'num', v: String(tk.line), suf: '', isF: false, line: tk.line }); continue; }
        if (tk.v === '__FILE__') { res.push({ t: 'str', bytes: [...enc.encode('main.c')], raw: '"main.c"', line: tk.line }); continue; }
        const m = macros.get(tk.v);
        if (m && !hide.has(tk.v)) {
          const h2 = new Set(hide); h2.add(tk.v);
          if (!m.params) { res.push(...expand(m.body.map(b => ({ ...b, line: tk.line })), h2)); continue; }
          const nx = toks[i + 1];
          if (nx && nx.t === 'op' && nx.v === '(') {
            let depth = 0, j, args = [[]];
            for (j = i + 1; j < toks.length; j++) {
              const x = toks[j];
              if (x.t === 'op' && (x.v === '(' || x.v === '[')) { depth++; if (depth === 1 && x.v === '(') continue; }
              else if (x.t === 'op' && (x.v === ')' || x.v === ']')) { depth--; if (depth === 0) break; }
              else if (x.t === 'op' && x.v === ',' && depth === 1) { args.push([]); continue; }
              args[args.length - 1].push(x);
            }
            if (j >= toks.length) cerr(tk.line, 'err.macroUnclosed', { name: tk.v });
            if (m.params.length === 0 && args.length === 1 && args[0].length === 0) args = [];
            if (args.length !== m.params.length) cerr(tk.line, 'err.macroArgs', { name: tk.v, want: m.params.length, given: args.length });
            const body = [];
            for (let k = 0; k < m.body.length; k++) {
              const b = m.body[k];
              if (b.t === 'op' && b.v === '#' && m.body[k + 1] && m.body[k + 1].t === 'id' && m.params.includes(m.body[k + 1].v)) {
                const a = args[m.params.indexOf(m.body[k + 1].v)];
                const s = a.map(tokText).join(' ');
                body.push({ t: 'str', bytes: [...enc.encode(s)], raw: JSON.stringify(s), line: tk.line }); k++; continue;
              }
              if (b.t === 'op' && b.v === '##' && body.length && m.body[k + 1]) {
                const prev = body.pop(); let nt = m.body[k + 1]; k++;
                let ntxt = nt.t === 'id' && m.params.includes(nt.v) ? args[m.params.indexOf(nt.v)].map(tokText).join('') : tokText(nt);
                const joined = lexLine(tokText(prev) + ntxt, tk.line);
                body.push(...joined); continue;
              }
              if (b.t === 'id' && m.params.includes(b.v)) {
                const a = args[m.params.indexOf(b.v)].map(x => ({ ...x, line: tk.line }));
                const nextIsPaste = m.body[k + 1] && m.body[k + 1].t === 'op' && m.body[k + 1].v === '##';
                body.push(...(nextIsPaste ? a : expand(a, hide)));
                continue;
              }
              body.push({ ...b, line: tk.line });
            }
            res.push(...expand(body, h2)); i = j; continue;
          }
        }
      }
      res.push(tk);
    }
    return res;
  }
  function flush() { if (pending.length) { out.push(...expand(pending, new Set())); pending = []; } }

  function ppEval(toks, ln) {
    // defined
    const t2 = [];
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t.t === 'id' && t.v === 'defined') {
        let name;
        if (toks[i + 1] && toks[i + 1].v === '(') { name = toks[i + 2] && toks[i + 2].v; i += 3; }
        else { name = toks[i + 1] && toks[i + 1].v; i += 1; }
        t2.push({ t: 'num', v: macros.has(name) ? '1' : '0', suf: '', line: ln });
      } else t2.push(t);
    }
    const ex = expand(t2, new Set()).map(t => t.t === 'id' ? { t: 'num', v: '0', suf: '', line: ln } : t);
    let p = 0;
    const peek = () => ex[p];
    function prim() {
      const t = ex[p++];
      if (!t) cerr(ln, 'err.ifIncomplete');
      if (t.t === 'num') return Number(t.v.startsWith('0x') || t.v.startsWith('0X') ? parseInt(t.v, 16) : parseFloat(t.v));
      if (t.t === 'chr') return t.v;
      if (t.v === '(') { const v = expr(0); p++; return v; }
      if (t.v === '!') return prim() ? 0 : 1;
      if (t.v === '-') return -prim();
      if (t.v === '+') return prim();
      if (t.v === '~') return ~prim();
      cerr(ln, 'err.ifUnknown', { tok: tokText(t) });
    }
    const prec = { '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6, '<': 7, '>': 7, '<=': 7, '>=': 7, '<<': 8, '>>': 8, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10 };
    function expr(min) {
      let l = prim();
      for (;;) {
        const t = peek();
        if (t && t.v === '?' && min === 0) { p++; const a = expr(0); p++; const b = expr(0); l = l ? a : b; continue; }
        if (!t || t.t !== 'op' || !(t.v in prec) || prec[t.v] < min) return l;
        p++; const r = expr(prec[t.v] + 1);
        switch (t.v) {
          case '||': l = (l || r) ? 1 : 0; break; case '&&': l = (l && r) ? 1 : 0; break;
          case '|': l = l | r; break; case '^': l = l ^ r; break; case '&': l = l & r; break;
          case '==': l = +(l === r); break; case '!=': l = +(l !== r); break;
          case '<': l = +(l < r); break; case '>': l = +(l > r); break; case '<=': l = +(l <= r); break; case '>=': l = +(l >= r); break;
          case '<<': l = l << r; break; case '>>': l = l >> r; break;
          case '+': l = l + r; break; case '-': l = l - r; break; case '*': l = l * r; break;
          case '/': l = r ? Math.trunc(l / r) : 0; break; case '%': l = r ? l % r : 0; break;
        }
      }
    }
    return expr(0);
  }

  for (const { s, ln } of lines) {
    const m = /^\s*#\s*([A-Za-z_]*)\s*(.*)$/.exec(s);
    if (!m) { if (active()) pending.push(...lexLine(s, ln)); continue; }
    flush();
    const dir = m[1], rest = m[2].trim();
    if (dir === 'ifdef' || dir === 'ifndef') {
      const name = rest.split(/\s+/)[0];
      if (!name) cerr(ln, 'err.macroNameMissing', { dir });
      const v = macros.has(name) === (dir === 'ifdef');
      conds.push({ active: v, taken: v, line: ln }); continue;
    }
    if (dir === 'if') { const v = active() ? !!ppEval(lexLine(rest, ln), ln) : false; conds.push({ active: v, taken: v, line: ln }); continue; }
    if (dir === 'elif') {
      const c = conds[conds.length - 1]; if (!c) cerr(ln, 'err.elifWithoutIf');
      if (c.taken) c.active = false;
      else { conds.pop(); const v = active() ? !!ppEval(lexLine(rest, ln), ln) : false; conds.push({ active: v, taken: v, line: c.line }); }
      continue;
    }
    if (dir === 'else') { const c = conds[conds.length - 1]; if (!c) cerr(ln, 'err.elseWithoutIf'); c.active = !c.taken; c.taken = true; continue; }
    if (dir === 'endif') { if (!conds.length) cerr(ln, 'err.endifWithoutIf'); conds.pop(); continue; }
    if (!active()) continue;
    if (dir === 'include') {
      const mm = /^[<"]\s*([^>"]+?)\s*[>"]/.exec(rest);
      if (!mm) cerr(ln, 'err.includeSyntax');
      if (rest[0] === '"') cerr(ln, 'err.includeQuotes');
      const h = mm[1];
      if (!(h in HEADERS)) cerr(ln, 'err.unknownHeader', { h, list: Object.keys(HEADERS).map(x => '<' + x + '>').join(' ') });
      headers.add(h);
      for (const [k, v] of Object.entries(HEADERS[h])) if (!macros.has(k)) defineStr(k, v);
      continue;
    }
    if (dir === 'define') {
      const dm = /^([A-Za-z_]\w*)(\(([^)]*)\))?\s*(.*)$/.exec(rest);
      if (!dm) cerr(ln, 'err.defineSyntax');
      const params = dm[2] !== undefined ? dm[3].split(',').map(x => x.trim()).filter(x => x) : null;
      macros.set(dm[1], { params, body: lexLine(dm[4], ln) });
      continue;
    }
    if (dir === 'undef') { macros.delete(rest.split(/\s+/)[0]); continue; }
    if (dir === 'error') cerr(ln, 'err.hashError', { text: rest });
    if (dir === 'pragma' || dir === 'warning' || dir === '') continue;
    cerr(ln, 'err.unknownDirective', { dir });
  }
  flush();
  if (conds.length) cerr(conds[conds.length - 1].line, 'err.ifUnclosed');
  const lastLine = lines.length ? lines[lines.length - 1].ln : 1;
  out.push({ t: 'eof', v: '', line: lastLine });
  return { tokens: out, headers, macros };
}

/* ================= FUNZIONI DI LIBRERIA (firme) ================= */
const P = (t) => ptrT(t);
const BUILTINS = {
  printf: { h: 'stdio.h', ret: TY.int, min: 1, va: true }, scanf: { h: 'stdio.h', ret: TY.int, min: 1, va: true },
  sprintf: { h: 'stdio.h', ret: TY.int, min: 2, va: true },
  putchar: { h: 'stdio.h', ret: TY.int, min: 1 }, puts: { h: 'stdio.h', ret: TY.int, min: 1 }, getchar: { h: 'stdio.h', ret: TY.int, min: 0 },
  fgets: { h: 'stdio.h', ret: P(TY.char), min: 3 }, fflush: { h: 'stdio.h', ret: TY.int, min: 1 },
  strlen: { h: 'string.h', ret: TY.ulong, min: 1 }, strcpy: { h: 'string.h', ret: P(TY.char), min: 2 }, strncpy: { h: 'string.h', ret: P(TY.char), min: 3 },
  strcat: { h: 'string.h', ret: P(TY.char), min: 2 }, strncat: { h: 'string.h', ret: P(TY.char), min: 3 }, strcmp: { h: 'string.h', ret: TY.int, min: 2 },
  strncmp: { h: 'string.h', ret: TY.int, min: 3 }, strchr: { h: 'string.h', ret: P(TY.char), min: 2 },
  memset: { h: 'string.h', ret: P(TY.void), min: 3 }, memcpy: { h: 'string.h', ret: P(TY.void), min: 3 },
  malloc: { h: 'stdlib.h', ret: P(TY.void), min: 1 }, calloc: { h: 'stdlib.h', ret: P(TY.void), min: 2 }, realloc: { h: 'stdlib.h', ret: P(TY.void), min: 2 },
  free: { h: 'stdlib.h', ret: TY.void, min: 1 }, abs: { h: 'stdlib.h', ret: TY.int, min: 1 }, atoi: { h: 'stdlib.h', ret: TY.int, min: 1 },
  rand: { h: 'stdlib.h', ret: TY.int, min: 0 }, srand: { h: 'stdlib.h', ret: TY.void, min: 1 }, exit: { h: 'stdlib.h', ret: TY.void, min: 1 },
  sqrt: { h: 'math.h', ret: TY.double, min: 1 }, pow: { h: 'math.h', ret: TY.double, min: 2 }, fabs: { h: 'math.h', ret: TY.double, min: 1 },
  floor: { h: 'math.h', ret: TY.double, min: 1 }, ceil: { h: 'math.h', ret: TY.double, min: 1 }, round: { h: 'math.h', ret: TY.double, min: 1 },
  sin: { h: 'math.h', ret: TY.double, min: 1 }, cos: { h: 'math.h', ret: TY.double, min: 1 },
  toupper: { h: 'ctype.h', ret: TY.int, min: 1 }, tolower: { h: 'ctype.h', ret: TY.int, min: 1 }, isdigit: { h: 'ctype.h', ret: TY.int, min: 1 },
  isalpha: { h: 'ctype.h', ret: TY.int, min: 1 }, isupper: { h: 'ctype.h', ret: TY.int, min: 1 }, islower: { h: 'ctype.h', ret: TY.int, min: 1 },
  isspace: { h: 'ctype.h', ret: TY.int, min: 1 }, isalnum: { h: 'ctype.h', ret: TY.int, min: 1 },
  time: { h: 'time.h', ret: TY.long, min: 1 },
};

function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function suggest(name, cands) {
  let best = null, bd = 99;
  for (const c of cands) { if (c === name) continue; const d = lev(name.toLowerCase(), c.toLowerCase()); if (d < bd) { bd = d; best = c; } }
  if (best && (bd <= 1 || (bd <= 2 && name.length > 4))) return ['hint.didYouMean', { name: best }];
  return '';
}

/* ================= PARSER ================= */
const TYPE_KW = new Set(['void', 'char', 'short', 'int', 'long', 'float', 'double', 'signed', 'unsigned', 'struct', 'union', 'enum', 'const', 'volatile',
  'static', 'extern', 'register', 'auto', 'typedef', 'inline', '_Bool', 'restrict']);

function exprText(n) {
  if (!n) return '?';
  switch (n.k) {
    case 'id': return n.name;
    case 'num': return n.text != null ? n.text : String(n.v);
    case 'str': return '"..."';
    case 'idx': return exprText(n.a) + '[' + exprText(n.i) + ']';
    case 'mem': return exprText(n.e) + (n.arrow ? '->' : '.') + n.name;
    case 'un': return n.op + exprText(n.e);
    case 'pre': return n.op + exprText(n.e);
    case 'post': return exprText(n.e) + n.op;
    case 'call': return n.name + '(...)';
    case 'bin': return exprText(n.l) + ' ' + n.op + ' ' + exprText(n.r);
    case 'assign': return exprText(n.l) + ' ' + n.op + ' ' + exprText(n.r);
    case 'cast': return '(' + tname(n.t) + ')' + exprText(n.e);
    case 'paren': return '(' + exprText(n.e) + ')';
    default: return 'espressione';
  }
}

class Parser {
  constructor(pp) {
    this.toks = pp.tokens; this.p = 0; this.headers = pp.headers;
    this.typedefs = new Map(); this.structs = new Map();
    this.scopes = [new Map()];
    this.funcTypes = new Map(); this.funcDefs = new Map(); this.funcLines = new Map();
    this.globals = []; this.strings = []; this.calls = []; this.warnings = [];
    this.loopDepth = 0; this.switchDepth = 0; this.curFunc = null;
  }
  peek(o = 0) { return this.toks[Math.min(this.p + o, this.toks.length - 1)]; }
  next() { return this.toks[this.p++ < this.toks.length ? this.p - 1 : this.toks.length - 1]; }
  prev() { return this.toks[Math.max(0, this.p - 1)]; }
  isOp(v, o = 0) { const t = this.peek(o); return t.t === 'op' && t.v === v; }
  isKw(v, o = 0) { const t = this.peek(o); return t.t === 'id' && t.v === v; }
  acceptOp(v) { if (this.isOp(v)) { this.p++; return true; } return false; }
  acceptKw(v) { if (this.isKw(v)) { this.p++; return true; } return false; }
  expectOp(v, ctx) {
    if (this.acceptOp(v)) return;
    const t = this.peek();
    if (v === ';') {
      const pl = this.prev().line;
      cerr(pl, ctx ? 'err.missingSemicolonCtx' : 'err.missingSemicolon', { ctx });
    }
    if (t.t === 'eof') cerr(this.prev().line, 'err.unexpectedEnd', { v });
    const hint = (v === ')' && t.t === 'op' && t.v === ';') ? ['hint.missingCloseParen'] : '';
    cerr(t.line, ctx ? 'err.expectedCtx' : 'err.expected', { v, ctx, found: found(t), hint });
  }
  err(key, vars) { cerr(this.peek().line, key, vars); }
  pushScope() { this.scopes.push(new Map()); }
  popScope() { this.scopes.pop(); }
  lookup(name) { for (let i = this.scopes.length - 1; i >= 0; i--) { const s = this.scopes[i].get(name); if (s) return s; } return null; }
  declare(name, info, line) {
    const sc = this.scopes[this.scopes.length - 1];
    const old = sc.get(name);
    if (old && !(old.kind === 'func' && info.kind === 'func') && !(old.kind === 'var' && old.extern)) {
      cerr(line, 'err.duplicateName', { name, line: old.line });
    }
    sc.set(name, { ...info, line });
  }
  allNames() {
    const s = new Set();
    for (const sc of this.scopes) for (const k of sc.keys()) s.add(k);
    for (const [k, b] of Object.entries(BUILTINS)) if (this.headers.has(b.h)) s.add(k);
    for (const k of KEYWORDS) s.add(k);
    for (const k of this.typedefs.keys()) s.add(k);
    s.add('printf'); s.add('scanf');
    return s;
  }
  isTypeStart(o = 0) {
    const t = this.peek(o);
    if (t.t !== 'id') return false;
    if (TYPE_KW.has(t.v)) return true;
    if (this.typedefs.has(t.v)) { const l = this.lookup(t.v); return !l || l.kind === 'typedef'; }
    return false;
  }

  parseProgram() {
    while (this.peek().t !== 'eof') this.parseExternal();
    for (const c of this.calls) {
      if (c.resolved) continue;
      if (this.funcTypes.has(c.name)) {
        cerr(c.line, 'err.funcUsedBeforeDecl', { name: c.name, proto: this.protoText(c.name) });
      }
      const b = BUILTINS[c.name];
      if (b) cerr(c.line, 'err.missingInclude', { name: c.name, h: b.h });
      cerr(c.line, 'err.unknownFunc', { name: c.name, suggest: suggest(c.name, [...this.funcTypes.keys(), ...Object.keys(BUILTINS)]) });
    }
    if (!this.funcDefs.has('main')) {
      cerr(this.peek().line, 'err.noMain');
    }
    return { funcs: this.funcDefs, globals: this.globals, strings: this.strings, warnings: this.warnings, funcTypes: this.funcTypes };
  }
  protoText(name) {
    const ft = this.funcTypes.get(name);
    if (!ft) return name + '(...);';
    const ps = ft.params.length ? ft.params.map((t, i) => tname(t) + ' ' + (ft.names[i] || 'x' + i)).join(', ') : 'void';
    return `${tname(ft.ret)} ${name}(${ps});`;
  }

  parseDeclSpecs() {
    let storage = null; const cnt = {}; let base = null; let any = false; const line = this.peek().line;
    for (;;) {
      const t = this.peek();
      if (t.t !== 'id') break;
      const v = t.v;
      if (v === 'typedef' || v === 'static' || v === 'extern' || v === 'register' || v === 'auto') { storage = v; this.p++; any = true; continue; }
      if (v === 'const' || v === 'volatile' || v === 'inline' || v === 'restrict') { this.p++; any = true; continue; }
      if (['signed', 'unsigned', 'short', 'long', 'int', 'char', 'float', 'double', 'void', '_Bool'].includes(v)) { cnt[v] = (cnt[v] || 0) + 1; this.p++; any = true; continue; }
      if (v === 'struct' || v === 'union') { if (v === 'union') this.err('err.unionUnsupported'); this.p++; base = this.parseStruct(); any = true; continue; }
      if (v === 'enum') { this.p++; base = this.parseEnum(); any = true; continue; }
      if (this.typedefs.has(v) && base === null && Object.keys(cnt).length === 0) {
        const l = this.lookup(v); if (l && l.kind !== 'typedef') break;
        base = this.typedefs.get(v); this.p++; any = true; continue;
      }
      break;
    }
    if (!any) return null;
    if (base === null) {
      if (cnt.void) base = TY.void;
      else if (cnt._Bool) base = TY.bool;
      else if (cnt.char) base = cnt.unsigned ? TY.uchar : TY.char;
      else if (cnt.float) base = TY.float;
      else if (cnt.double) base = TY.double;
      else if (cnt.short) base = cnt.unsigned ? TY.ushort : TY.short;
      else if (cnt.long) base = cnt.unsigned ? TY.ulong : TY.long;
      else if (cnt.int || cnt.signed || cnt.unsigned) base = cnt.unsigned ? TY.uint : TY.int;
      else cerr(line, 'err.missingType');
    }
    return { t: base, storage, line };
  }
  parseStruct() {
    let tag = null; const line = this.peek().line;
    if (this.peek().t === 'id' && !this.isOp('{')) tag = this.next().v;
    let st = tag ? this.structs.get(tag) : null;
    if (!st) { st = { k: 'struct', tag, fields: null, size: 0, align: 1 }; if (tag) this.structs.set(tag, st); }
    if (this.acceptOp('{')) {
      if (st.fields) cerr(line, 'err.structTwice', { tag });
      const fields = []; let off = 0, al = 1;
      while (!this.acceptOp('}')) {
        if (this.peek().t === 'eof') cerr(line, 'err.structUnclosed');
        const sp = this.parseDeclSpecs();
        if (!sp) this.err('err.structFieldExpected', { found: found(this.peek()) });
        do {
          const d = this.parseDeclarator(sp.t, false);
          if (d.vla) cerr(d.line, 'err.structVlaField');
          if (d.t.k === 'struct' && !d.t.fields) cerr(d.line, 'err.structIncomplete', { tag: d.t.tag });
          if (fields.some(f => f.name === d.name)) cerr(d.line, 'err.fieldTwice', { name: d.name });
          const a = alignOf(d.t); off = Math.ceil(off / a) * a; al = Math.max(al, a);
          fields.push({ name: d.name, t: d.t, off }); off += d.t.size;
        } while (this.acceptOp(','));
        this.expectOp(';', ['ctx.afterStructField']);
      }
      st.fields = fields; st.align = al; st.size = Math.max(1, Math.ceil(off / al) * al);
      if (!this.isOp(';') && this.p < this.toks.length && this.peek().t !== 'id' && !this.isOp('*')) {
        // ok
      }
    } else if (!tag) this.err('err.structNameExpected');
    return st;
  }
  parseEnum() {
    if (this.peek().t === 'id' && !this.isOp('{')) this.next();
    if (this.acceptOp('{')) {
      let val = 0;
      while (!this.acceptOp('}')) {
        const t = this.next(); if (t.t !== 'id') cerr(t.line, 'err.enumNames');
        if (this.acceptOp('=')) { const e = this.parseCond(); const c = this.constVal(e); if (c === undefined) cerr(t.line, 'err.enumConst'); val = c; }
        this.declare(t.v, { kind: 'enum', val }, t.line); val++;
        if (!this.acceptOp(',')) { this.expectOp('}', ['ctx.close', { what: 'enum' }]); break; }
      }
    }
    return TY.int;
  }
  parseDeclarator(base, abstract) {
    let t = base;
    while (this.acceptOp('*')) { t = ptrT(t); while (this.acceptKw('const') || this.acceptKw('volatile') || this.acceptKw('restrict')); }
    let name = null; const line = this.peek().line;
    const tk = this.peek();
    if (tk.t === 'id' && !KEYWORDS.has(tk.v)) { name = tk.v; this.p++; }
    else if (tk.t === 'id' && KEYWORDS.has(tk.v) && !abstract) cerr(tk.line, 'err.reservedWord', { word: tk.v });
    else if (this.isOp('(') && !abstract) cerr(tk.line, 'err.funcPtrUnsupported');
    else if (!abstract) {
      if (tk.t === 'num') cerr(tk.line, 'err.nameStartsWithDigit', { tok: tokText(tk) });
      cerr(tk.line, 'err.nameExpected', { found: found(tk) });
    }
    const dims = []; let fn = null;
    for (;;) {
      if (this.acceptOp('[')) { if (this.acceptOp(']')) dims.push(null); else { const e = this.parseAssign(); this.expectOp(']', ['ctx.closeArrayDim']); dims.push(e); } }
      else if (this.isOp('(') && !dims.length && !fn && name) { this.p++; fn = this.parseParams(); }
      else break;
    }
    if (fn) return { name, line, t: { k: 'func', ret: t, params: fn.types, names: fn.names, variadic: fn.variadic, noproto: fn.noproto } };
    if (dims.length) {
      const lens = dims.map(e => e === null ? null : this.constVal(e));
      if (lens.some((l, i) => l === undefined)) {
        return { name, line, t: null, vla: { base: t, dims } };
      }
      for (let i = 0; i < lens.length; i++) {
        if (i > 0 && lens[i] === null) cerr(line, 'err.onlyFirstDimEmpty');
        if (lens[i] !== null && lens[i] <= 0) cerr(line, 'err.arrayDimPositive', { n: lens[i] });
      }
      for (let i = lens.length - 1; i >= 0; i--) t = arrT(t, lens[i]);
    }
    return { name, line, t };
  }
  parseParams() {
    const types = [], names = []; let variadic = false;
    if (this.acceptOp(')')) return { types, names, variadic, noproto: true };
    if (this.isKw('void') && this.isOp(')', 1)) { this.p += 2; return { types, names, variadic }; }
    for (;;) {
      if (this.acceptOp('...')) { variadic = true; break; }
      const sp = this.parseDeclSpecs();
      if (!sp) this.err('err.paramTypeExpected', { found: found(this.peek()) });
      const d = this.parseDeclarator(sp.t, true);
      let t = d.t;
      if (d.vla) { // es: int v[n] oppure int m[][n]
        let base = d.vla.base;
        for (let i = d.vla.dims.length - 1; i >= 1; i--) { const c = this.constVal(d.vla.dims[i]); if (c === undefined) cerr(d.line, 'err.paramDimsConst'); base = arrT(base, c); }
        t = ptrT(base);
      }
      if (t.k === 'arr') t = ptrT(t.of);
      if (t.k === 'void') cerr(d.line, 'err.voidParam');
      types.push(t); names.push(d.name);
      if (!this.acceptOp(',')) break;
    }
    this.expectOp(')', ['ctx.closeParams']);
    return { types, names, variadic };
  }

  parseExternal() {
    const start = this.peek();
    const sp = this.parseDeclSpecs();
    if (!sp) {
      if (start.t === 'id' && this.isOp('(', 1)) cerr(start.line, 'err.missingTypeBefore', { name: start.v });
      if (start.t === 'op' && start.v === '}') cerr(start.line, 'err.extraBrace');
      cerr(start.line, 'err.declExpected', { found: found(start) });
    }
    if (this.acceptOp(';')) return;
    let first = true;
    for (;;) {
      const d = this.parseDeclarator(sp.t, false);
      if (sp.storage === 'typedef') {
        if (d.vla) cerr(d.line, 'err.typedefVla');
        this.typedefs.set(d.name, d.t); this.declare(d.name, { kind: 'typedef' }, d.line);
      } else if (d.t && d.t.k === 'func') {
        this.declareFunc(d);
        if (first && this.isOp('{')) { this.parseFuncDef(d); return; }
      } else {
        if (d.vla) cerr(d.line, 'err.globalVla');
        if (d.t.k === 'void') cerr(d.line, 'err.voidVar');
        let init = null;
        if (this.acceptOp('=')) init = this.parseInitializer();
        const t = this.fixArrayLen(d.t, init, d.line);
        this.declare(d.name, { kind: 'var', t, extern: sp.storage === 'extern' }, d.line);
        if (sp.storage !== 'extern') this.globals.push({ name: d.name, t, init, line: d.line });
      }
      first = false;
      if (!this.acceptOp(',')) break;
    }
    if (this.isOp('{')) cerr(this.peek().line, 'err.braceAfterSemicolon');
    this.expectOp(';');
  }
  declareFunc(d) {
    const old = this.funcTypes.get(d.name);
    if (old && (old.params.length !== d.t.params.length) && !old.noproto && !d.t.noproto)
      cerr(d.line, 'err.funcRedeclared', { name: d.name });
    if (!old || old.noproto) this.funcTypes.set(d.name, d.t);
    this.scopes[0].set(d.name, { kind: 'func', t: d.t, line: d.line });
  }
  parseFuncDef(d) {
    if (this.funcDefs.has(d.name)) cerr(d.line, 'err.funcTwice', { name: d.name, line: this.funcLines.get(d.name) });
    if (d.name === 'main' && d.t.ret !== TY.int && d.t.ret !== TY.void) cerr(d.line, 'err.mainReturnsInt');
    d.t.params.forEach((pt, i) => { if (!d.t.names[i]) cerr(d.line, 'err.paramUnnamed', { n: i + 1, name: d.name }); });
    this.funcTypes.set(d.name, d.t);
    this.funcLines.set(d.name, d.line);
    this.curFunc = { name: d.name, ret: d.t.ret };
    this.pushScope();
    d.t.params.forEach((pt, i) => this.declare(d.t.names[i], { kind: 'var', t: pt }, d.line));
    const body = this.parseBlock(false);
    this.popScope();
    const node = { name: d.name, t: d.t, body, line: d.line };
    this.funcDefs.set(d.name, node);
    this.curFunc = null;
  }
  fixArrayLen(t, init, line) {
    if (t.k === 'arr' && t.len == null) {
      if (!init) cerr(line, 'err.arrayNeedsInit');
      let n;
      if (init.k === 'str') n = init.bytes.length + 1;
      else if (init.k === 'initlist') n = init.items.length;
      else cerr(line, 'err.arrayInitBraces');
      return arrT(t.of, n);
    }
    return t;
  }
  parseInitializer() {
    if (this.isOp('{')) {
      const line = this.next().line; const items = [];
      while (!this.acceptOp('}')) {
        if (this.acceptOp('.')) { this.err('err.designatedInit'); }
        items.push(this.parseInitializer());
        if (!this.acceptOp(',')) { this.expectOp('}', ['ctx.closeInitList']); break; }
      }
      return { k: 'initlist', items, line };
    }
    return this.parseAssign();
  }
  parseBlock(newScope = true) {
    const open = this.peek();
    this.expectOp('{', open.t === 'op' && open.v === ';' ? ['ctx.extraSemicolonParen'] : '');
    if (newScope) this.pushScope();
    const items = [];
    while (!this.acceptOp('}')) {
      if (this.peek().t === 'eof') cerr(open.line, 'err.braceUnclosed');
      items.push(this.parseBlockItem());
    }
    if (newScope) this.popScope();
    return { k: 'block', items, line: open.line };
  }
  parseBlockItem() {
    if (this.isTypeStart()) return this.parseLocalDecl();
    return this.parseStmt();
  }
  parseLocalDecl() {
    const sp = this.parseDeclSpecs(); const line = sp.line;
    if (this.acceptOp(';')) return { k: 'empty', line };
    const decls = [];
    for (;;) {
      const d = this.parseDeclarator(sp.t, false);
      if (sp.storage === 'typedef') { this.typedefs.set(d.name, d.t); this.declare(d.name, { kind: 'typedef' }, d.line); }
      else if (d.t && d.t.k === 'func') { this.declareFunc(d); }
      else {
        let init = null;
        if (d.t && d.t.k === 'void') cerr(d.line, 'err.voidVar');
        if (this.acceptOp('=')) init = this.parseInitializer();
        let t = d.t;
        if (t) t = this.fixArrayLen(t, init, d.line);
        if (d.vla && init) cerr(d.line, 'err.vlaInit');
        if (t && t.k === 'struct' && !t.fields) cerr(d.line, 'err.structUndefined', { tag: t.tag });
        this.declare(d.name, { kind: 'var', t: t || { k: 'vla' } }, d.line);
        decls.push({ name: d.name, t, vla: d.vla, init, line: d.line, isStatic: sp.storage === 'static' });
      }
      if (!this.acceptOp(',')) break;
    }
    this.expectOp(';');
    return { k: 'decl', decls, line };
  }
  condWarn(e, what) {
    if (e && e.k === 'assign' && e.op === '=') this.warnings.push({ line: e.line, msg: ['warn.assignInCond', { what }] });
  }
  parseParenCond(what) {
    this.expectOp('(', ['ctx.after', { what }]);
    const e = this.parseExpr();
    this.expectOp(')', ['ctx.closeCond', { what }]);
    this.condWarn(e, what);
    return e;
  }
  semiWarn(what) {
    if (this.isOp(';')) this.warnings.push({ line: this.peek().line, msg: ['warn.semicolonAfter', { what }] });
  }
  parseStmt() {
    const t = this.peek(); const line = t.line;
    if (t.t === 'op' && t.v === '{') return this.parseBlock();
    if (t.t === 'op' && t.v === ';') { this.p++; return { k: 'empty', line }; }
    if (t.t === 'id') {
      switch (t.v) {
        case 'if': {
          this.p++; const c = this.parseParenCond('if'); this.semiWarn('if');
          const a = this.parseSubStmt(); let b = null;
          if (this.acceptKw('else')) b = this.parseSubStmt();
          return { k: 'if', c, a, b, line };
        }
        case 'else': cerr(line, 'err.danglingElse');
        case 'while': {
          this.p++; const c = this.parseParenCond('while'); this.semiWarn('while');
          this.loopDepth++; const body = this.parseSubStmt(); this.loopDepth--;
          return { k: 'while', c, body, line };
        }
        case 'do': {
          this.p++; this.loopDepth++; const body = this.parseSubStmt(); this.loopDepth--;
          if (!this.acceptKw('while')) cerr(this.peek().line, 'err.doWhileMissing');
          const c = this.parseParenCond('while');
          this.expectOp(';', ['ctx.afterDoWhile']);
          return { k: 'do', c, body, line };
        }
        case 'for': {
          this.p++; this.expectOp('(', ['ctx.after', { what: 'for' }]); this.pushScope();
          let init = null;
          if (this.isTypeStart()) init = this.parseLocalDecl();
          else { if (!this.isOp(';')) init = { k: 'expr', e: this.parseExpr(), line }; this.expectOp(';', ['ctx.forInit']); }
          let c = null; if (!this.isOp(';')) c = this.parseExpr(); this.expectOp(';', ['ctx.forCond']);
          this.condWarn(c, 'for');
          let step = null; if (!this.isOp(')')) step = this.parseExpr();
          this.expectOp(')', ['ctx.close', { what: 'for' }]);
          this.semiWarn('for');
          this.loopDepth++; const body = this.parseSubStmt(); this.loopDepth--;
          this.popScope();
          return { k: 'for', init, c, step, body, line };
        }
        case 'switch': {
          this.p++; this.expectOp('(', ['ctx.after', { what: 'switch' }]); const e = this.parseExpr(); this.expectOp(')', ['ctx.close', { what: 'switch' }]);
          this.switchDepth++; const body = this.parseBlock(); this.switchDepth--;
          const seq = []; const labels = new Map(); let def = -1;
          const flat = (it) => {
            if (it.k === 'case' || it.k === 'default') {
              if (it.k === 'default') { if (def >= 0) cerr(it.line, 'err.switchTwoDefaults'); def = seq.length; }
              else { if (labels.has(it.val)) cerr(it.line, 'err.caseTwice', { val: it.val }); labels.set(it.val, seq.length); }
              flat(it.stmt);
            } else seq.push(it);
          };
          body.items.forEach(flat);
          return { k: 'switch', e, seq, labels, def, line };
        }
        case 'case': case 'default': {
          if (!this.switchDepth) cerr(line, 'err.caseOutsideSwitch', { word: t.v });
          this.p++; let val;
          if (t.v === 'case') {
            const e = this.parseCond(); val = this.constVal(e);
            if (val === undefined) cerr(line, 'err.caseConst');
          }
          this.expectOp(':', t.v === 'case' ? ['ctx.afterCaseValue'] : ['ctx.after', { what: 'default' }]);
          let stmt;
          if (this.isOp('}')) stmt = { k: 'empty', line };
          else stmt = this.isTypeStart() ? this.parseLocalDecl() : this.parseStmt();
          return { k: t.v, val, stmt, line };
        }
        case 'break': this.p++; if (!this.loopDepth && !this.switchDepth) cerr(line, 'err.breakOutside'); this.expectOp(';'); return { k: 'break', line };
        case 'continue': this.p++; if (!this.loopDepth) cerr(line, 'err.continueOutside'); this.expectOp(';'); return { k: 'continue', line };
        case 'return': {
          this.p++; let e = null;
          if (!this.isOp(';')) e = this.parseExpr();
          const f = this.curFunc;
          if (e && f.ret === TY.void) cerr(line, 'err.voidReturnsValue', { name: f.name });
          if (!e && f.ret !== TY.void && f.name !== 'main') cerr(line, 'err.returnNeedsValue', { name: f.name, type: tname(f.ret) });
          this.expectOp(';', ['ctx.after', { what: 'return' }]);
          return { k: 'return', e, line };
        }
        case 'goto': cerr(line, 'err.gotoUnsupported');
      }
    }
    const e = this.parseExpr();
    this.expectOp(';');
    return { k: 'expr', e, line };
  }
  parseSubStmt() {
    if (this.isTypeStart()) cerr(this.peek().line, 'err.declNotAllowed');
    return this.parseStmt();
  }

  // ---------- espressioni ----------
  parseExpr() {
    let e = this.parseAssign();
    while (this.isOp(',')) { const line = this.next().line; e = { k: 'comma', l: e, r: this.parseAssign(), line }; }
    return e;
  }
  parseAssign() {
    const l = this.parseCond();
    const t = this.peek();
    if (t.t === 'op' && ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>='].includes(t.v)) {
      this.p++;
      if (!['id', 'idx', 'mem', 'un'].includes(l.k) || (l.k === 'un' && l.op !== '*')) {
        cerr(t.line, 'err.notAssignable', { op: t.v, expr: exprText(l), hint: t.v === '=' ? ['hint.compareWithEq'] : '' });
      }
      const r = this.parseAssign();
      return { k: 'assign', op: t.v, l, r, line: t.line };
    }
    return l;
  }
  parseCond() {
    const c = this.parseBin(1);
    if (this.isOp('?')) {
      const line = this.next().line; const a = this.parseExpr();
      this.expectOp(':', 'nell\'operatore ? :'); const b = this.parseCond();
      return { k: 'cond', c, a, b, line };
    }
    return c;
  }
  parseBin(min) {
    const PREC = { '||': 1, '&&': 2, '|': 3, '^': 4, '&': 5, '==': 6, '!=': 6, '<': 7, '>': 7, '<=': 7, '>=': 7, '<<': 8, '>>': 8, '+': 9, '-': 9, '*': 10, '/': 10, '%': 10 };
    let l = this.parseUnary();
    for (;;) {
      const t = this.peek();
      if (t.t !== 'op' || !(t.v in PREC) || PREC[t.v] < min) return l;
      this.p++;
      const r = this.parseBin(PREC[t.v] + 1);
      l = { k: 'bin', op: t.v, l, r, line: t.line };
    }
  }
  parseTypeName() {
    const sp = this.parseDeclSpecs();
    const d = this.parseDeclarator(sp.t, true);
    if (d.vla) cerr(d.line, 'err.vlaNotAllowed');
    return d.t;
  }
  parseUnary() {
    const t = this.peek(); const line = t.line;
    if (t.t === 'op') {
      if (t.v === '++' || t.v === '--') { this.p++; const e = this.parseUnary(); this.checkLv(e, t.v, line); return { k: 'pre', op: t.v, e, line }; }
      if (['+', '-', '!', '~', '*', '&'].includes(t.v)) {
        this.p++; const e = this.parseCastOrUnary();
        if (t.v === '&') this.checkLv(e, '&', line);
        return { k: 'un', op: t.v, e, line };
      }
      if (t.v === '(' && this.isTypeStart(1)) {
        this.p++; const ty = this.parseTypeName(); this.expectOp(')', ['ctx.afterCastType']);
        if (this.isOp('{')) cerr(line, 'err.compoundLiteral');
        return { k: 'cast', t: ty, e: this.parseCastOrUnary(), line };
      }
    }
    if (t.t === 'id' && t.v === 'sizeof') {
      this.p++;
      if (this.isOp('(') && this.isTypeStart(1)) { this.p++; const ty = this.parseTypeName(); this.expectOp(')', ['ctx.afterSizeofType']); return { k: 'sizeofT', t: ty, line }; }
      return { k: 'sizeofE', e: this.parseUnary(), line };
    }
    return this.parsePostfix();
  }
  parseCastOrUnary() { return this.parseUnary(); }
  checkLv(e, op, line) {
    const ok = e.k === 'id' || e.k === 'idx' || e.k === 'mem' || (e.k === 'un' && e.op === '*');
    if (!ok) cerr(line, op === '&' ? 'err.addrOfNonVar' : 'err.opNeedsVar', { op, expr: exprText(e) });
  }
  parsePostfix() {
    let e = this.parsePrimary();
    for (;;) {
      const t = this.peek();
      if (t.t !== 'op') break;
      if (t.v === '[') { this.p++; const i = this.parseExpr(); this.expectOp(']', ['ctx.closeIndex']); e = { k: 'idx', a: e, i, line: t.line }; }
      else if (t.v === '(') {
        if (e.k === 'id') cerr(t.line, 'err.notAFunction', { name: e.name });
        if (e.k !== 'fid') cerr(t.line, 'err.funcNameExpected');
        this.p++; const args = [];
        if (!this.acceptOp(')')) { do { args.push(this.parseAssign()); } while (this.acceptOp(',')); this.expectOp(')', ['ctx.closeCall', { name: e.name }]); }
        e = { k: 'call', name: e.name, args, line: t.line };
        this.checkCall(e);
      }
      else if (t.v === '.' || t.v === '->') {
        this.p++; const n = this.next();
        if (n.t !== 'id') cerr(n.line, 'err.fieldNameExpected', { op: t.v });
        e = { k: 'mem', e, name: n.v, arrow: t.v === '->', line: t.line };
      }
      else if (t.v === '++' || t.v === '--') { this.p++; this.checkLv(e, t.v, t.line); e = { k: 'post', op: t.v, e, line: t.line }; }
      else break;
    }
    if (e.k === 'fid') cerr(e.line, 'err.funcNotCalled', { name: e.name });
    return e;
  }
  checkCall(c) {
    const ft = this.funcTypes.get(c.name);
    const rec = { name: c.name, line: c.line, resolved: false };
    const b = BUILTINS[c.name];
    const userDeclared = this.lookup(c.name);
    if (userDeclared && userDeclared.kind === 'func') {
      rec.resolved = true;
      if (ft && !ft.noproto) {
        const n = ft.params.length;
        if (!ft.variadic && c.args.length !== n) cerr(c.line, 'err.argCount', { name: c.name, want: ['frag.values', { n }], given: ['frag.given', { n: c.args.length }], proto: this.protoText(c.name) });
      }
    } else if (b && this.headers.has(b.h)) {
      rec.resolved = true; c.builtin = true;
      if (c.args.length < b.min) cerr(c.line, 'err.tooFewArgs', { name: c.name });
      if (c.name === 'scanf') c.args.slice(1).forEach(a => {
        if (a.k === 'id') { const s = this.lookup(a.name); if (s && s.t && (s.t.k === 'int' || s.t.k === 'float')) cerr(c.line, 'err.scanfNeedsAddr', { name: a.name }); }
      });
    }
    if (!rec.resolved) this.calls.push(rec);
  }
  parsePrimary() {
    const t = this.next(); const line = t.line;
    if (t.t === 'num') {
      let v, ty;
      if (t.isF) { v = parseFloat(t.v); ty = t.suf.includes('f') ? TY.float : TY.double; if (ty === TY.float) v = Math.fround(v); }
      else {
        let s = t.v; let big;
        if (/^0[xX]/.test(s)) big = BigInt(s);
        else if (/^0[0-7]+$/.test(s)) big = BigInt('0o' + s.slice(1));
        else if (/^0\d+$/.test(s)) cerr(line, 'err.badOctal', { s });
        else big = BigInt(s);
        const u = t.suf.includes('u'), L = t.suf.includes('l');
        const fits32 = u ? big <= 0xffffffffn : big <= 0x7fffffffn;
        ty = (L || !fits32) ? (u ? TY.ulong : TY.long) : (u ? TY.uint : TY.int);
        if (!u && !L && !fits32 && /^0[xX]/.test(s) && big <= 0xffffffffn) ty = TY.uint;
        v = Number(big);
      }
      return { k: 'num', t: ty, v, text: tokText(t), line };
    }
    if (t.t === 'chr') return { k: 'num', t: TY.int, v: (t.v << 24) >> 24, text: t.raw, line };
    if (t.t === 'str') {
      const bytes = [...t.bytes];
      while (this.peek().t === 'str') bytes.push(...this.next().bytes);
      const node = { k: 'str', bytes, line, idx: this.strings.length };
      this.strings.push(node);
      return node;
    }
    if (t.t === 'id') {
      if (KEYWORDS.has(t.v) && t.v !== 'sizeof') cerr(line, 'err.unexpectedKeyword', { word: t.v, hint: TYPE_KW.has(t.v) ? ['hint.declAtStart'] : '' });
      if (t.v === '__func__' && this.curFunc) {
        const node = { k: 'str', bytes: [...enc.encode(this.curFunc.name)], line, idx: this.strings.length };
        this.strings.push(node); return node;
      }
      const s = this.lookup(t.v);
      if (s) {
        if (s.kind === 'enum') return { k: 'num', t: TY.int, v: s.val, text: t.v, line };
        if (s.kind === 'var') return { k: 'id', name: t.v, line };
        if (s.kind === 'func') return { k: 'fid', name: t.v, line };
        if (s.kind === 'typedef') cerr(line, 'err.typeNotVar', { name: t.v });
      }
      if (this.isOp('(')) return { k: 'fid', name: t.v, line };
      if (t.v === 'NULL') cerr(line, 'err.nullNeedsInclude');
      if (t.v === 'true' || t.v === 'false' || t.v === 'bool') cerr(line, 'err.boolNeedsInclude', { name: t.v });
      cerr(line, 'err.undeclaredVar', { name: t.v, suggest: suggest(t.v, this.allNames()) });
    }
    if (t.t === 'op' && t.v === '(') {
      const e = this.parseExpr(); this.expectOp(')', ['ctx.closeParen']);
      return { k: 'paren', e, line };
    }
    if (t.t === 'eof') cerr(this.prev().line, 'err.unexpectedEndBrace');
    if (t.t === 'op' && t.v === '#') cerr(line, 'err.directiveNotAtStart');
    cerr(line, 'err.valueExpected', { found: found(t) });
  }
  constVal(e) {
    const self = this;
    function ev(n) {
      switch (n.k) {
        case 'num': return n.t.k === 'float' ? undefined : n.v;
        case 'paren': return ev(n.e);
        case 'un': { const v = ev(n.e); if (v === undefined) return; if (n.op === '-') return -v; if (n.op === '+') return v; if (n.op === '~') return ~v; if (n.op === '!') return v ? 0 : 1; return; }
        case 'bin': {
          const a = ev(n.l), b = ev(n.r); if (a === undefined || b === undefined) return;
          switch (n.op) {
            case '+': return a + b; case '-': return a - b; case '*': return a * b;
            case '/': return b ? Math.trunc(a / b) : undefined; case '%': return b ? a % b : undefined;
            case '<<': return a << b; case '>>': return a >> b; case '&': return a & b; case '|': return a | b; case '^': return a ^ b;
            case '==': return +(a === b); case '!=': return +(a !== b); case '<': return +(a < b); case '>': return +(a > b);
            case '<=': return +(a <= b); case '>=': return +(a >= b); case '&&': return +(a && b); case '||': return +(a || b);
          }
          return;
        }
        case 'cond': { const c = ev(n.c); if (c === undefined) return; return c ? ev(n.a) : ev(n.b); }
        case 'sizeofT': return n.t.size;
        case 'cast': { const v = ev(n.e); return v === undefined || !isInt(n.t) ? undefined : wrap(v, n.t); }
      }
      return undefined;
    }
    return ev(e);
  }
}

/* ================= MACCHINA ================= */
const MEM = 4 << 20;
const DATA_BASE = 64, STACK_BASE = 1 << 20, STACK_END = 2 << 20, HEAP_BASE = 2 << 20;
const NORMAL = 0, BRK = 1, CONT = 2, RET = 3;

class Machine {
  constructor(prog, opts) {
    this.prog = prog;
    this.buf = new ArrayBuffer(MEM); this.dv = new DataView(this.buf); this.u8 = new Uint8Array(this.buf);
    this.init = new Uint8Array(MEM);
    this.dataTop = DATA_BASE; this.sp = STACK_BASE; this.heapTop = HEAP_BASE;
    this.heap = []; // {start,size,live}
    this.roStart = DATA_BASE; this.roEnd = DATA_BASE;
    this.out = []; this.maxOut = opts.maxOutput || 20000;
    this.input = [...enc.encode(opts.input || '')]; this.inPos = 0;
    this.steps = 0; this.maxSteps = opts.maxSteps || 3000000;
    this.depth = 0; this.seed = 1;
    this.globalEnv = { vars: new Map(), parent: null };
    this.frames = [];
  }
  step(line) { if (++this.steps > this.maxSteps) throw new CError('limit', line, 'err.tooSlow'); }
  alignUp(v, a) { return Math.ceil(v / a) * a; }
  allocData(size, align) { this.dataTop = this.alignUp(this.dataTop, align || 8); const a = this.dataTop; this.dataTop += Math.max(size, 1); if (this.dataTop > STACK_BASE) rerr(0, 'err.outOfMemory'); return a; }
  allocStack(size, align, line) {
    this.sp = this.alignUp(this.sp, align || 8); const a = this.sp; this.sp += Math.max(size, 1);
    if (this.sp > STACK_END) rerr(line, 'err.stackOverflow');
    this.init.fill(0, a, this.sp);
    return a;
  }
  // ---- accesso memoria ----
  check(addr, size, line, write) {
    if (!Number.isFinite(addr) || addr < DATA_BASE) {
      if (addr === 0) rerr(line, 'err.nullPointer');
      rerr(line, 'err.badAddressUninit');
    }
    if (addr + size > MEM) rerr(line, 'err.badAddress');
    if (addr >= HEAP_BASE) {
      const b = this.findBlock(addr);
      if (!b || addr + size > b.start + b.size) rerr(line, 'err.heapOverflow');
      if (!b.live) rerr(line, 'err.useAfterFree');
    } else if (addr >= STACK_BASE) {
      if (addr >= this.sp) rerr(line, 'err.danglingStack');
    } else {
      if (addr >= this.dataTop) rerr(line, 'err.badAddress');
      if (write && addr < this.roEnd) rerr(line, 'err.writeStringLiteral');
    }
  }
  findBlock(addr) {
    const h = this.heap; let lo = 0, hi = h.length - 1, res = null;
    while (lo <= hi) { const m = (lo + hi) >> 1; if (h[m].start <= addr) { res = h[m]; lo = m + 1; } else hi = m - 1; }
    return res;
  }
  varNameAt(addr) {
    for (let f = this.frames.length - 1; f >= 0; f--) {
      for (let env = this.frames[f].env; env; env = env.parent) {
        for (const [n, v] of env.vars) if (addr >= v.addr && addr < v.addr + v.t.size) return n;
      }
    }
    return null;
  }
  load(addr, t, line, what) {
    this.check(addr, t.size, line, false);
    if (!this.init[addr]) {
      if (addr >= HEAP_BASE) rerr(line, 'err.uninitHeap', { what: what || '' });
      rerr(line, 'err.uninitVar', { name: what || this.varNameAt(addr) || '?', example: what && /^\w+$/.test(what) ? what : 'x' });
    }
    const dv = this.dv;
    switch (t.k) {
      case 'int':
        if (t.isBool) return dv.getUint8(addr);
        switch (t.size) {
          case 1: return t.signed ? dv.getInt8(addr) : dv.getUint8(addr);
          case 2: return t.signed ? dv.getInt16(addr, true) : dv.getUint16(addr, true);
          case 4: return t.signed ? dv.getInt32(addr, true) : dv.getUint32(addr, true);
          default: return Number(t.signed ? dv.getBigInt64(addr, true) : dv.getBigUint64(addr, true));
        }
      case 'float': return t.size === 4 ? dv.getFloat32(addr, true) : dv.getFloat64(addr, true);
      case 'ptr': return dv.getFloat64(addr, true);
    }
    rerr(line, 'err.cantRead', { type: tname(t) });
  }
  store(addr, t, v, line) {
    this.check(addr, t.size, line, true);
    const dv = this.dv;
    switch (t.k) {
      case 'int':
        switch (t.size) {
          case 1: dv.setUint8(addr, v & 255); break;
          case 2: dv.setUint16(addr, v & 0xffff, true); break;
          case 4: dv.setUint32(addr, v >>> 0, true); break;
          default: dv.setBigUint64(addr, BigInt.asUintN(64, BigInt(v)), true);
        }
        break;
      case 'float': if (t.size === 4) dv.setFloat32(addr, v, true); else dv.setFloat64(addr, v, true); break;
      case 'ptr': dv.setFloat64(addr, v, true); break;
      default: rerr(line, 'err.cantWrite', { type: tname(t) });
    }
    this.init.fill(1, addr, addr + t.size);
  }
  readBytes(addr, n, line) { this.check(addr, n, line, false); return { b: this.u8.slice(addr, addr + n), i: this.init.slice(addr, addr + n) }; }
  writeBytes(addr, bytes, line) { this.check(addr, bytes.b.length, line, true); this.u8.set(bytes.b, addr); this.init.set(bytes.i, addr); }
  cstr(addr, line, what) {
    if (addr === 0) rerr(line, 'err.stringNull', { what: what || ['frag.theString'] });
    const bytes = [];
    for (let a = addr; ; a++) {
      this.check(a, 1, line, false);
      if (!this.init[a]) rerr(line, 'err.stringUnterminated', { what: what || ['frag.theString'] });
      const c = this.u8[a]; if (c === 0) break; bytes.push(c);
      if (bytes.length > 1000000) rerr(line, 'err.stringTooLong');
    }
    return bytes;
  }
  emit(bytes) {
    for (const b of bytes) this.out.push(b);
    if (this.out.length > this.maxOut) throw new CError('limit', 0, 'err.tooMuchOutput');
  }

  // ---- esecuzione ----
  run() {
    const prog = this.prog;
    for (const s of prog.strings) { s.addr = this.allocData(s.bytes.length + 1, 1); this.u8.set(s.bytes, s.addr); this.u8[s.addr + s.bytes.length] = 0; this.init.fill(1, s.addr, s.addr + s.bytes.length + 1); }
    this.roEnd = this.dataTop;
    this.frames.push({ name: '(globale)', env: this.globalEnv });
    for (const g of prog.globals) {
      if (this.globalEnv.vars.has(g.name)) { const v = this.globalEnv.vars.get(g.name); if (g.init) this.initialize(v.addr, v.t, g.init, this.globalEnv, g.line); continue; }
      const addr = this.allocData(g.t.size, alignOf(g.t)); this.init.fill(1, addr, addr + g.t.size);
      this.globalEnv.vars.set(g.name, { t: g.t, addr });
      if (g.init) this.initialize(addr, g.t, g.init, this.globalEnv, g.line);
    }
    this.frames.pop();
    let code = 0;
    try {
      const main = prog.funcs.get('main');
      let args = [];
      if (main.t.params.length >= 2) {
        const s = this.allocData(9, 1); this.u8.set(enc.encode('programma'), s); this.init.fill(1, s, s + 10);
        const av = this.allocData(16, 8); this.dv.setFloat64(av, s, true); this.dv.setFloat64(av + 8, 0, true); this.init.fill(1, av, av + 16);
        args = [{ t: TY.int, v: 1 }, { t: ptrT(ptrT(TY.char)), v: av }];
      }
      const r = this.callUser(main, args, main.line);
      code = r && r.v !== undefined ? r.v : 0;
    } catch (e) {
      if (e instanceof ExitSig) code = e.code; else throw e;
    }
    return code;
  }
  callUser(fn, args, line) {
    if (++this.depth > 900) rerr(line, 'err.recursionTooDeep', { name: fn.name });
    const saved = this.sp;
    const env = { vars: new Map(), parent: this.globalEnv };
    const ft = fn.t;
    for (let i = 0; i < ft.params.length; i++) {
      const pt = ft.params[i];
      const a = this.allocStack(pt.size, alignOf(pt), line);
      if (i >= args.length) rerr(line, 'err.missingParam', { n: i + 1, name: fn.name });
      this.assignTo(a, pt, args[i], line, ['ctx.argN', { n: i + 1, name: fn.name }]);
      env.vars.set(ft.names[i], { t: pt, addr: a });
    }
    const frame = { name: fn.name, env, ret: undefined };
    this.frames.push(frame);
    const r = this.execBlockIn(fn.body, env);
    this.frames.pop();
    this.sp = saved; this.depth--;
    if (r !== RET && ft.ret !== TY.void) {
      if (fn.name === 'main') return { t: TY.int, v: 0 };
      rerr(fn.body.line, 'err.noReturn', { name: fn.name, type: tname(ft.ret) });
    }
    if (ft.ret === TY.void) return { t: TY.void, v: 0 };
    return frame.ret;
  }
  execBlockIn(block, env) {
    const saved = this.sp;
    const frame = this.frames[this.frames.length - 1]; const oldEnv = frame.env; frame.env = env;
    let r = NORMAL;
    for (const it of block.items) { r = this.exec(it, env); if (r !== NORMAL) break; }
    frame.env = oldEnv; this.sp = saved;
    return r;
  }
  exec(s, env) {
    this.step(s.line);
    switch (s.k) {
      case 'expr': this.evalR(s.e, env); return NORMAL;
      case 'decl': for (const d of s.decls) this.declare(d, env); return NORMAL;
      case 'block': return this.execBlockIn(s, { vars: new Map(), parent: env });
      case 'empty': return NORMAL;
      case 'if': return this.truth(this.evalR(s.c, env), s.line) ? this.exec(s.a, env) : (s.b ? this.exec(s.b, env) : NORMAL);
      case 'while':
        while (this.truth(this.evalR(s.c, env), s.line)) {
          this.step(s.line);
          const r = this.exec(s.body, env);
          if (r === BRK) break; if (r === RET) return RET;
        }
        return NORMAL;
      case 'do':
        do {
          this.step(s.line);
          const r = this.exec(s.body, env);
          if (r === BRK) break; if (r === RET) return RET;
        } while (this.truth(this.evalR(s.c, env), s.line));
        return NORMAL;
      case 'for': {
        const saved = this.sp; const fenv = { vars: new Map(), parent: env };
        const frame = this.frames[this.frames.length - 1]; const oldEnv = frame.env; frame.env = fenv;
        let res = NORMAL;
        if (s.init) this.exec(s.init, fenv);
        while (!s.c || this.truth(this.evalR(s.c, fenv), s.line)) {
          this.step(s.line);
          const r = this.exec(s.body, fenv);
          if (r === BRK) break; if (r === RET) { res = RET; break; }
          if (s.step) this.evalR(s.step, fenv);
        }
        frame.env = oldEnv; this.sp = saved;
        return res;
      }
      case 'switch': {
        const v = this.evalR(s.e, env);
        if (!isInt(v.t)) rerr(s.line, 'err.switchNotInt');
        let start = s.labels.has(v.v) ? s.labels.get(v.v) : s.def;
        if (start < 0) return NORMAL;
        const saved = this.sp; const senv = { vars: new Map(), parent: env };
        const frame = this.frames[this.frames.length - 1]; const oldEnv = frame.env; frame.env = senv;
        let res = NORMAL;
        for (let i = start; i < s.seq.length; i++) {
          const r = this.exec(s.seq[i], senv);
          if (r === BRK) break; if (r !== NORMAL) { res = r; break; }
        }
        frame.env = oldEnv; this.sp = saved;
        return res;
      }
      case 'break': return BRK;
      case 'continue': return CONT;
      case 'return': {
        const f = this.frames[this.frames.length - 1];
        const fn = this.prog.funcs.get(f.name);
        if (s.e) {
          const v = this.evalR(s.e, env);
          const rt = fn.t.ret;
          f.ret = rt.k === 'struct' ? { t: rt, bytes: this.convert(v, rt, s.line, CTX_RETURN) } : { t: rt, v: this.convert(v, rt, s.line, CTX_RETURN) };
        } else f.ret = { t: TY.int, v: 0 };
        return RET;
      }
    }
    rerr(s.line, 'err.unsupportedStmt', { k: s.k });
  }
  declare(d, env) {
    let t = d.t;
    if (d.vla) {
      t = d.vla.base;
      const lens = d.vla.dims.map(e => {
        if (!e) rerr(d.line, 'err.arrayDimMissing');
        const v = this.evalR(e, env); if (!isInt(v.t)) rerr(d.line, 'err.arrayDimNotInt');
        if (v.v <= 0) rerr(d.line, 'err.arrayDimPositiveRt', { name: d.name, n: v.v });
        if (v.v > 1000000) rerr(d.line, 'err.arrayTooBig', { name: d.name, n: v.v });
        return v.v;
      });
      for (let i = lens.length - 1; i >= 0; i--) t = arrT(t, lens[i]);
    }
    if (d.isStatic) {
      if (d.staticAddr === undefined) {
        d.staticAddr = this.allocData(t.size, alignOf(t)); this.init.fill(1, d.staticAddr, d.staticAddr + t.size);
        env.vars.set(d.name, { t, addr: d.staticAddr });
        if (d.init) this.initialize(d.staticAddr, t, d.init, env, d.line);
      }
      env.vars.set(d.name, { t, addr: d.staticAddr });
      return;
    }
    const addr = this.allocStack(t.size, alignOf(t), d.line);
    env.vars.set(d.name, { t, addr });
    if (d.init) this.initialize(addr, t, d.init, env, d.line);
  }
  initialize(addr, t, init, env, line) {
    if (t.k === 'arr') {
      if (init.k === 'str' && isInt(t.of) && t.of.size === 1) {
        if (init.bytes.length > t.len) rerr(line, 'err.stringTooLongForArray', { s: new TextDecoder().decode(new Uint8Array(init.bytes)), len: t.len, need: init.bytes.length + 1 });
        this.u8.fill(0, addr, addr + t.size); this.u8.set(init.bytes, addr); this.init.fill(1, addr, addr + t.size); return;
      }
      if (init.k !== 'initlist') rerr(line, 'err.arrayInitList');
      this.u8.fill(0, addr, addr + t.size); this.init.fill(1, addr, addr + t.size);
      if (init.items.length > t.len) rerr(line, 'err.tooManyInitArray', { n: init.items.length, len: t.len });
      init.items.forEach((it, i) => this.initialize(addr + i * t.of.size, t.of, it, env, line));
      return;
    }
    if (t.k === 'struct') {
      if (init.k === 'initlist') {
        this.u8.fill(0, addr, addr + t.size); this.init.fill(1, addr, addr + t.size);
        if (init.items.length > t.fields.length) rerr(line, 'err.tooManyInitStruct', { n: init.items.length, len: t.fields.length });
        init.items.forEach((it, i) => this.initialize(addr + t.fields[i].off, t.fields[i].t, it, env, line));
        return;
      }
      const v = this.evalR(init, env);
      this.writeBytes(addr, this.convert(v, t, line, CTX_INIT), line); return;
    }
    if (init.k === 'initlist') { if (init.items.length !== 1) rerr(line, 'err.scalarInitOne'); init = init.items[0]; }
    const v = this.evalR(init, env);
    this.assignTo(addr, t, v, line, CTX_INIT);
  }
  assignTo(addr, t, v, line, ctx) {
    if (t.k === 'struct') { this.writeBytes(addr, this.convert(v, t, line, ctx), line); return; }
    this.store(addr, t, this.convert(v, t, line, ctx), line);
  }
  convert(v, t, line, ctx, explicit) {
    const f = v.t;
    if (t.k === 'struct') {
      if (f !== t) rerr(line, 'err.structMismatch', { ctx, want: tname(t), got: tname(f) });
      return v.bytes;
    }
    if (f.k === 'struct') rerr(line, 'err.structAsNumber', { ctx });
    if (f.k === 'void') rerr(line, 'err.voidValue', { ctx });
    if (t.k === 'int') {
      if (f.k === 'ptr' && !explicit) {
        rerr(line, v.isStr ? 'err.stringToInt' : 'err.pointerToInt', { ctx, type: tname(t), hint: v.isStr ? [t.size === 1 ? 'hint.charSingleQuotes' : 'hint.useCharArray'] : '' });
      }
      if (t.isBool) return v.v ? 1 : 0;
      return wrap(v.v, t);
    }
    if (t.k === 'float') {
      if (f.k === 'ptr') rerr(line, 'err.pointerToFloat', { ctx, type: tname(t) });
      return t.size === 4 ? Math.fround(v.v) : v.v;
    }
    if (t.k === 'ptr') {
      if (f.k === 'ptr') return v.v;
      if (isInt(f) && (v.v === 0 || explicit)) return v.v;
      if (isInt(f)) rerr(line, 'err.intToPointer', { ctx, type: tname(t), n: v.v });
      rerr(line, 'err.pointerNeeded', { ctx, type: tname(t), got: tname(f) });
    }
    if (t.k === 'void') return 0;
    rerr(line, 'err.badConversion', { ctx, type: tname(t) });
  }
  truth(v, line) {
    if (v.t.k === 'struct') rerr(line, 'err.structAsCondition');
    if (v.t.k === 'void') rerr(line, 'err.voidAsCondition');
    return v.v !== 0;
  }
  lookupVar(name, env, line) {
    for (let e = env; e; e = e.parent) { const v = e.vars.get(name); if (v) return v; }
    rerr(line, 'err.varNotHere', { name });
  }
  rvalOf(lv, line) {
    const t = lv.t;
    if (t.k === 'arr') return { t: ptrT(t.of), v: lv.addr, arrLen: t.len, arrName: lv.name };
    if (t.k === 'struct') return { t, bytes: this.readBytes(lv.addr, t.size, line) };
    return { t, v: this.load(lv.addr, t, line, lv.name) };
  }
  evalL(n, env) {
    switch (n.k) {
      case 'id': { const v = this.lookupVar(n.name, env, n.line); return { t: v.t, addr: v.addr, name: n.name }; }
      case 'paren': return this.evalL(n.e, env);
      case 'un': {
        if (n.op !== '*') break;
        const p = this.evalR(n.e, env);
        if (p.t.k !== 'ptr') rerr(n.line, 'err.derefNonPointer', { expr: exprText(n.e), type: tname(p.t) });
        if (p.t.to.k === 'void') rerr(n.line, 'err.derefVoid');
        if (p.v === 0) rerr(n.line, 'err.derefNull', { expr: exprText(n.e) });
        return { t: p.t.to, addr: p.v, name: '*' + exprText(n.e) };
      }
      case 'idx': {
        let b = this.evalR(n.a, env), i = this.evalR(n.i, env);
        if (isInt(b.t) && isPtr(i.t)) { const x = b; b = i; i = x; }
        if (!isPtr(b.t)) rerr(n.line, 'err.indexNonArray', { expr: exprText(n.a), type: tname(b.t) });
        if (!isInt(i.t)) rerr(n.line, 'err.indexNotInt', { expr: exprText(n.i), type: tname(i.t) });
        const idx = i.v;
        if (b.arrLen != null && (idx < 0 || idx >= b.arrLen)) {
          rerr(n.line, 'err.indexOutOfBounds', { name: b.arrName || exprText(n.a), idx, len: b.arrLen, max: b.arrLen - 1 });
        }
        if (b.v === 0) rerr(n.line, 'err.indexNull', { expr: exprText(n.a) });
        const et = b.t.to; if (et.k === 'void') rerr(n.line, 'err.indexVoid');
        return { t: et, addr: b.v + idx * et.size, name: exprText(n.a) + '[' + idx + ']' };
      }
      case 'mem': {
        let st, base;
        if (n.arrow) {
          const p = this.evalR(n.e, env);
          if (p.t.k === 'struct') rerr(n.line, 'err.dotNotArrow', { expr: exprText(n.e), field: n.name });
          if (p.t.k !== 'ptr' || p.t.to.k !== 'struct') rerr(n.line, 'err.arrowNonPointer', { expr: exprText(n.e), type: tname(p.t) });
          if (p.v === 0) rerr(n.line, 'err.arrowNull', { expr: exprText(n.e), field: n.name });
          st = p.t.to; base = p.v;
        } else {
          const lv = this.evalL(n.e, env);
          if (lv.t.k === 'ptr' && lv.t.to.k === 'struct') rerr(n.line, 'err.arrowNotDot', { expr: exprText(n.e), field: n.name });
          if (lv.t.k !== 'struct') rerr(n.line, 'err.dotNonStruct', { expr: exprText(n.e), type: tname(lv.t) });
          st = lv.t; base = lv.addr;
        }
        const f = st.fields.find(x => x.name === n.name);
        if (!f) rerr(n.line, 'err.noSuchField', { type: tname(st), name: n.name, fields: st.fields.map(x => x.name).join(', '), suggest: suggest(n.name, st.fields.map(x => x.name)) });
        return { t: f.t, addr: base + f.off, name: exprText(n) };
      }
      case 'call': {
        const v = this.evalR(n, env);
        if (v.t.k === 'struct') { const a = this.allocStack(v.t.size, alignOf(v.t), n.line); this.writeBytes(a, v.bytes, n.line); return { t: v.t, addr: a, name: exprText(n) }; }
        break;
      }
    }
    rerr(n.line, 'err.notAVariable', { expr: exprText(n) });
  }
  evalR(n, env) {
    switch (n.k) {
      case 'num': return { t: n.t, v: n.v };
      case 'str': return { t: ptrT(TY.char), v: n.addr, isStr: true };
      case 'paren': return this.evalR(n.e, env);
      case 'id': case 'idx': case 'mem': return this.rvalOf(this.evalL(n, env), n.line);
      case 'un': {
        if (n.op === '*') return this.rvalOf(this.evalL(n, env), n.line);
        if (n.op === '&') { const lv = this.evalL(n.e, env); return { t: ptrT(lv.t), v: lv.addr }; }
        const v = this.evalR(n.e, env);
        if (n.op === '!') { if (v.t.k === 'struct') rerr(n.line, 'err.notOnStruct'); return { t: TY.int, v: v.v === 0 ? 1 : 0 }; }
        if (!isArith(v.t)) rerr(n.line, 'err.unaryNeedsNumber', { op: n.op, type: tname(v.t) });
        const t = promote(v.t);
        if (n.op === '+') return { t, v: v.v };
        if (n.op === '-') return { t, v: isFloat(t) ? -v.v : wrap(-v.v, t) };
        if (n.op === '~') { if (!isInt(t)) rerr(n.line, 'err.tildeNeedsInt'); return { t, v: t.size === 8 ? wrap(~BigInt(v.v), t) : wrap(~v.v, t) }; }
        break;
      }
      case 'pre': case 'post': {
        const lv = this.evalL(n.e, env);
        if (lv.t.k === 'arr') rerr(n.line, 'err.incOnArray', { op: n.op, expr: exprText(n.e) });
        const cur = this.rvalOf(lv, n.line);
        let nv;
        if (isPtr(lv.t)) nv = cur.v + (n.op === '++' ? 1 : -1) * (lv.t.to.k === 'void' ? 1 : lv.t.to.size);
        else if (isArith(lv.t)) nv = this.convert({ t: lv.t, v: cur.v + (n.op === '++' ? 1 : -1) }, lv.t, n.line, n.op);
        else rerr(n.line, 'err.incBadType', { op: n.op, type: tname(lv.t) });
        this.store(lv.addr, lv.t, nv, n.line);
        return n.k === 'pre' ? { t: lv.t, v: nv } : cur;
      }
      case 'assign': {
        const lv = this.evalL(n.l, env);
        if (lv.t.k === 'arr') {
          const isS = n.r.k === 'str';
          rerr(n.line, isS ? 'err.assignArrayString' : 'err.assignArray', { expr: exprText(n.l) });
        }
        let v;
        if (n.op === '=') v = this.evalR(n.r, env);
        else { const cur = this.rvalOf(lv, n.line); v = this.binop(n.op.slice(0, -1), cur, this.evalR(n.r, env), n.line, n); }
        if (lv.t.k === 'struct') { this.writeBytes(lv.addr, this.convert(v, lv.t, n.line, 'Nell\'assegnamento'), n.line); return v; }
        const cv = this.convert(v, lv.t, n.line, ['ctx.assignTo', { expr: exprText(n.l) }]);
        this.store(lv.addr, lv.t, cv, n.line);
        return { t: lv.t, v: cv };
      }
      case 'bin': {
        if (n.op === '&&') { const a = this.evalR(n.l, env); if (!this.truth(a, n.line)) return { t: TY.int, v: 0 }; return { t: TY.int, v: this.truth(this.evalR(n.r, env), n.line) ? 1 : 0 }; }
        if (n.op === '||') { const a = this.evalR(n.l, env); if (this.truth(a, n.line)) return { t: TY.int, v: 1 }; return { t: TY.int, v: this.truth(this.evalR(n.r, env), n.line) ? 1 : 0 }; }
        return this.binop(n.op, this.evalR(n.l, env), this.evalR(n.r, env), n.line, n);
      }
      case 'cond': {
        const c = this.truth(this.evalR(n.c, env), n.line);
        const v = this.evalR(c ? n.a : n.b, env);
        return v;
      }
      case 'comma': this.evalR(n.l, env); return this.evalR(n.r, env);
      case 'cast': {
        const v = this.evalR(n.e, env);
        if (n.t.k === 'void') return { t: TY.void, v: 0 };
        if (n.t.k === 'struct' || n.t.k === 'arr') rerr(n.line, 'err.badCast', { type: tname(n.t) });
        if (isFloat(v.t) && isPtr(n.t)) rerr(n.line, 'err.floatToPointer');
        return { t: n.t, v: this.convert(v, n.t, n.line, 'Nel cast', true) };
      }
      case 'sizeofT': return { t: TY.ulong, v: n.t.size };
      case 'sizeofE': return { t: TY.ulong, v: this.typeOf(n.e, env).size };
      case 'call': return this.call(n, env);
    }
    rerr(n.line, 'err.unsupportedExpr');
  }
  typeOf(n, env) {
    switch (n.k) {
      case 'num': return n.t;
      case 'str': return arrT(TY.char, n.bytes.length + 1);
      case 'paren': return this.typeOf(n.e, env);
      case 'id': return this.lookupVar(n.name, env, n.line).t;
      case 'idx': { const b = this.typeOf(n.a, env); return b.k === 'arr' ? b.of : b.k === 'ptr' ? b.to : this.typeOf(n.i, env).to || TY.int; }
      case 'un': {
        const t = this.typeOf(n.e, env);
        if (n.op === '*') return t.k === 'ptr' ? t.to : t.k === 'arr' ? t.of : TY.int;
        if (n.op === '&') return ptrT(t);
        if (n.op === '!') return TY.int;
        return promote(t);
      }
      case 'mem': {
        let t = this.typeOf(n.e, env); if (n.arrow && t.k === 'ptr') t = t.to;
        const f = t.fields && t.fields.find(x => x.name === n.name); return f ? f.t : TY.int;
      }
      case 'cast': return n.t;
      case 'call': { const ft = this.prog.funcTypes.get(n.name); return ft ? ft.ret : (BUILTINS[n.name] ? BUILTINS[n.name].ret : TY.int); }
      case 'assign': case 'pre': case 'post': return this.typeOf(n.l || n.e, env);
      case 'cond': return this.typeOf(n.a, env);
      case 'comma': return this.typeOf(n.r, env);
      case 'sizeofT': case 'sizeofE': return TY.ulong;
      case 'bin': {
        if (['==', '!=', '<', '>', '<=', '>=', '&&', '||'].includes(n.op)) return TY.int;
        const a = this.typeOf(n.l, env), b = this.typeOf(n.r, env);
        const pa = a.k === 'arr' ? ptrT(a.of) : a, pb = b.k === 'arr' ? ptrT(b.of) : b;
        if (isPtr(pa) && isPtr(pb)) return TY.long;
        if (isPtr(pa)) return pa; if (isPtr(pb)) return pb;
        return usual(a, b);
      }
    }
    return TY.int;
  }
  binop(op, a, b, line, node) {
    const ctx = node ? exprText(node) : op;
    if (a.t.k === 'struct' || b.t.k === 'struct') rerr(line, 'err.opOnStruct', { op, expr: ctx });
    if (a.t.k === 'void' || b.t.k === 'void') rerr(line, 'err.voidInExpr', { expr: ctx });
    const pa = isPtr(a.t), pb = isPtr(b.t);
    if (pa || pb) {
      if (['==', '!=', '<', '>', '<=', '>='].includes(op)) {
        if ((a.isStr || b.isStr) && (op === '==' || op === '!=')) rerr(line, 'err.compareStrings', { op });
        if ((pa && !pb && b.v !== 0) || (pb && !pa && a.v !== 0)) rerr(line, 'err.comparePtrInt', { expr: ctx });
        return { t: TY.int, v: this.cmp(op, a.v, b.v) ? 1 : 0 };
      }
      if (op === '+' && pa && isInt(b.t)) return this.ptrAdd(a, b.v, line);
      if (op === '+' && pb && isInt(a.t)) return this.ptrAdd(b, a.v, line);
      if (op === '-' && pa && isInt(b.t)) return this.ptrAdd(a, -b.v, line);
      if (op === '-' && pa && pb) { const s = a.t.to.k === 'void' ? 1 : a.t.to.size; return { t: TY.long, v: Math.trunc((a.v - b.v) / s) }; }
      rerr(line, 'err.ptrArith', { expr: ctx });
    }
    if (!isArith(a.t) || !isArith(b.t)) rerr(line, 'err.invalidOp', { expr: ctx });
    if (op === '<<' || op === '>>') {
      if (!isInt(a.t) || !isInt(b.t)) rerr(line, 'err.opNeedsInt', { op });
      const t = promote(a.t);
      if (t.size === 8) { const x = BigInt(a.v), s = BigInt(b.v & 63); return { t, v: wrap(op === '<<' ? x << s : x >> s, t) }; }
      const s = b.v & 31;
      return { t, v: op === '<<' ? wrap(a.v << s, t) : (t.signed ? a.v >> s : (a.v >>> s)) };
    }
    const t = usual(a.t, b.t);
    let x = a.v, y = b.v;
    if (isInt(t)) { x = wrap(x, t); y = wrap(y, t); }
    if (['==', '!=', '<', '>', '<=', '>='].includes(op)) return { t: TY.int, v: this.cmp(op, x, y) ? 1 : 0 };
    if (isFloat(t)) {
      let r;
      switch (op) {
        case '+': r = x + y; break; case '-': r = x - y; break; case '*': r = x * y; break; case '/': r = x / y; break;
        case '%': rerr(line, 'err.modNeedsInt', { type: tname(t) });
        default: rerr(line, 'err.opNeedsIntOnly', { op });
      }
      return { t, v: t.size === 4 ? Math.fround(r) : r };
    }
    if ((op === '/' || op === '%') && y === 0) rerr(line, 'err.divByZero', { expr: ctx });
    if (t.size === 8) {
      const X = BigInt(x), Y = BigInt(y); let r;
      switch (op) {
        case '+': r = X + Y; break; case '-': r = X - Y; break; case '*': r = X * Y; break; case '/': r = X / Y; break; case '%': r = X % Y; break;
        case '&': r = X & Y; break; case '|': r = X | Y; break; case '^': r = X ^ Y; break;
      }
      return { t, v: wrap(r, t) };
    }
    let r;
    switch (op) {
      case '+': r = x + y; break; case '-': r = x - y; break; case '*': r = t.signed ? Math.imul(x, y) : Math.imul(x, y) >>> 0; break;
      case '/': r = Math.trunc(x / y); break; case '%': r = x % y; break;
      case '&': r = x & y; break; case '|': r = x | y; break; case '^': r = x ^ y; break;
    }
    return { t, v: wrap(r, t) };
  }
  cmp(op, x, y) {
    switch (op) { case '==': return x === y; case '!=': return x !== y; case '<': return x < y; case '>': return x > y; case '<=': return x <= y; case '>=': return x >= y; }
  }
  ptrAdd(p, i, line) {
    const s = p.t.to.k === 'void' ? 1 : p.t.to.size;
    return { t: p.t, v: p.v + i * s };
  }
  call(n, env) {
    const args = n.args.map(a => this.evalR(a, env));
    const fn = this.prog.funcs.get(n.name);
    if (fn && !n.builtin) return this.callUser(fn, args, n.line);
    if (!n.builtin && this.prog.funcTypes.has(n.name)) rerr(n.line, 'err.protoNoBody', { name: n.name });
    return this.builtin(n.name, args, n, env);
  }

  // ---- libreria ----
  builtin(name, args, n, env) {
    const line = n.line;
    const I = (v) => ({ t: TY.int, v });
    const D = (v) => ({ t: TY.double, v });
    const num = (i) => { const a = args[i]; if (!isArith(a.t)) rerr(line, 'err.argNotNumber', { name, n: i + 1, type: tname(a.t) }); return a.v; };
    const ptr = (i, what) => { const a = args[i]; if (!isPtr(a.t)) rerr(line, 'err.argNotPointer', { name, n: i + 1, want: [what || 'frag.aPointer'], type: tname(a.t) }); return a.v; };
    const strArg = (i) => { const p = ptr(i, 'frag.aString'); return this.cstr(p, line, ['ctx.stringArg', { name, n: i + 1 }]); };
    const writeStr = (addr, bytes, line2, cap) => {
      if (cap != null && bytes.length + 1 > cap) rerr(line2, 'err.stringDoesNotFit', { name, len: bytes.length, cap });
      this.check(addr, bytes.length + 1, line2, true);
      this.u8.set(bytes, addr); this.u8[addr + bytes.length] = 0; this.init.fill(1, addr, addr + bytes.length + 1);
    };
    const cap = (i) => args[i].arrLen != null ? args[i].arrLen * args[i].t.to.size : null;
    switch (name) {
      case 'printf': { const fmt = strArg(0); const bytes = this.format(fmt, args, 1, line); this.emit(bytes); return I(bytes.length); }
      case 'sprintf': { const d = ptr(0); const fmt = strArg(1); const bytes = this.format(fmt, args, 2, line); writeStr(d, bytes, line, cap(0)); return I(bytes.length); }
      case 'putchar': { this.emit([num(0) & 255]); return I(num(0)); }
      case 'puts': { this.emit([...strArg(0), 10]); return I(1); }
      case 'getchar': { if (this.inPos >= this.input.length) return I(-1); return I(this.input[this.inPos++]); }
      case 'fflush': return I(0);
      case 'fgets': {
        const d = ptr(0); const max = num(1);
        if (this.inPos >= this.input.length) return { t: ptrT(TY.char), v: 0 };
        const bytes = [];
        while (bytes.length < max - 1 && this.inPos < this.input.length) { const c = this.input[this.inPos++]; bytes.push(c); if (c === 10) break; }
        writeStr(d, bytes, line, cap(0)); return { t: ptrT(TY.char), v: d };
      }
      case 'scanf': return I(this.scanf(args, line));
      case 'strlen': return { t: TY.ulong, v: strArg(0).length };
      case 'strcpy': { const s = strArg(1); writeStr(ptr(0), s, line, cap(0)); return args[0]; }
      case 'strncpy': { const s = strArg(1).slice(0, num(2)); const d = ptr(0); const k = num(2); this.check(d, k, line, true); for (let i = 0; i < k; i++) { this.u8[d + i] = i < s.length ? s[i] : 0; this.init[d + i] = 1; } return args[0]; }
      case 'strcat': { const d = strArg(0), s = strArg(1); writeStr(ptr(0), [...d, ...s], line, cap(0)); return args[0]; }
      case 'strncat': { const d = strArg(0), s = strArg(1).slice(0, num(2)); writeStr(ptr(0), [...d, ...s], line, cap(0)); return args[0]; }
      case 'strcmp': case 'strncmp': {
        let a = strArg(0), b = strArg(1); if (name === 'strncmp') { a = a.slice(0, num(2)); b = b.slice(0, num(2)); }
        for (let i = 0; ; i++) { const x = i < a.length ? a[i] : 0, y = i < b.length ? b[i] : 0; if (x !== y) return I(x < y ? -1 : 1); if (x === 0) return I(0); }
      }
      case 'strchr': { const s = strArg(0); const c = num(1) & 255; const p = ptr(0); const i = c === 0 ? s.length : s.indexOf(c); return { t: ptrT(TY.char), v: i < 0 ? 0 : p + i }; }
      case 'memset': { const d = ptr(0), c = num(1), k = num(2); this.check(d, k, line, true); this.u8.fill(c & 255, d, d + k); this.init.fill(1, d, d + k); return args[0]; }
      case 'memcpy': { const d = ptr(0), s = ptr(1), k = num(2); const b = this.readBytes(s, k, line); this.writeBytes(d, b, line); return args[0]; }
      case 'malloc': case 'calloc': {
        const size = name === 'malloc' ? num(0) : num(0) * num(1);
        if (size < 0) rerr(line, 'err.negativeSize', { name });
        if (size > 1 << 20) rerr(line, 'err.tooMuchMemory', { name, size });
        const a = this.alignUp(this.heapTop, 16);
        if (a + size > MEM) return { t: ptrT(TY.void), v: 0 };
        this.heapTop = a + Math.max(size, 1);
        this.heap.push({ start: a, size, live: true, line });
        this.init.fill(name === 'calloc' ? 1 : 0, a, a + size); if (name === 'calloc') this.u8.fill(0, a, a + size);
        return { t: ptrT(TY.void), v: a };
      }
      case 'realloc': {
        const old = ptr(0), size = num(1);
        const a = this.alignUp(this.heapTop, 16); this.heapTop = a + Math.max(size, 1);
        this.heap.push({ start: a, size, live: true, line }); this.init.fill(0, a, a + size);
        if (old) {
          const b = this.findBlock(old); if (!b || b.start !== old || !b.live) rerr(line, 'err.reallocBadPtr');
          const k = Math.min(b.size, size); this.u8.copyWithin(a, old, old + k); this.init.copyWithin(a, old, old + k); b.live = false;
        }
        return { t: ptrT(TY.void), v: a };
      }
      case 'free': {
        const p = ptr(0); if (p === 0) return { t: TY.void, v: 0 };
        const b = p >= HEAP_BASE ? this.findBlock(p) : null;
        if (!b || b.start !== p) rerr(line, 'err.freeBadPtr');
        if (!b.live) rerr(line, 'err.doubleFree');
        b.live = false; return { t: TY.void, v: 0 };
      }
      case 'abs': return I(Math.abs(num(0)) | 0);
      case 'atoi': { const s = new TextDecoder().decode(new Uint8Array(strArg(0))); const m = /^\s*[+-]?\d+/.exec(s); return I(m ? wrap(parseInt(m[0], 10), TY.int) : 0); }
      case 'rand': { this.seed = (Math.imul(this.seed, 1103515245) + 12345) >>> 0; return I((this.seed >>> 1) & 0x7fffffff); }
      case 'srand': { this.seed = num(0) >>> 0; return { t: TY.void, v: 0 }; }
      case 'time': return { t: TY.long, v: 1700000000 };
      case 'exit': throw new ExitSig(num(0));
      case 'sqrt': { const x = num(0); return D(Math.sqrt(x)); }
      case 'pow': return D(Math.pow(num(0), num(1)));
      case 'fabs': return D(Math.abs(num(0)));
      case 'floor': return D(Math.floor(num(0)));
      case 'ceil': return D(Math.ceil(num(0)));
      case 'round': { const x = num(0); return D(Math.sign(x) * Math.round(Math.abs(x))); }
      case 'sin': return D(Math.sin(num(0)));
      case 'cos': return D(Math.cos(num(0)));
      case 'toupper': { const c = num(0); return I(c >= 97 && c <= 122 ? c - 32 : c); }
      case 'tolower': { const c = num(0); return I(c >= 65 && c <= 90 ? c + 32 : c); }
      case 'isdigit': { const c = num(0); return I(c >= 48 && c <= 57 ? 1 : 0); }
      case 'isalpha': { const c = num(0); return I((c >= 65 && c <= 90) || (c >= 97 && c <= 122) ? 1 : 0); }
      case 'isupper': { const c = num(0); return I(c >= 65 && c <= 90 ? 1 : 0); }
      case 'islower': { const c = num(0); return I(c >= 97 && c <= 122 ? 1 : 0); }
      case 'isalnum': { const c = num(0); return I((c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) ? 1 : 0); }
      case 'isspace': { const c = num(0); return I(c === 32 || (c >= 9 && c <= 13) ? 1 : 0); }
    }
    rerr(line, 'err.funcUnavailable', { name });
  }
  format(fmt, args, ai, line) {
    const out = []; const push = (s) => { for (const b of enc.encode(s)) out.push(b); };
    let i = 0;
    while (i < fmt.length) {
      const c = fmt[i];
      if (c !== 37) { out.push(c); i++; continue; }
      const rest = String.fromCharCode(...fmt.slice(i, i + 30));
      const m = /^%([-+ 0#]*)(\*|\d+)?(?:\.(\*|\d*))?(hh|h|ll|l|z|L)?([diuxXocsfFeEgGp%])/.exec(rest);
      if (!m) rerr(line, 'err.printfBadSpec', { spec: rest.slice(0, 3) });
      i += m[0].length;
      const flags = m[1];
      let width = m[2], prec = m[3];
      const len = m[4] || '', conv = m[5];
      if (conv === '%') { out.push(37); continue; }
      const nextArg = (what) => {
        if (ai >= args.length) rerr(line, 'err.printfMissingArg', { conv });
        return args[ai++];
      };
      if (width === '*') width = String(nextArg().v);
      if (prec === '*') prec = String(nextArg().v);
      const a = nextArg();
      let s;
      const pad = (s, numeric) => {
        const w = width ? parseInt(width, 10) : 0;
        if (s.length >= w) return s;
        if (flags.includes('-')) return s + ' '.repeat(w - s.length);
        if (flags.includes('0') && numeric && !(prec && 'diuxXo'.includes(conv))) {
          const sign = /^[+\- ]/.test(s) ? s[0] : ''; const body = sign ? s.slice(1) : s;
          const pre = /^0[xX]/.test(body) ? body.slice(0, 2) : '';
          return sign + pre + '0'.repeat(w - s.length) + body.slice(pre.length);
        }
        return ' '.repeat(w - s.length) + s;
      };
      const typeErr = (want) => rerr(line, 'err.printfType', { spec: '%' + len + conv, want: [want], n: ai - 1, type: tname(a.t),
        hint: want === 'frag.anInt' && isFloat(a.t) ? ['hint.useF'] : want === 'frag.aFloat' && isInt(a.t) ? ['hint.useD'] : want === 'frag.aString' && isInt(a.t) ? ['hint.useC'] : '' });
      switch (conv) {
        case 'd': case 'i': case 'u': case 'x': case 'X': case 'o': {
          if (!isInt(a.t)) typeErr('frag.anInt');
          let t = (len === 'l' || len === 'll' || len === 'z') ? TY.long : TY.int;
          if (len === 'h') t = TY.short; if (len === 'hh') t = TY.char;
          let v = a.v;
          const unsigned = conv !== 'd' && conv !== 'i';
          const tt = unsigned ? { k: 'int', size: t.size, signed: false } : t;
          v = wrap(v, tt);
          let digits;
          if (t.size === 8 && unsigned) { const B = BigInt.asUintN(64, BigInt(v)); digits = conv === 'x' || conv === 'X' ? B.toString(16) : conv === 'o' ? B.toString(8) : B.toString(); }
          else digits = conv === 'x' || conv === 'X' ? Math.abs(v).toString(16) : conv === 'o' ? Math.abs(v).toString(8) : Math.abs(v).toString();
          if (conv === 'X') digits = digits.toUpperCase();
          if (prec !== undefined) { const p = parseInt(prec || '0', 10); if (p === 0 && v === 0) digits = ''; while (digits.length < p) digits = '0' + digits; }
          let sign = v < 0 ? '-' : (flags.includes('+') && !unsigned ? '+' : (flags.includes(' ') && !unsigned ? ' ' : ''));
          if (flags.includes('#') && v !== 0) { if (conv === 'x') digits = '0x' + digits; if (conv === 'X') digits = '0X' + digits; if (conv === 'o') digits = '0' + digits; }
          s = pad(sign + digits, true); break;
        }
        case 'c': if (!isInt(a.t)) typeErr('frag.aChar'); s = null; { const w = width ? parseInt(width, 10) : 0; const pads = Math.max(0, w - 1); if (!flags.includes('-')) for (let k = 0; k < pads; k++) out.push(32); out.push(a.v & 255); if (flags.includes('-')) for (let k = 0; k < pads; k++) out.push(32); } break;
        case 's': {
          if (!isPtr(a.t)) typeErr('frag.aString');
          let bytes = a.v === 0 ? [...enc.encode('(null)')] : this.cstr(a.v, line, CTX_PRINTF_STRING);
          if (prec !== undefined) bytes = bytes.slice(0, parseInt(prec || '0', 10));
          const w = width ? parseInt(width, 10) : 0; const n = new TextDecoder().decode(new Uint8Array(bytes)).length; const pads = Math.max(0, w - n);
          if (!flags.includes('-')) for (let k = 0; k < pads; k++) out.push(32);
          out.push(...bytes);
          if (flags.includes('-')) for (let k = 0; k < pads; k++) out.push(32);
          s = null; break;
        }
        case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
          if (!isFloat(a.t)) typeErr('frag.aFloat');
          const v = a.v; const p = prec === undefined ? 6 : parseInt(prec || '0', 10);
          let body;
          if (!Number.isFinite(v)) body = Number.isNaN(v) ? 'nan' : 'inf';
          else if (conv === 'f' || conv === 'F') body = fixed(Math.abs(v), p);
          else if (conv === 'e' || conv === 'E') body = expo(Math.abs(v), p);
          else body = gfmt(Math.abs(v), p === 0 ? 1 : p, flags.includes('#'));
          if (conv === 'E' || conv === 'G') body = body.toUpperCase();
          const neg = v < 0 || Object.is(v, -0);
          const sign = neg ? '-' : (flags.includes('+') ? '+' : (flags.includes(' ') ? ' ' : ''));
          s = pad(sign + body, Number.isFinite(v)); break;
        }
        case 'p': if (!isPtr(a.t)) typeErr('frag.aPointer'); s = pad(a.v === 0 ? '(nil)' : '0x' + (0x7ffc00000000 + a.v).toString(16), false); break;
      }
      if (s !== null && s !== undefined) push(s);
    }
    return out;
  }
  scanf(args, line) {
    const fmt = this.cstr(args[0].v, line, CTX_SCANF_FORMAT);
    let ai = 1, count = 0, i = 0;
    const inp = this.input;
    const skipWs = () => { while (this.inPos < inp.length && (inp[this.inPos] === 32 || (inp[this.inPos] >= 9 && inp[this.inPos] <= 13))) this.inPos++; };
    while (i < fmt.length) {
      const c = fmt[i];
      if (c === 32 || (c >= 9 && c <= 13)) { skipWs(); i++; continue; }
      if (c !== 37) { if (this.inPos < inp.length && inp[this.inPos] === c) { this.inPos++; i++; continue; } return count; }
      const rest = String.fromCharCode(...fmt.slice(i, i + 12));
      const m = /^%(\*)?(\d+)?(hh|h|ll|l|L)?([diufFeEgGcsx%])/.exec(rest);
      if (!m) rerr(line, 'err.scanfBadSpec', { spec: rest.slice(0, 3) });
      i += m[0].length;
      const conv = m[4], len = m[3] || '', width = m[2] ? parseInt(m[2], 10) : Infinity, skip = !!m[1];
      if (conv === '%') { skipWs(); if (inp[this.inPos] === 37) { this.inPos++; continue; } return count; }
      let target = null;
      if (!skip) {
        if (ai >= args.length) rerr(line, 'err.scanfMissingArg', { conv });
        target = args[ai++];
        if (!isPtr(target.t)) rerr(line, 'err.scanfNeedsAddrGeneric', { spec: '%' + len + conv });
      }
      const want = (conv === 'd' || conv === 'i' || conv === 'u' || conv === 'x') ? (len === 'l' || len === 'll' ? 'long' : len === 'h' ? 'short' : 'int')
        : (conv === 'c' || conv === 's') ? 'char' : (len === 'l' || len === 'L' ? 'double' : 'float');
      if (target) {
        const to = target.t.to;
        const ok = want === 'char' ? (to.k === 'int' && to.size === 1) :
          want === 'double' ? to === TY.double : want === 'float' ? to === TY.float :
            (to.k === 'int' && to.size === ({ int: 4, long: 8, short: 2 })[want]);
        if (!ok) {
          let hint = '';
          if (to === TY.double) hint = ['hint.scanfDouble'];
          else if (to === TY.float) hint = ['hint.scanfFloat'];
          else if (to.k === 'int' && to.size === 4) hint = ['hint.scanfInt'];
          else if (to.k === 'int' && to.size === 1) hint = ['hint.scanfChar'];
          rerr(line, 'err.scanfType', { spec: '%' + len + conv, type: tname(to), hint });
        }
      }
      if (conv === 'c') {
        if (this.inPos >= inp.length) return count === 0 ? -1 : count;
        const ch = inp[this.inPos++]; if (target) this.store(target.v, TY.char, (ch << 24) >> 24, line); if (!skip) count++; continue;
      }
      skipWs();
      if (this.inPos >= inp.length) return count === 0 ? -1 : count;
      if (conv === 's') {
        const bytes = [];
        while (this.inPos < inp.length && bytes.length < width && !(inp[this.inPos] === 32 || (inp[this.inPos] >= 9 && inp[this.inPos] <= 13))) bytes.push(inp[this.inPos++]);
        if (target) {
          const capB = target.arrLen != null ? target.arrLen : null;
          if (capB != null && bytes.length + 1 > capB) rerr(line, 'err.scanfWordTooLong', { len: bytes.length, cap: capB });
          this.check(target.v, bytes.length + 1, line, true);
          this.u8.set(bytes, target.v); this.u8[target.v + bytes.length] = 0; this.init.fill(1, target.v, target.v + bytes.length + 1);
        }
        if (!skip) count++; continue;
      }
      let str = '';
      const peekc = () => String.fromCharCode(inp[this.inPos]);
      if (want === 'float' || want === 'double') {
        const m2 = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(String.fromCharCode(...inp.slice(this.inPos, this.inPos + 60)));
        if (!m2) return count;
        str = m2[0].slice(0, width); this.inPos += str.length;
        if (target) this.store(target.v, target.t.to, target.t.to.size === 4 ? Math.fround(parseFloat(str)) : parseFloat(str), line);
      } else {
        const hex = conv === 'x';
        const m2 = (hex ? /^[+-]?(0[xX])?[0-9a-fA-F]+/ : /^[+-]?\d+/).exec(String.fromCharCode(...inp.slice(this.inPos, this.inPos + 40)));
        if (!m2) return count;
        str = m2[0].slice(0, width); this.inPos += str.length;
        const v = hex ? parseInt(str, 16) : parseInt(str, 10);
        if (target) this.store(target.v, target.t.to, wrap(v, target.t.to), line);
      }
      if (!skip) count++;
    }
    return count;
  }
}
function fixed(v, p) {
  if (v >= 1e21) { let s = BigInt(Math.round(v)).toString(); return p > 0 ? s + '.' + '0'.repeat(p) : s; }
  return v.toFixed(Math.min(p, 100));
}
function expo(v, p) {
  let s = v.toExponential(Math.min(p, 100));
  return s.replace(/e([+-])(\d)$/, 'e$10$2');
}
function gfmt(v, p, alt) {
  if (v === 0) return alt ? '0.' + '0'.repeat(p - 1) : '0';
  let e = Number(v.toExponential(p - 1).split('e')[1]);
  let s;
  if (e < -4 || e >= p) { s = expo(v, p - 1); if (!alt) s = s.replace(/\.?0+e/, 'e'); }
  else { s = v.toFixed(Math.max(0, p - 1 - e)); if (!alt && s.includes('.')) s = s.replace(/\.?0+$/, ''); }
  return s;
}

/* ================= API ================= */
function compile(src) {
  const pp = preprocess(src);
  const parser = new Parser(pp);
  const prog = parser.parseProgram();
  prog.headers = pp.headers;
  return prog;
}
function run(src, opts) {
  opts = opts || {};
  const res = { ok: false, output: '', exitCode: null, error: null, warnings: [], leaks: 0, steps: 0 };
  let m = null;
  try {
    const prog = compile(src);
    res.warnings = prog.warnings;
    m = new Machine(prog, opts);
    res.exitCode = m.run();
    res.ok = true;
    res.leaks = m.heap.filter(b => b.live).length;
  } catch (e) {
    if (e instanceof CError) res.error = { kind: e.kind, line: e.line, message: e.msg };
    else if (e instanceof RangeError) res.error = { kind: 'runtime', line: 0, message: ['err.recursionTooDeepGeneric'] };
    else res.error = { kind: 'internal', line: 0, message: ['err.internal', { detail: String(e && e.message) }] };
  }
  if (m) { res.output = new TextDecoder().decode(new Uint8Array(m.out)); res.steps = m.steps; }
  return res;
}
return { run, compile };
});
