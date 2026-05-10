// ── Renderer ──────────────────────────────────────────────────────────────
// Reads config.ts and wires everything into the static HTML pages.

import { VIDEO_URLS, CAPTION_URLS, TRANSCRIPTS, LOCKED_LESSONS, SITE, FEATURES } from '../data/config.js';
import { mountPlayer } from './Videoplayer.js';

// ── Videos ────────────────────────────────────────────────────────────────

function injectVideos(): void {
  Object.entries(VIDEO_URLS).forEach(([lessonId, url]) => {
    if (!url) return;
    mountPlayer(lessonId, url, CAPTION_URLS[lessonId] ?? '');
  });
}

// ── Transcripts ───────────────────────────────────────────────────────────

function injectTranscripts(): void {
  Object.entries(TRANSCRIPTS).forEach(([lessonId, text]) => {
    if (!text) return;
    const el = document.querySelector(`#page-${lessonId} .transcript`);
    if (el) el.textContent = text;
  });
}

// ── Lesson locks ──────────────────────────────────────────────────────────

function applyLocks(): void {
  Object.entries(LOCKED_LESSONS).forEach(([lessonId, locked]) => {
    if (!locked) return;
    const wrap = document.querySelector(`#page-${lessonId} .lesson-wrap`) as HTMLElement | null;
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="lesson-eyebrow">${lessonId.toUpperCase()}</div>
      <h1 class="lesson-title">COMING<br/>SOON</h1>
      <p class="lesson-desc">This lesson is in production. Complete the previous lessons and check back soon.</p>
      <div class="lesson-nav">
        <button class="lnav-btn" onclick="nav('home',null)">← BACK TO HOME</button>
      </div>`;
  });
}

// ── Social links ──────────────────────────────────────────────────────────

function injectSocialLinks(): void {
  document.querySelectorAll<HTMLAnchorElement>('.gh-link').forEach(a => {
    if (SITE.github) a.href = SITE.github;
  });
  document.querySelectorAll<HTMLAnchorElement>('.ytlink, .sb-yt').forEach(a => {
    if (SITE.youtubeChannel) a.href = SITE.youtubeChannel;
  });
  document.querySelectorAll<HTMLAnchorElement>('.video-placeholder a').forEach(a => {
    if (SITE.youtubeChannel) a.href = SITE.youtubeChannel;
    const textNode = Array.from(a.childNodes).find(
      n => n.nodeType === Node.TEXT_NODE && n.textContent?.trim().startsWith('@')
    );
    if (textNode) textNode.textContent = ` ${SITE.youtubeHandle} · UPLOADING SOON`;
  });
}

// ── Feature flags ─────────────────────────────────────────────────────────

function applyFeatureFlags(): void {
  const ghBtn = document.querySelector<HTMLElement>('.gh-link');
  if (ghBtn) ghBtn.style.display = FEATURES.showGithubButton ? '' : 'none';

  const ytBtn = document.querySelector<HTMLElement>('.ytlink');
  if (ytBtn) ytBtn.style.display = FEATURES.showYoutubeButton ? '' : 'none';

  const progWrap = document.querySelector<HTMLElement>('.prog-wrap');
  if (progWrap) progWrap.style.display = FEATURES.showProgressBar ? '' : 'none';

  if (!FEATURES.luaRunnerEnabled) {
    document.querySelectorAll<HTMLElement>('.lua-runner').forEach(r => {
      r.style.opacity = '0.4';
      r.style.pointerEvents = 'none';
    });
  }
}

// ── Runtime setter (browser console) ─────────────────────────────────────
// Usage: setVideoUrl('lc01', 'https://github.com/.../lc01.mp4')

export function setVideoUrl(lessonId: string, url: string): void {
  VIDEO_URLS[lessonId] = url;
  mountPlayer(lessonId, url, CAPTION_URLS[lessonId] ?? '');
}

// ── Init ──────────────────────────────────────────────────────────────────

export function initRenderer(): void {
  injectVideos();
  injectTranscripts();
  applyLocks();
  injectSocialLinks();
  applyFeatureFlags();
}