// ── Project 01 Split Editor Engine ───────────────────────────────────────

import { P1_TASKS, P1_STEP_TASK, P1_STEP_TAB } from '../data/project';
import { escapeHtml } from './luaRunner';

let p1CurrentTask = -1;
let p1CurrentStep = 1;
let p1EditorReady = false;

// ── Lua syntax token sets ────────────────────────────────────────────────

const LKW = new Set(['local','function','if','then','else','elseif','end','for','do','while','repeat','until','return','break','in','and','or','not']);
const LBL = new Set(['print','type','tostring','tonumber','pairs','ipairs','error','assert','pcall','require','next','select','unpack']);
const LGL = new Set(['game','workspace','script','Players','ReplicatedStorage','ServerScriptService','StarterGui','Instance','Vector3','CFrame','Color3','UDim2','math','string','table','task','TweenService','UserInputService']);
const LBO = new Set(['true','false','nil']);

// ── Tokenizer ────────────────────────────────────────────────────────────

function tokenizeLua(code: string): string {
  const out: string[] = [];
  let i = 0;
  while (i < code.length) {
    // Comments
    if (code[i] === '-' && code[i + 1] === '-') {
      let j = i;
      while (j < code.length && code[j] !== '\n') j++;
      out.push(`<span style="color:var(--lua-comment);font-style:italic">${escapeHtml(code.slice(i, j))}</span>`);
      i = j; continue;
    }
    // Double-quoted strings
    if (code[i] === '"') {
      let j = i + 1;
      while (j < code.length && code[j] !== '"' && code[j] !== '\n') { if (code[j] === '\\') j++; j++; }
      out.push(`<span style="color:var(--lua-string)">${escapeHtml(code.slice(i, j + 1))}</span>`);
      i = j + 1; continue;
    }
    // Single-quoted strings
    if (code[i] === "'") {
      let j = i + 1;
      while (j < code.length && code[j] !== "'" && code[j] !== '\n') { if (code[j] === '\\') j++; j++; }
      out.push(`<span style="color:var(--lua-string)">${escapeHtml(code.slice(i, j + 1))}</span>`);
      i = j + 1; continue;
    }
    // Numbers
    if (/\d/.test(code[i]) || (code[i] === '.' && /\d/.test(code[i + 1] ?? ''))) {
      let j = i;
      while (j < code.length && /[\d.]/.test(code[j])) j++;
      out.push(`<span style="color:var(--lua-number)">${escapeHtml(code.slice(i, j))}</span>`);
      i = j; continue;
    }
    // Identifiers / keywords
    if (/[a-zA-Z_]/.test(code[i])) {
      let j = i;
      while (j < code.length && /\w/.test(code[j])) j++;
      const w = code.slice(i, j);
      if (LKW.has(w)) {
        out.push(`<span style="color:var(--lua-keyword)">${w}</span>`);
      } else if (LBO.has(w)) {
        out.push(`<span style="color:var(--lua-bool)">${w}</span>`);
      } else if (LGL.has(w)) {
        out.push(`<span style="color:var(--lua-builtin)">${w}</span>`);
      } else if (LBL.has(w)) {
        out.push(`<span style="color:var(--lua-method)">${escapeHtml(w)}</span>`);
      } else {
        let k = j;
        while (k < code.length && code[k] === ' ') k++;
        if (code[k] === '(') {
          out.push(`<span style="color:var(--lua-method)">${escapeHtml(w)}</span>`);
        } else if (i > 0 && /[.:]/.test(code[i - 1])) {
          out.push(`<span style="color:var(--lua-property)">${escapeHtml(w)}</span>`);
        } else {
          out.push(escapeHtml(w));
        }
      }
      i = j; continue;
    }
    // String concat operator
    if (code[i] === '.' && code[i + 1] === '.') {
      out.push(`<span style="color:var(--lua-number)">..</span>`);
      i += 2; continue;
    }
    if (code[i] === '\n') { out.push('\n'); i++; continue; }
    out.push(escapeHtml(code[i]));
    i++;
  }
  return out.join('');
}

// ── Error detection ──────────────────────────────────────────────────────

interface LuaError { line: number; msg: string }

function detectErrors(code: string): LuaError[] {
  const errors: LuaError[] = [];
  const lines = code.split('\n');
  let open = 0;
  lines.forEach((line, i) => {
    const s = line.replace(/--.*$/, '').replace(/"[^"]*"|'[^']*'/g, '""').trim();
    open += (s.match(/\b(function|if|for|while|do|repeat)\b/g) ?? []).length
          - (s.match(/\bend\b/g) ?? []).length;
    if (/\bif\b.+[^<>=~]\s+do\b/.test(s)) errors.push({ line: i + 1, msg: 'Use "then" after if' });
    if ((s.match(/"/g) ?? []).length % 2 !== 0) errors.push({ line: i + 1, msg: 'Unclosed string' });
  });
  return errors;
}

// ── Lua → JS transpiler (for RUN button simulation) ─────────────────────

function evalLua(code: string): { output: string[]; error?: string } {
  const lines: string[] = [];
  const print = (...a: unknown[]) => lines.push(a.map(x => x === null || x === undefined ? 'nil' : String(x)).join('\t'));
  let js = code
    .replace(/game\s*[.:]\s*[\w.:]+/g, 'nil')
    .replace(/workspace\s*[.:]\s*\w+/g, 'nil')
    .replace(/script\s*[.:]\s*\w+/g, 'nil')
    .replace(/Instance\.new\s*\([^)]*\)/g, '{}')
    .replace(/:WaitForChild\s*\([^)]*\)/g, '')
    .replace(/\.Text\s*=/g, '._t=')
    .replace(/FireServer\s*\(/g, 'print("→ FireServer called")//')
    .replace(/OnServerEvent\s*:\s*Connect\s*\(/g, 'print("→ OnServerEvent connected")//')
    .replace(/--[^\n]*/g, '')
    .replace(/\blocal\b/g, 'let ')
    .replace(/\bthen\b/g, '{').replace(/\bdo\b/g, '{').replace(/\bend\b/g, '}')
    .replace(/\belseif\b/g, '} else if')
    .replace(/\bnil\b/g, 'null').replace(/\bnot\s+/g, '!').replace(/\band\b/g, '&&').replace(/\bor\b/g, '||')
    .replace(/\.\./g, '+').replace(/~=/g, '!==')
    .replace(/let\s+function\s+(\w+)\s*\(/g, 'function $1(')
    .replace(/function\s*\(/g, 'function(')
    .replace(/for\s+(\w+)\s*=\s*([^,\n{]+),\s*([^\n,{]+?)\s*\{/g, 'for(let $1=$2;$1<=$3;$1++){');
  try {
    const fn = new Function('print', 'nil', js);
    fn(print, null);
    return { output: lines };
  } catch (e: unknown) {
    return { error: (e as Error).message, output: lines };
  }
}

function explainError(err: string): string {
  const e = err.toLowerCase();
  if (e.includes('<eof>')) return 'Missing "end" — every if/function/for needs a matching end.';
  if (e.includes('concatenate') && e.includes('nil')) return 'Using ".." on nil. Is the variable defined?';
  if (e.includes('arithmetic') && e.includes('nil')) return 'Math on nil. Check variable name spelling.';
  if (e.includes('attempt to call')) return 'Not a function. Check the name is spelled correctly.';
  return 'Check line numbers in the error. They tell you exactly where to look.';
}

// ── DOM helpers ──────────────────────────────────────────────────────────

function updateGutter(code: string): void {
  const g = document.getElementById('p1-gutter');
  if (!g) return;
  const n = Math.max(code.split('\n').length + 3, 20);
  const errs = new Set(detectErrors(code).map(e => e.line));
  g.innerHTML = Array.from({ length: n }, (_, i) =>
    `<span class="prp-ln${errs.has(i + 1) ? ' err' : ''}">${i + 1}</span>`
  ).join('');
}

function highlight(code: string): void {
  const el = document.getElementById('p1-highlight');
  if (el) el.innerHTML = tokenizeLua(code);
}

function updateCursor(): void {
  const ta = document.getElementById('p1-code') as HTMLTextAreaElement | null;
  if (!ta) return;
  const txt = ta.value.slice(0, ta.selectionStart).split('\n');
  const cursor = document.getElementById('p1-cursor');
  if (cursor) cursor.textContent = `Ln ${txt.length}, Col ${txt[txt.length - 1].length + 1}`;
  document.querySelectorAll('.prp-ln').forEach((el, i) =>
    el.classList.toggle('cur', i === txt.length - 1)
  );
}

function updateErrors(code: string): void {
  const errs = detectErrors(code);
  const el = document.getElementById('p1-errs');
  if (!el) return;
  el.innerHTML = errs.length
    ? `<span class="prp-err-badge">${errs.length}</span> error${errs.length > 1 ? 's' : ''}`
    : `<span style="color:#4fc1ff;font-size:9px;opacity:.85">✓ No errors</span>`;
}

// ── Public editor API ────────────────────────────────────────────────────

export function p1SetTask(idx: number): void {
  p1CurrentTask = idx;
  const task = P1_TASKS[idx];
  const taskText = document.getElementById('p1-task-text');
  if (taskText) taskText.innerHTML = task.text;

  const dots = document.getElementById('p1-task-dots');
  if (dots) {
    dots.innerHTML = P1_TASKS.map((_, i) =>
      `<div class="prp-td ${i < idx ? 'done' : i === idx ? 'cur' : ''}"></div>`
    ).join('');
  }

  const ta = document.getElementById('p1-code') as HTMLTextAreaElement | null;
  if (ta) {
    ta.value = task.starter ?? '';
    updateGutter(ta.value);
    highlight(ta.value);
  }

  const out = document.getElementById('p1-output');
  if (out) out.innerHTML = '<span class="prp-out-empty">-- Write your code and click RUN, then CHECK.</span>';

  const btn = document.getElementById('p1-check-btn');
  if (btn) { btn.textContent = 'CHECK ✓'; btn.classList.remove('passed'); }

  document.getElementById('p1-hint')?.classList.remove('show');
  const errs = document.getElementById('p1-errs');
  if (errs) errs.innerHTML = '';
}

export function p1SwitchTab(tab: 'ls' | 'ss'): void {
  document.getElementById('p1-ft-ls')?.classList.toggle('active', tab === 'ls');
  document.getElementById('p1-ft-ss')?.classList.toggle('active', tab === 'ss');
  const scriptType = document.getElementById('p1-script-type');
  if (scriptType) scriptType.textContent = tab === 'ls' ? 'LocalScript' : 'Script';
}

export function p1GoStep(n: number): void {
  if (n > p1CurrentStep) document.getElementById('p1-t' + p1CurrentStep)?.classList.add('done');
  p1CurrentStep = n;

  document.querySelectorAll('.plp-tab').forEach((t, i) => t.classList.toggle('active', i === n - 1));
  document.querySelectorAll('.plp-step').forEach((s, i) => s.classList.toggle('active', i === n - 1));

  const pct = Math.round((n / 7) * 100);
  const prog = document.getElementById('p1-prog');
  if (prog) prog.style.width = pct + '%';

  const stepLabel = document.getElementById('p1-step-label');
  if (stepLabel) stepLabel.textContent = `Step ${n} of 7`;

  const taskIdx = P1_STEP_TASK[n];
  if (taskIdx !== undefined) {
    p1SetTask(taskIdx);
    const tab = P1_STEP_TAB[n];
    if (tab) p1SwitchTab(tab);
  }
}

export function p1Run(): void {
  const ta = document.getElementById('p1-code') as HTMLTextAreaElement | null;
  const out = document.getElementById('p1-output');
  if (!ta || !out) return;
  const code = ta.value;
  if (!code.trim()) { out.innerHTML = '<span class="prp-out-warn">Nothing to run.</span>'; return; }

  const result = evalLua(code);
  if (result.error) {
    const hint = explainError(result.error);
    out.innerHTML = `<span class="prp-out-error">${escapeHtml(result.error)}</span>${hint ? `<span class="prp-out-hint">💡 ${escapeHtml(hint)}</span>` : ''}`;
  } else {
    let html = `<span class="prp-out-info">-- Browser sim (game.*, script.Parent won't resolve)</span>\n`;
    html += result.output.length
      ? result.output.map(l => `<span class="prp-out-ok">${escapeHtml(String(l))}</span>`).join('\n')
      : `<span class="prp-out-info">-- Code ran, no print() output.</span>`;
    out.innerHTML = html;
  }
}

export function p1Check(): void {
  if (p1CurrentTask < 0) {
    const out = document.getElementById('p1-output');
    if (out) out.innerHTML = '<span class="prp-out-info">Complete steps on the left to unlock coding tasks.</span>';
    return;
  }
  const ta = document.getElementById('p1-code') as HTMLTextAreaElement | null;
  const out = document.getElementById('p1-output');
  const btn = document.getElementById('p1-check-btn');
  const task = P1_TASKS[p1CurrentTask];
  if (!ta || !out || !btn) return;

  if (task.check(ta.value)) {
    btn.textContent = '✓ PASSED';
    btn.classList.add('passed');
    out.innerHTML = `<span class="prp-out-ok">✓ ${escapeHtml(task.pass)}</span>`;
    document.getElementById('p1-hint')?.classList.remove('show');
    if (p1CurrentTask < P1_TASKS.length - 1) {
      setTimeout(() => {
        p1SetTask(p1CurrentTask + 1);
        btn.textContent = 'CHECK ✓';
        btn.classList.remove('passed');
      }, 2500);
    }
  } else {
    btn.textContent = 'CHECK ✓';
    btn.classList.remove('passed');
    out.innerHTML = `<span style="color:var(--amber);display:block">Not quite — re-read the task. Use RUN to see errors first.</span>`;
  }
}

export function p1ShowHint(): void {
  if (p1CurrentTask < 0) return;
  const h = document.getElementById('p1-hint');
  if (!h) return;
  h.textContent = '💡 Hint:\n' + P1_TASKS[p1CurrentTask].hint;
  h.classList.toggle('show');
}

export function initP1Editor(): void {
  if (p1EditorReady) return;
  p1EditorReady = true;
  const ta = document.getElementById('p1-code') as HTMLTextAreaElement | null;
  const hl = document.getElementById('p1-highlight');
  if (!ta || !hl) return;

  ta.addEventListener('input', () => {
    updateGutter(ta.value);
    highlight(ta.value);
    updateErrors(ta.value);
  });
  ta.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart, en = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
      ta.selectionStart = ta.selectionEnd = s + 2;
      updateGutter(ta.value);
      highlight(ta.value);
    }
  });
  ta.addEventListener('scroll', () => { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; });
  ta.addEventListener('click', updateCursor);
  ta.addEventListener('keyup', updateCursor);
  updateGutter('');
}

export function exposeGlobals(): void {
  const g = window as unknown as Record<string, unknown>;
  g.p1GoStep = p1GoStep;
  g.p1Run = p1Run;
  g.p1Check = p1Check;
  g.p1ShowHint = p1ShowHint;
  g.p1SetTask = p1SetTask;
  g.p1SwitchTab = p1SwitchTab;
  g.initP1Editor = initP1Editor;
}
