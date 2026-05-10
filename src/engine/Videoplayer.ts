// ── RoDev Custom Video Player ─────────────────────────────────────────────
// Self-hosted .mp4 via GitHub Releases. Zero branding, zero tracking.
// Supports: play/pause, scrub, buffer indicator, volume, speed, captions, fullscreen.
//
// HOW TO UPLOAD A VIDEO + CAPTIONS (GitHub Releases):
//   1. Go to your repo → Releases → Draft a new release
//   2. Create a tag e.g. v1.0-videos
//   3. Upload: lc01.mp4  and  lc01.vtt  (captions file)
//   4. Publish → right-click each file → Copy link address
//   5. Paste URLs into VIDEO_URLS and CAPTION_URLS in config.ts
//
// .vtt file format (WebVTT):
//   WEBVTT
//
//   00:00:01.000 --> 00:00:04.000
//   Welcome to RoDev Academy.
//
//   00:00:05.000 --> 00:00:09.000
//   In this lesson we cover what code actually is.

// ── Time formatter ────────────────────────────────────────────────────────

function fmt(s: number): string {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ── SVG icons ─────────────────────────────────────────────────────────────

const IC = {
  play:   `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`,
  pause:  `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  volOn:  `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>`,
  volOff: `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`,
  cc:     `<svg viewBox="0 0 24 24"><path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1zm7 0h-1.5v-.5h-2v3h2V13H18v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1z"/></svg>`,
  fs:     `<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`,
  fsExit: `<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`,
} as const;

// ── WebVTT parser ─────────────────────────────────────────────────────────

interface Cue { start: number; end: number; text: string }

function parseVTT(raw: string): Cue[] {
  const cues: Cue[] = [];
  const blocks = raw.replace(/\r\n/g, '\n').split(/\n\n+/);

  function toSec(ts: string): number {
    const parts = ts.trim().split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return parts[0] * 60 + parts[1];
  }

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const arrow = lines.findIndex(l => l.includes('-->'));
    if (arrow === -1) continue;
    const [startStr, endStr] = lines[arrow].split('-->');
    const text = lines.slice(arrow + 1).join('\n').trim();
    if (text) cues.push({ start: toSec(startStr), end: toSec(endStr), text });
  }
  return cues;
}

// ── Player HTML ───────────────────────────────────────────────────────────

function buildHTML(id: string, videoUrl: string, captionUrl: string): string {
  const trackTag = captionUrl
    ? `<track kind="subtitles" src="${captionUrl}" srclang="en" label="English" default/>`
    : '';

  return `
  <div class="rdv-player paused" id="rdvp-${id}" tabindex="0">
    <video preload="metadata" id="rdvv-${id}" crossorigin="anonymous">
      <source src="${videoUrl}" type="video/mp4"/>
      ${trackTag}
    </video>

    <!-- Big play overlay -->
    <div class="rdv-overlay">
      <div class="rdv-big-play">${IC.play}</div>
    </div>

    <!-- Caption display -->
    <div class="rdv-captions" id="rdvcap-${id}"></div>

    <!-- Controls bar -->
    <div class="rdv-controls">

      <!-- Scrub bar -->
      <div class="rdv-progress" id="rdvbar-${id}">
        <div class="rdv-progress-buf"  id="rdvbuf-${id}"  style="width:0%"></div>
        <div class="rdv-progress-fill" id="rdvfill-${id}" style="width:0%">
          <div class="rdv-progress-thumb"></div>
        </div>
        <!-- Hover time tooltip -->
        <div class="rdv-tooltip" id="rdvtip-${id}">0:00</div>
      </div>

      <!-- Bottom row -->
      <div class="rdv-bottom">

        <!-- Play/Pause -->
        <button class="rdv-btn" id="rdvplay-${id}" title="Play (Space / K)">${IC.play}</button>

        <!-- Time -->
        <span class="rdv-time" id="rdvtime-${id}">0:00 / 0:00</span>

        <!-- Volume -->
        <div class="rdv-vol-wrap">
          <button class="rdv-btn" id="rdvmute-${id}" title="Mute (M)">${IC.volOn}</button>
          <input class="rdv-vol-slider" id="rdvvol-${id}"
            type="range" min="0" max="1" step="0.05" value="1" title="Volume"/>
        </div>

        <!-- Speed -->
        <select class="rdv-speed" id="rdvspd-${id}" title="Playback speed">
          <option value="0.5">0.5×</option>
          <option value="0.75">0.75×</option>
          <option value="1" selected>1×</option>
          <option value="1.25">1.25×</option>
          <option value="1.5">1.5×</option>
          <option value="2">2×</option>
        </select>

        <!-- Captions toggle (only shown when captions exist) -->
        <button class="rdv-btn rdv-cc-btn${captionUrl ? '' : ' rdv-hidden'}"
          id="rdvcc-${id}" title="Captions (C)">${IC.cc}</button>

        <!-- Fullscreen -->
        <button class="rdv-btn" id="rdvfs-${id}" title="Fullscreen (F)">${IC.fs}</button>

      </div>
    </div>
  </div>`;
}

// ── Player controller ─────────────────────────────────────────────────────

function initPlayer(id: string, captionUrl: string): void {
  const wrap    = document.getElementById(`rdvp-${id}`) as HTMLElement;
  const video   = document.getElementById(`rdvv-${id}`) as HTMLVideoElement;
  const playBtn = document.getElementById(`rdvplay-${id}`) as HTMLButtonElement;
  const muteBtn = document.getElementById(`rdvmute-${id}`) as HTMLButtonElement;
  const volEl   = document.getElementById(`rdvvol-${id}`) as HTMLInputElement;
  const fill    = document.getElementById(`rdvfill-${id}`) as HTMLElement;
  const buf     = document.getElementById(`rdvbuf-${id}`) as HTMLElement;
  const timeEl  = document.getElementById(`rdvtime-${id}`) as HTMLElement;
  const bar     = document.getElementById(`rdvbar-${id}`) as HTMLElement;
  const tooltip = document.getElementById(`rdvtip-${id}`) as HTMLElement;
  const fsBtn   = document.getElementById(`rdvfs-${id}`) as HTMLButtonElement;
  const spdSel  = document.getElementById(`rdvspd-${id}`) as HTMLSelectElement;
  const ccBtn   = document.getElementById(`rdvcc-${id}`) as HTMLButtonElement;
  const capEl   = document.getElementById(`rdvcap-${id}`) as HTMLElement;

  if (!wrap || !video) return;

  // ── Play / Pause ──────────────────────────────────────────────────────

  const togglePlay = () => video.paused ? video.play() : video.pause();

  wrap.addEventListener('click', e => {
    if ((e.target as HTMLElement).closest('.rdv-controls')) return;
    togglePlay();
  });
  playBtn.addEventListener('click', e => { e.stopPropagation(); togglePlay(); });

  video.addEventListener('play',  () => { wrap.classList.replace('paused','playing'); playBtn.innerHTML = IC.pause; });
  video.addEventListener('pause', () => { wrap.classList.replace('playing','paused'); playBtn.innerHTML = IC.play; });
  video.addEventListener('ended', () => { wrap.classList.replace('playing','paused'); playBtn.innerHTML = IC.play; });

  // ── Scrub bar ─────────────────────────────────────────────────────────

  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    fill.style.width = `${pct}%`;
    timeEl.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
    updateCaptions(video.currentTime);
  });

  video.addEventListener('progress', () => {
    if (!video.duration || !video.buffered.length) return;
    const pct = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
    buf.style.width = `${pct}%`;
  });

  function seekTo(e: MouseEvent): void {
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * video.duration;
  }

  // Hover tooltip
  bar.addEventListener('mousemove', e => {
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    tooltip.textContent = fmt(pct * (video.duration || 0));
    tooltip.style.left = `${pct * 100}%`;
    tooltip.classList.add('show');
  });
  bar.addEventListener('mouseleave', () => tooltip.classList.remove('show'));

  // Click + drag seek
  let dragging = false;
  bar.addEventListener('mousedown', e => { dragging = true; seekTo(e); });
  document.addEventListener('mousemove', e => { if (dragging) seekTo(e); });
  document.addEventListener('mouseup',   () => { dragging = false; });
  bar.addEventListener('click', seekTo);

  // ── Volume ────────────────────────────────────────────────────────────

  volEl.addEventListener('input', () => {
    video.volume = parseFloat(volEl.value);
    video.muted  = video.volume === 0;
    muteBtn.innerHTML = video.muted ? IC.volOff : IC.volOn;
  });

  muteBtn.addEventListener('click', e => {
    e.stopPropagation();
    video.muted = !video.muted;
    muteBtn.innerHTML = video.muted ? IC.volOff : IC.volOn;
    if (!video.muted) volEl.value = String(video.volume || 1);
  });

  // ── Speed ─────────────────────────────────────────────────────────────

  spdSel.addEventListener('change', e => {
    e.stopPropagation();
    video.playbackRate = parseFloat(spdSel.value);
  });

  // ── Captions ─────────────────────────────────────────────────────────

  let cues: Cue[] = [];
  let captionsOn = true;

  if (captionUrl) {
    fetch(captionUrl)
      .then(r => r.text())
      .then(raw => { cues = parseVTT(raw); })
      .catch(() => { ccBtn.classList.add('rdv-hidden'); });
  }

  function updateCaptions(t: number): void {
    if (!captionsOn || !cues.length) { capEl.textContent = ''; capEl.classList.remove('show'); return; }
    const cue = cues.find(c => t >= c.start && t <= c.end);
    if (cue) { capEl.textContent = cue.text; capEl.classList.add('show'); }
    else     { capEl.textContent = ''; capEl.classList.remove('show'); }
  }

  ccBtn.addEventListener('click', e => {
    e.stopPropagation();
    captionsOn = !captionsOn;
    ccBtn.classList.toggle('rdv-cc-active', captionsOn);
    if (!captionsOn) { capEl.textContent = ''; capEl.classList.remove('show'); }
  });

  // ── Fullscreen ────────────────────────────────────────────────────────

  fsBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (!document.fullscreenElement) { wrap.requestFullscreen?.(); fsBtn.innerHTML = IC.fsExit; }
    else                             { document.exitFullscreen?.(); fsBtn.innerHTML = IC.fs; }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) fsBtn.innerHTML = IC.fs;
  });

  // ── Keyboard shortcuts ────────────────────────────────────────────────

  wrap.addEventListener('keydown', e => {
    switch (e.key) {
      case ' ': case 'k': e.preventDefault(); togglePlay(); break;
      case 'ArrowRight':  e.preventDefault(); video.currentTime = Math.min(video.duration, video.currentTime + 5); break;
      case 'ArrowLeft':   e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 5); break;
      case 'ArrowUp':     e.preventDefault(); video.volume = Math.min(1, video.volume + 0.1); volEl.value = String(video.volume); break;
      case 'ArrowDown':   e.preventDefault(); video.volume = Math.max(0, video.volume - 0.1); volEl.value = String(video.volume); break;
      case 'm': video.muted = !video.muted; muteBtn.innerHTML = video.muted ? IC.volOff : IC.volOn; break;
      case 'c': ccBtn.click(); break;
      case 'f': fsBtn.click(); break;
    }
  });
}

// ── Public API ────────────────────────────────────────────────────────────

export function mountPlayer(lessonId: string, videoUrl: string, captionUrl = ''): void {
  const page  = document.getElementById(`page-${lessonId}`);
  if (!page) return;

  const frame = page.querySelector<HTMLElement>('.video-frame');
  if (!frame) return;

  frame.classList.add('has-video');
  frame.innerHTML = buildHTML(lessonId, videoUrl, captionUrl);

  requestAnimationFrame(() => initPlayer(lessonId, captionUrl));
}

export function exposeGlobals(): void {
  (window as unknown as Record<string, unknown>).mountPlayer = mountPlayer;
}