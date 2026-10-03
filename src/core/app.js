/* Interfaccia del corso. Non conosce nessun linguaggio (usa quello scelto con ?language=<id>, di default
   il primo caricato) né nessuna lingua: ogni testo passa da t(), con le chiavi di src/i18n/en.js. */
(function () {
'use strict';
const $ = (id) => document.getElementById(id);
const LANGUAGES = window.LANGUAGES || {};
const language = LANGUAGES[new URLSearchParams(location.search).get('language')] || Object.values(LANGUAGES)[0];
const CHAPTERS = language.chapters;
$('langName').textContent = language.name;
$('fileName').textContent = language.fileName;
const LEVELS = [];
CHAPTERS.forEach((c, ci) => c.levels.forEach((l, li) => LEVELS.push(Object.assign(l, { chapter: c, ci, li }))));

/* ---------- stato salvato ---------- */
const KEY = language.storageKey;
let state = { done: {}, code: {}, current: LEVELS[0].id, fs: 17, tutor: false };
try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) state = Object.assign(state, s); } catch (e) {}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

/* ---------- lingua dell'interfaccia ---------- */
const I18N = window.I18N || {};
const LOCALE_KEY = 'passo-passo-locale'; // comune a tutti i linguaggi
function pickLocale() {
  let saved = null; try { saved = localStorage.getItem(LOCALE_KEY); } catch (e) {}
  const wanted = [new URLSearchParams(location.search).get('locale'), saved, ...(navigator.languages || [navigator.language])];
  return wanted.map(l => l && l.toLowerCase().split('-')[0]).find(l => l && I18N[l]) || 'en';
}
let locale = pickLocale();
// Cerca prima nei testi del linguaggio, poi in quelli comuni; se una chiave manca nella lingua scelta usa l'inglese.
function t(key, vars) {
  const own = language.i18n || {};
  let s = [own[locale], I18N[locale], own.en, I18N.en].map(d => d && d[key]).find(v => v !== undefined);
  if (s === undefined) return key;
  vars = vars || {};
  if (typeof s === 'object') s = s[new Intl.PluralRules(locale).select(vars.n)] || s.other;
  return s.replace(/\{(\w+)\}/g, (m, k) => vars[k] !== undefined ? vars[k] : m);
}
function applyLocale() {
  document.documentElement.lang = locale;
  document.title = language.name + ' ' + t('app.name');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
}

/* ---------- testo ---------- */
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function md(s) {
  return esc(s).replace(/`([^`]+)`/g, (m, c) => '<code>' + c + '</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
function showSpaces(s) { return esc(s).replace(/ /g, '<span class="sp">·</span>').replace(/\t/g, '<span class="sp">→   </span>'); }
const oneLine = (s) => s.replace(/\n/g, ' ');

/* ---------- editor ---------- */
let cm = null, fallback = null, errMark = null;
if (window.CodeMirror) {
  cm = CodeMirror($('editorHost'), {
    mode: language.editorMode, lineNumbers: true, indentUnit: 4, tabSize: 4, indentWithTabs: false,
    matchBrackets: true, autoCloseBrackets: true, viewportMargin: Infinity, lineWrapping: false,
    extraKeys: {
      Tab: (c) => c.somethingSelected() ? c.indentSelection('add') : c.replaceSelection('    ', 'end'),
      'Shift-Tab': (c) => c.indentSelection('subtract'),
      'Ctrl-Enter': () => run(), 'Cmd-Enter': () => run(),
    },
  });
  cm.on('change', () => { clearErr(); onEdit(); });
} else {
  fallback = document.createElement('textarea'); fallback.id = 'fallback'; fallback.spellcheck = false;
  $('editorHost').appendChild(fallback);
  fallback.addEventListener('input', onEdit);
  fallback.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); const s = fallback.selectionStart; fallback.setRangeText('    ', s, fallback.selectionEnd, 'end'); onEdit(); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); }
  });
}
const getCode = () => cm ? cm.getValue() : fallback.value;
function setCode(v) { if (cm) { cm.setValue(v); cm.clearHistory(); } else fallback.value = v; }
function markErr(line) {
  clearErr();
  if (!cm || !line) return;
  const l = Math.min(Math.max(line - 1, 0), cm.lineCount() - 1);
  errMark = cm.addLineClass(l, 'background', 'errline');
  cm.scrollIntoView({ line: l, ch: 0 }, 60);
}
function clearErr() { if (errMark && cm) { cm.removeLineClass(errMark, 'background', 'errline'); errMark = null; } }
let saveTimer = null;
function onEdit() {
  $('saved').textContent = t('editor.edited');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { state.code[cur.id] = getCode(); save(); $('saved').textContent = t('editor.saved'); }, 400);
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeOverlays(); $('nav').classList.remove('open'); } });

/* ---------- navigazione ---------- */
function renderNav() {
  const nav = $('nav'); nav.innerHTML = '';
  CHAPTERS.forEach((c, ci) => {
    const done = c.levels.filter(l => state.done[l.id]).length;
    const h = document.createElement('h3');
    h.innerHTML = `${ci + 1}. ${esc(c.title)} <span>${done}/${c.levels.length}</span>`;
    nav.appendChild(h);
    c.levels.forEach((l) => {
      const b = document.createElement('button');
      b.className = state.done[l.id] ? 'done' : '';
      b.setAttribute('aria-current', l.id === cur.id ? 'true' : 'false');
      b.innerHTML = `<span class="dot">${state.done[l.id] ? '✓' : ''}</span><span>${esc(l.title)}</span>`;
      b.onclick = () => { go(l.id); nav.classList.remove('open'); };
      nav.appendChild(b);
    });
  });
  const n = LEVELS.filter(l => state.done[l.id]).length;
  $('progText').textContent = t('progress', { n, total: LEVELS.length });
  $('progBar').style.width = (100 * n / LEVELS.length) + '%';
}
let cur = LEVELS.find(l => l.id === state.current) || LEVELS[0];
let loaded = false;
function go(id) {
  if (loaded) { state.code[cur.id] = getCode(); }
  loaded = true;
  cur = LEVELS.find(l => l.id === id) || LEVELS[0];
  state.current = cur.id; save();
  $('eyebrow').textContent = t('eyebrow', { chapter: cur.ci + 1, title: cur.chapter.title, level: cur.li + 1, count: cur.chapter.levels.length });
  $('title').textContent = cur.title;
  $('task').innerHTML = '<p>' + md(cur.task) + '</p>';
  const t0 = cur.tests[0];
  $('expected').textContent = t0.expect;
  if (t0.input) { $('expInput').hidden = false; $('expInput').innerHTML = md(t('expected.input', { input: oneLine(t0.input) })); }
  else $('expInput').hidden = true;
  const needsInput = cur.tests.some(x => x.input);
  $('inputBox').hidden = !needsInput;
  $('stdin').value = t0.input || '';
  $('hint').hidden = true; $('hint').querySelector('span').innerHTML = md(cur.hint || '');
  $('hintBtn').hidden = !cur.hint;
  $('learn').querySelector('span').innerHTML = md(cur.learn || '');
  $('learn').hidden = !state.done[cur.id];
  $('solBtn').hidden = !state.tutor;
  $('nextBtn').hidden = !state.done[cur.id] || !nextLevel();
  setCode(state.code[cur.id] != null ? state.code[cur.id] : cur.code);
  $('saved').textContent = t('editor.saved');
  $('console').innerHTML = `<div class="empty">${esc(t('console.empty'))}</div>`;
  $('verdict').innerHTML = state.done[cur.id] ? `<div class="msg ok"><h4>${esc(t('level.done.title'))}</h4><p>${esc(t('level.done.text'))}</p></div>` : '';
  renderNav();
  try { window.scrollTo(0, 0); } catch (e) {}
  const act = $('nav').querySelector('[aria-current="true"]'); if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest' });
}
function nextLevel() { const i = LEVELS.indexOf(cur); return LEVELS[i + 1] || null; }

/* ---------- esecuzione ---------- */
const where = (line) => esc(line ? t('where', { file: language.fileName, line }) : language.fileName);
function describeError(err) {
  const kind = t('error.' + (['compile', 'limit', 'internal'].includes(err.kind) ? err.kind : 'runtime'));
  return `<div class="msg err"><h4>${esc(kind)}</h4><div class="where">${where(err.line)}</div><p>${md(err.message)}</p></div>`;
}
function run() {
  const code = getCode();
  state.code[cur.id] = code; save(); $('saved').textContent = t('editor.saved');
  clearErr();
  const input = $('inputBox').hidden ? (cur.tests[0].input || '') : $('stdin').value;
  const r = language.run(code, { input });
  // console
  let html = '<div class="prompt">$ ./main' + (input.trim() ? ' &nbsp;·&nbsp; ' + esc(t('console.input', { input: oneLine(input) })) : '') + '</div>';
  html += r.output ? '<pre>' + esc(r.output) + '</pre>' : `<div class="empty">${esc(t('console.noOutput'))}</div>`;
  if (r.ok) html += `<div class="exit">${esc(r.exitCode ? t('console.exitCode', { code: r.exitCode }) : t('console.exit'))}</div>`;
  $('console').innerHTML = html;
  let out = '';
  if (r.warnings && r.warnings.length) {
    out += r.warnings.map(w => `<div class="msg warn"><h4>${esc(t('warning'))}</h4><div class="where">${where(w.line)}</div><p>${md(w.msg)}</p></div>`).join('');
  }
  if (r.error) {
    markErr(r.error.line);
    $('verdict').innerHTML = describeError(r.error) + out;
    return;
  }
  // verifica
  const res = Checker.check(cur, code, language.run);
  if (res.passed) {
    const first = !state.done[cur.id];
    state.done[cur.id] = true; save();
    const nx = nextLevel();
    out = `<div class="msg ok"><h4>${esc(t('pass.title'))}</h4><p>${esc(t('pass.text', { n: res.totalTests }))}</p></div>` + out;
    $('learn').hidden = false;
    $('nextBtn').hidden = !nx;
    if (!nx && first) out += `<div class="msg info"><h4>${esc(t('finished.title'))}</h4><p>${esc(t('finished.text'))}</p></div>`;
    renderNav();
  } else {
    out = verdictFail(res, input) + out;
  }
  $('verdict').innerHTML = out;
}
function chips(res) {
  if (res.totalTests <= 1) return '';
  let s = '<div class="checks">';
  for (let i = 0; i < res.totalTests; i++) {
    const c = i < res.passedTests ? 'p' : (i === res.passedTests ? 'f' : '');
    s += `<span class="chk ${c}">${esc(t('check.chip', { n: i + 1 }))}${c === 'p' ? ' ✓' : c === 'f' ? ' ✗' : ''}</span>`;
  }
  return s + '</div>';
}
function verdictFail(res, shownInput) {
  const f = res.fail;
  const almost = (text) => `<div class="msg info"><h4>${esc(t('fail.almost'))}</h4><p>${md(text)}</p>${chips(res)}</div>`;
  if (f.kind === 'patch') return almost(t('fail.patch'));
  if (f.kind === 'leak') return almost(t('fail.leak', { n: f.leaks }));
  if (f.kind === 'rule') return almost(t('fail.rule', { msg: f.msg }));
  const test = f.test;
  let ctx = '';
  if (f.patched) ctx = t('fail.patched');
  else if (test.input && test.input !== shownInput) ctx = t('fail.triedInput', { input: oneLine(test.input) });
  else if (test.input) ctx = t('fail.withInput', { input: oneLine(test.input) });
  if (ctx) ctx = `<p>${md(ctx)}</p>`;
  if (f.kind === 'error') {
    return `<div class="msg err"><h4>${esc(t('fail.error.title'))}</h4>${ctx}<div class="where">${where(f.error.line)}</div><p>${md(f.error.message)}</p>${chips(res)}</div>`;
  }
  const exp = Checker.norm(test.expect).split('\n'), got = Checker.norm(f.got).split('\n');
  const n = Math.max(exp.length, got.length);
  let firstBad = -1;
  let rows = '';
  for (let i = 0; i < n; i++) {
    const a = exp[i], b = got[i];
    const bad = a !== b;
    if (bad && firstBad < 0) firstBad = i;
    const wsOnly = bad && a !== undefined && b !== undefined && a.replace(/\s+/g, '') === b.replace(/\s+/g, '');
    const fmt = (x) => x === undefined ? `<span class="sp">${esc(t('diff.missing'))}</span>` : (wsOnly ? showSpaces(x) : esc(x)) || `<span class="sp">${esc(t('diff.empty'))}</span>`;
    rows += `<tr class="${bad ? 'bad' : ''}"><td class="n">${i + 1}</td><td>${fmt(a)}</td><td>${fmt(b)}</td></tr>`;
  }
  const line = firstBad + 1;
  let what;
  if (got.length === 1 && got[0] === '') what = t('fail.noOutput');
  else if (exp[firstBad] === undefined) what = t('fail.extraLine', { line });
  else if (got[firstBad] === undefined) what = t('fail.missingLine', { line });
  else if (exp[firstBad].toLowerCase() === got[firstBad].toLowerCase()) what = t('fail.caseOnly', { line });
  else if (exp[firstBad].replace(/\s+/g, '') === got[firstBad].replace(/\s+/g, '')) what = t('fail.spacesOnly', { line });
  else what = t('fail.different', { line });
  return `<div class="msg err"><h4>${esc(t('fail.output.title'))}</h4>${ctx}<p>${esc(what)}</p>
    <div class="diff-wrap"><table class="diff"><thead><tr><th></th><th>${esc(t('diff.expected'))}</th><th>${esc(t('diff.yours'))}</th></tr></thead><tbody>${rows}</tbody></table></div>${chips(res)}</div>`;
}

/* ---------- conferme e impostazioni ---------- */
let cfAction = null;
// key: prefisso di tre testi in i18n (key.title, key.text, key.yes)
function ask(key, action) {
  $('cfTitle').textContent = t(key + '.title'); $('cfText').textContent = t(key + '.text'); $('cfYes').textContent = t(key + '.yes');
  cfAction = action; $('confirm').hidden = false; $('cfNo').focus();
}
function closeOverlays() { $('confirm').hidden = true; $('settings').hidden = true; }
$('cfNo').onclick = closeOverlays;
$('cfYes').onclick = () => { const a = cfAction; closeOverlays(); if (a) a(); };
$('resetBtn').onclick = () => ask('confirm.reset', () => {
  setCode(cur.code); state.code[cur.id] = cur.code; save(); $('verdict').innerHTML = ''; clearErr();
});
$('solBtn').onclick = () => ask('confirm.solution', () => {
  setCode(cur.solution); state.code[cur.id] = cur.solution; save();
});
$('hintBtn').onclick = () => { $('hint').hidden = !$('hint').hidden; };
$('runBtn').onclick = run;
$('nextBtn').onclick = () => { const n = nextLevel(); if (n) go(n.id); };
$('menuBtn').onclick = () => $('nav').classList.toggle('open');
$('settingsBtn').onclick = () => { $('tutor').checked = !!state.tutor; $('locale').value = locale; $('settings').hidden = false; $('closeSettings').focus(); };
$('closeSettings').onclick = closeOverlays;
$('tutor').onchange = () => { state.tutor = $('tutor').checked; save(); $('solBtn').hidden = !state.tutor; };
Object.keys(I18N).forEach(code => $('locale').add(new Option(I18N[code]['locale.name'], code)));
$('locale').onchange = () => {
  locale = $('locale').value;
  try { localStorage.setItem(LOCALE_KEY, locale); } catch (e) {}
  applyLocale(); go(cur.id);
};
function applyFont() { document.documentElement.style.setProperty('--fs', state.fs + 'px'); if (cm) cm.refresh(); }
$('fontUp').onclick = () => { state.fs = Math.min(24, state.fs + 1); save(); applyFont(); };
$('fontDown').onclick = () => { state.fs = Math.max(13, state.fs - 1); save(); applyFont(); };
$('resetAll').onclick = () => { closeOverlays(); ask('confirm.resetAll', () => {
  state.done = {}; state.code = {}; save(); go(LEVELS[0].id);
}); };
[$('settings'), $('confirm')].forEach(o => o.addEventListener('click', (e) => { if (e.target === o) closeOverlays(); }));

applyLocale();
applyFont();
go(cur.id);
})();
