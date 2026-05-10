// ── Interactive lesson elements ───────────────────────────────────────────
// MCQ, guess-output, write checks, debug challenges, hint boxes,
// copy-code, transcript toggle, confidence check, demo coin

// ── MCQ ──────────────────────────────────────────────────────────────────

const MCQ_CUSTOM: Record<string, string[]> = {
  'mcq-l1': ['', '✓ Correct — local keeps the variable private to this script. Faster and no naming conflicts.', '', ''],
  'mcq-l2': ['', '', '✓ Correct — the value you pass in ("Alex") becomes the parameter variable (name) inside the function.', ''],
  'mcq-l3': ['', '✓ Correct — isOpen stays true forever, so the if check always blocks new calls. The door is locked open.', '', ''],
  'mcq-l4': ['', '✓ Correct — the coin body is still there and solid. Walking over it keeps triggering Touched, which keeps collecting.', '', ''],
};

export function checkMCQ(el: HTMLElement, type: 'correct' | 'wrong'): void {
  const opts = el.closest('.it-options')?.querySelectorAll<HTMLElement>('.it-option');
  opts?.forEach(o => o.classList.add('disabled'));
  el.classList.add(type);

  const fbs = el.closest('.it-body')?.querySelectorAll<HTMLElement>('.it-feedback');
  const fb = fbs && fbs.length > 0 ? fbs[fbs.length - 1] : null;
  if (!fb) return;
  fb.classList.add('show', type);
  fb.textContent = type === 'correct' ? '✓ Correct!' : '✗ Not quite — re-read the section above and try the next lesson.';

  // Custom per-question feedback
  if (opts) {
    const optIdx = Array.from(opts).indexOf(el);
    const custom = MCQ_CUSTOM[fb.id];
    if (custom?.[optIdx]) fb.textContent = custom[optIdx];
  }
}

// ── Guess the Output ─────────────────────────────────────────────────────

export function checkGuess(el: HTMLElement, type: 'correct' | 'wrong'): void {
  const opts = el.closest('.gt-options')?.querySelectorAll<HTMLElement>('.gt-option');
  opts?.forEach(o => o.classList.add('disabled'));
  el.classList.add(type);
  const fb = el.closest('.gt-body')?.querySelector<HTMLElement>('.gt-fb');
  if (fb) {
    fb.classList.add('show', type);
    fb.textContent = el.dataset.fb ?? '';
  }
}

// ── Debug bug-line selector ───────────────────────────────────────────────

export function selectBugLine(el: HTMLElement, isCorrect: boolean): void {
  el.classList.remove('selected-correct', 'selected-wrong');
  el.classList.add(isCorrect ? 'selected-correct' : 'selected-wrong');
  if (!isCorrect) setTimeout(() => el.classList.remove('selected-wrong'), 700);
}

// ── DC hints / solution ──────────────────────────────────────────────────

export function toggleDcHints(btn: HTMLElement): void {
  const wrap = btn.nextElementSibling as HTMLElement | null;
  const open = wrap?.classList.toggle('open') ?? false;
  btn.textContent = open ? 'Hide hints ↑' : 'Unlock hints ↓';
}

export function toggleDcSolution(btn: HTMLElement): void {
  const sol = btn.nextElementSibling as HTMLElement | null;
  const open = sol?.classList.toggle('open') ?? false;
  btn.textContent = open ? 'Hide fix' : 'Show fix';
}

// ── Challenge answer reveal ───────────────────────────────────────────────

export function toggleAnswer(btn: HTMLElement): void {
  const box = btn.nextElementSibling as HTMLElement | null;
  const open = box?.classList.toggle('open') ?? false;
  btn.textContent = open ? 'Hide answer' : 'Show answer';
}

// ── Transcript toggle ─────────────────────────────────────────────────────

export function toggleTranscript(id: string, btn: HTMLElement): void {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.style.maxHeight === 'none') {
    el.style.maxHeight = '68px';
    btn.textContent = 'Show full transcript ↓';
  } else {
    el.style.maxHeight = 'none';
    btn.textContent = 'Hide transcript ↑';
  }
}

// ── Generic hint box ──────────────────────────────────────────────────────

export function toggleHintBox(id: string): void {
  document.getElementById(id)?.classList.toggle('open');
}

// ── Write-task checkers ───────────────────────────────────────────────────

export function checkWriteL1(): void {
  const v = (document.getElementById('wt-l1') as HTMLTextAreaElement)?.value.trim().toLowerCase() ?? '';
  const res = document.getElementById('wt-res-l1');
  if (!res) return;
  res.classList.add('show');
  if (v.includes('local') && v.includes('playername') && (v.includes('"') || v.includes("'")) && v.includes('=')) {
    res.className = 'wt-result show pass';
    res.textContent = '✓ Correct! local, playerName, = and a quoted string value.';
  } else {
    res.className = 'wt-result show fail';
    let h = '✗ Not quite. ';
    if (!v.includes('local')) h += 'Missing "local". ';
    if (!v.includes('playername')) h += 'Variable should be named playerName. ';
    if (!v.includes('"') && !v.includes("'")) h += 'String values need quotes. ';
    res.textContent = h;
  }
}

export function checkWriteL2(): void {
  const v = (document.getElementById('wt-l2') as HTMLTextAreaElement)?.value.trim().toLowerCase() ?? '';
  const res = document.getElementById('wt-res-l2');
  if (!res) return;
  res.classList.add('show');
  if (v.includes('for') && v.includes('1') && v.includes('3') && v.includes('do') && v.includes('print') && v.includes('end')) {
    res.className = 'wt-result show pass';
    res.textContent = '✓ Looks right! for loop from 1 to 3 with print inside.';
  } else {
    res.className = 'wt-result show fail';
    let h = '✗ Not quite. ';
    if (!v.includes('for')) h += 'Need a for keyword. ';
    if (!v.includes('do')) h += 'Need "do" after the numbers. ';
    if (!v.includes('end')) h += 'Need "end" to close the loop. ';
    res.textContent = h;
  }
}

export function checkWriteL4(): void {
  const v = (document.getElementById('wt-l4') as HTMLTextAreaElement)?.value.trim().toLowerCase() ?? '';
  const res = document.getElementById('wt-res-l4');
  if (!res) return;
  res.classList.add('show');
  if (v.includes('player') && v.includes('leaderstats') && v.includes('coins') && v.includes('value') && v.includes('+=')) {
    res.className = 'wt-result show pass';
    res.textContent = '✓ Correct! player.leaderstats.Coins.Value += 1';
  } else {
    res.className = 'wt-result show fail';
    let h = '✗ Not quite. ';
    if (!v.includes('leaderstats')) h += 'Need leaderstats in the path. ';
    if (!v.includes('coins')) h += 'Need Coins (the IntValue name). ';
    if (!v.includes('value')) h += 'Need .Value at the end. ';
    if (!v.includes('+=')) h += 'Use += 1 to add. ';
    res.textContent = h;
  }
}

// ── Copy code ─────────────────────────────────────────────────────────────

export function copyCode(btn: HTMLElement): void {
  const pre = btn.closest('.code-wrap')?.querySelector('pre');
  if (!pre) return;
  navigator.clipboard.writeText(pre.textContent ?? '').then(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
  });
}

// ── Demo coin (wow-block) ─────────────────────────────────────────────────

let demoCoins = 0;
let demoCooldown = false;

export function collectDemoCoin(): void {
  if (demoCooldown) return;
  demoCooldown = true;
  const coin = document.getElementById('demo-coin');
  const val = document.getElementById('demo-coins');
  coin?.classList.add('collected');
  demoCoins++;
  if (val) {
    val.textContent = String(demoCoins);
    val.classList.add('bump');
    setTimeout(() => val.classList.remove('bump'), 400);
  }
  setTimeout(() => { coin?.classList.remove('collected'); demoCooldown = false; }, 2000);
}

// ── Confidence checklist ──────────────────────────────────────────────────

export function toggleCheck(el: HTMLElement): void {
  el.classList.toggle('checked');
  updateConfResult();
}

function updateConfResult(): void {
  const items = document.querySelectorAll('#conf-checklist .check-item');
  const total = items.length;
  const done = document.querySelectorAll('#conf-checklist .check-item.checked').length;
  const res = document.getElementById('conf-result');
  if (!res) return;
  if (done === 0) {
    res.style.color = 'var(--txt3)';
    res.textContent = 'Tick the boxes above to see your result.';
  } else if (done < total) {
    res.style.color = 'var(--amber)';
    res.textContent = `${done}/${total} — Good progress. Go back and practice the ones you haven't ticked yet before moving on.`;
  } else {
    res.style.color = 'var(--green)';
    res.textContent = `✓ ${done}/${total} — You're ready. Head to Lesson 18 and start writing code.`;
  }
}

// ── Image injection ───────────────────────────────────────────────────────

const IMAGES: Record<string, string> = {
  'open-studio': '', 'new-baseplate': '', 'insert-script': '', 'output-window': '',
  'script-editor': '', 'insert-part': '', 'resize-part': '', 'anchor-part': '',
  'insert-script-part': '', 'door-play-test': '', 'door-open-result': '',
  'coin-part': '', 'leaderstats-explorer': '', 'coin-collected': '',
};

export function injectImages(): void {
  document.querySelectorAll<HTMLImageElement>('img[data-key]').forEach(img => {
    const src = IMAGES[img.dataset.key ?? ''];
    if (src) {
      img.src = src;
      img.classList.add('loaded');
      img.closest('.img-step-img')?.querySelector<HTMLElement>('.img-placeholder')?.remove();
    }
  });
}

// ── Expose all globals ────────────────────────────────────────────────────

export function exposeGlobals(): void {
  const g = window as unknown as Record<string, unknown>;
  g.checkMCQ = checkMCQ;
  g.checkGuess = checkGuess;
  g.selectBugLine = selectBugLine;
  g.toggleDcHints = toggleDcHints;
  g.toggleDcSolution = toggleDcSolution;
  g.toggleAnswer = toggleAnswer;
  g.toggleTranscript = toggleTranscript;
  g.toggleHintBox = toggleHintBox;
  g.checkWriteL1 = checkWriteL1;
  g.checkWriteL2 = checkWriteL2;
  g.checkWriteL4 = checkWriteL4;
  g.copyCode = copyCode;
  g.collectDemoCoin = collectDemoCoin;
  g.toggleCheck = toggleCheck;
  g.injectImages = injectImages;
}
