// ── Lua Runner — powered by Fengari (Lua 5.3 in browser) ─────────────────

declare const fengari: {
  lauxlib: { luaL_newstate: () => unknown; luaL_dostring: (L: unknown, s: Uint8Array) => number };
  lualib: { luaL_openlibs: (L: unknown) => void };
  lua: {
    lua_gettop: (L: unknown, i?: number) => number;
    lua_type: (L: unknown, i: number) => number;
    lua_tojsstring: (L: unknown, i: number) => string;
    lua_tonumber: (L: unknown, i: number) => number;
    lua_toboolean: (L: unknown, i: number) => boolean;
    luaL_tolstring: (L: unknown, i: number, n: null) => string;
    lua_pushcfunction: (L: unknown, fn: (s: unknown) => number) => void;
    lua_setglobal: (L: unknown, name: Uint8Array) => void;
    LUA_TSTRING: number;
    LUA_TNUMBER: number;
    LUA_TBOOLEAN: number;
    LUA_TNIL: number;
    LUA_OK: number;
  };
  to_luastring: (s: string) => Uint8Array;
};

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Run Lua code via Fengari and display output in the given element */
export function runLua(editorId: string, outputId: string, btnId: string): void {
  const code = (document.getElementById(editorId) as HTMLTextAreaElement)?.value ?? '';
  const out = document.getElementById(outputId);
  const btn = document.getElementById(btnId) as HTMLButtonElement | null;
  if (!out) return;
  if (!code.trim()) { out.innerHTML = '<span class="out-error">Nothing to run.</span>'; return; }
  out.innerHTML = '';
  if (btn) { btn.disabled = true; btn.textContent = 'Running…'; }

  const lines: string[] = [];

  setTimeout(() => {
    try {
      const L = fengari.lauxlib.luaL_newstate();
      fengari.lualib.luaL_openlibs(L);

      fengari.lua.lua_pushcfunction(L, (luaState: unknown) => {
        const n = fengari.lua.lua_gettop(luaState);
        const parts: string[] = [];
        for (let i = 1; i <= n; i++) {
          const t = fengari.lua.lua_type(luaState, i);
          if (t === fengari.lua.LUA_TSTRING) parts.push(fengari.lua.lua_tojsstring(luaState, i));
          else if (t === fengari.lua.LUA_TNUMBER) parts.push(String(fengari.lua.lua_tonumber(luaState, i)));
          else if (t === fengari.lua.LUA_TBOOLEAN) parts.push(fengari.lua.lua_toboolean(luaState, i) ? 'true' : 'false');
          else if (t === fengari.lua.LUA_TNIL) parts.push('nil');
          else parts.push(fengari.lua.luaL_tolstring(luaState, i, null));
        }
        lines.push(parts.join('\t'));
        return 0;
      });
      fengari.lua.lua_setglobal(L, fengari.to_luastring('print'));

      const status = fengari.lauxlib.luaL_dostring(L, fengari.to_luastring(code));
      if (status !== fengari.lua.LUA_OK) {
        const errMsg = fengari.lua.lua_tojsstring(L, -1);
        out.innerHTML = `<span class="out-error">Error: ${escapeHtml(errMsg)}</span>`;
      } else {
        out.innerHTML = lines.length === 0
          ? '<span class="empty">— no output (add print() calls to see results) —</span>'
          : lines.map(l => `<span class="out-line">${escapeHtml(String(l))}</span>`).join('\n');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      out.innerHTML = `<span class="out-error">Runner error: ${escapeHtml(msg)}</span>`;
    }
    if (btn) { btn.disabled = false; btn.textContent = '▶ Run'; }
  }, 10);
}

export interface CheckResult { pass: boolean; msg?: string }
type CheckFn = (lines: string[], code: string) => CheckResult | null;

/** Run Lua then call an optional grading function */
export function runLuaCheck(
  editorId: string, outputId: string, btnId: string, checkFn?: CheckFn
): void {
  const code = (document.getElementById(editorId) as HTMLTextAreaElement)?.value ?? '';
  const out = document.getElementById(outputId);
  const btn = document.getElementById(btnId) as HTMLButtonElement | null;
  if (!out) return;
  if (!code.trim()) { out.innerHTML = '<span class="out-error">Nothing to run.</span>'; return; }
  out.innerHTML = '';
  if (btn) { btn.disabled = true; btn.textContent = 'Running…'; }

  const lines: string[] = [];

  setTimeout(() => {
    try {
      const L = fengari.lauxlib.luaL_newstate();
      fengari.lualib.luaL_openlibs(L);
      fengari.lua.lua_pushcfunction(L, (luaState: unknown) => {
        const n = fengari.lua.lua_gettop(luaState);
        const parts: string[] = [];
        for (let i = 1; i <= n; i++) {
          const t = fengari.lua.lua_type(luaState, i);
          if (t === fengari.lua.LUA_TSTRING) parts.push(fengari.lua.lua_tojsstring(luaState, i));
          else if (t === fengari.lua.LUA_TNUMBER) parts.push(String(fengari.lua.lua_tonumber(luaState, i)));
          else if (t === fengari.lua.LUA_TBOOLEAN) parts.push(fengari.lua.lua_toboolean(luaState, i) ? 'true' : 'false');
          else if (t === fengari.lua.LUA_TNIL) parts.push('nil');
          else parts.push(fengari.lua.luaL_tolstring(luaState, i, null));
        }
        lines.push(parts.join('\t'));
        return 0;
      });
      fengari.lua.lua_setglobal(L, fengari.to_luastring('print'));

      const status = fengari.lauxlib.luaL_dostring(L, fengari.to_luastring(code));
      if (status !== fengari.lua.LUA_OK) {
        const errMsg = fengari.lua.lua_tojsstring(L, -1);
        out.innerHTML = `<span class="out-error">❌ Error: ${escapeHtml(errMsg)}</span>`;
      } else {
        out.classList.remove('empty');
        if (lines.length === 0) {
          out.innerHTML = '<span class="empty">— no output (add print() calls) —</span>';
        } else {
          const feedback = checkFn ? checkFn(lines, code) : null;
          out.innerHTML = lines.map(l => `<span class="out-line">${escapeHtml(String(l))}</span>`).join('\n');
          if (feedback) {
            const color = feedback.pass ? 'var(--green)' : 'var(--amber)';
            const text = feedback.pass ? '✓ Correct!' : `⚠ ${escapeHtml(feedback.msg ?? '')}`;
            out.innerHTML += `\n<span class="out-line" style="margin-top:6px;display:block;padding:5px 0;border-top:1px solid var(--line);color:${color}">${text}</span>`;
          }
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      out.innerHTML = `<span class="out-error">Runner error: ${escapeHtml(msg)}</span>`;
    }
    if (btn) { btn.disabled = false; btn.textContent = '▶ Run'; }
  }, 10);
}

export function showHint(id: string): void {
  document.getElementById(id)?.classList.toggle('show');
}

// ── Check functions for Project 01 Lua tasks ────────────────────────────

export function checkP01B1(lines: string[]): CheckResult {
  if (lines.some(l => l.trim() === '0')) return { pass: true };
  if (lines.length === 0) return { pass: false, msg: 'Add print(coins) to see the output.' };
  return { pass: false, msg: 'Expected output: 0 — make sure you set coins = 0 and print it.' };
}

export function checkP01B2(lines: string[]): CheckResult {
  const expected = ['Coins: 1', 'Coins: 2', 'Coins: 3'];
  const match = expected.every((e, i) => lines[i]?.trim() === e);
  if (match) return { pass: true };
  if (lines.length === 0) return { pass: false, msg: 'Nothing printed. Add coins = coins + 1 and print("Coins: " .. coins) inside the function.' };
  return { pass: false, msg: 'Expected: Coins: 1 / Coins: 2 / Coins: 3 — check your addition and string concat.' };
}

export function checkP01B3(lines: string[]): CheckResult {
  const expected = ['Coins: 1', 'Coins: 2', 'Coins: 3'];
  const match = expected.every((e, i) => lines[i]?.trim() === e);
  if (match) return { pass: true };
  return { pass: false, msg: 'Expected Coins: 1, Coins: 2, Coins: 3 — use "Coins: " .. coins as the labelText.' };
}

export function checkP01D1(lines: string[]): CheckResult {
  if (lines.some(l => l.includes('leaderstats created for TestUser'))) return { pass: true };
  return { pass: false, msg: 'Output should include "leaderstats created for TestUser with Coins = 0"' };
}

export function checkP01D2(lines: string[]): CheckResult {
  if (lines.some(l => l.toLowerCase().includes('alex') && l.includes('5'))) return { pass: true };
  return { pass: false, msg: 'Print something like "Alex\'s coins updated to 5"' };
}

export function exposeGlobals(): void {
  const g = window as unknown as Record<string, unknown>;
  g.runLua = runLua;
  g.runLuaCheck = runLuaCheck;
  g.showHint = showHint;
  g.checkP01B1 = checkP01B1;
  g.checkP01B2 = checkP01B2;
  g.checkP01B3 = checkP01B3;
  g.checkP01D1 = checkP01D1;
  g.checkP01D2 = checkP01D2;
}
