// ── RoDev Academy — Central Configuration ────────────────────────────────
//
// This is the ONE file you update for day-to-day changes:
//   • New video uploaded → add URL to VIDEO_URLS
//   • New transcript ready → add text to TRANSCRIPTS
//   • Want to lock a lesson → set true in LOCKED_LESSONS
//   • Changed social links → update SITE
//
// ── HOW TO UPLOAD A VIDEO (GitHub Releases) ──────────────────────────────
//   1. Go to your GitHub repo
//   2. Click "Releases" → "Draft a new release"
//   3. Create a tag e.g. v1.0-videos
//   4. Drag your .mp4 file into the assets section
//   5. Publish the release
//   6. Right-click the uploaded file → "Copy link address"
//   7. Paste that URL below as the value for that lesson
//
// Example URL:
//   https://github.com/RoDevVlog/rodev-academy/releases/download/v1.0-videos/lc01.mp4
// ─────────────────────────────────────────────────────────────────────────

// ── SOCIAL & BRANDING ─────────────────────────────────────────────────────

export const SITE = {
  name: 'RoDev Academy',
  tagline: "Build. Don't Just Watch.",
  youtubeChannel: 'https://www.youtube.com/@RoDevAcademy',
  youtubeHandle: '@RoDevAcademy',
  github: 'https://github.com/YOUR_USERNAME/rodev-academy',
  discord: '',
  contact: '',
} as const;

// ── VIDEO URLS ────────────────────────────────────────────────────────────
// Direct .mp4 links — no YouTube, no branding, no tracking.
// Leave as '' until the video file is uploaded.

export const VIDEO_URLS: Record<string, string> = {
  // ── Phase 1 — Studio Basics ──
  'p1-01': '',   // 01. Why You're Here
  'p1-02': '',   // 02. Install Studio
  'p1-03': '',   // 03. First Launch
  'p1-04': '',   // 04. Move Around
  'p1-05': '',   // 05. The 3 Panels
  'p1-06': '',   // 06. Click & Observe
  'p1-07': '',   // 07. Insert a Part
  'p1-08': '',   // 08. Transform Tools
  'p1-09': '',   // 09. Play Your Game
  'p1-10': '',   // 10. What's Actually Happening
  'p1-11': '',   // 11. Hierarchy
  'p1-12': '',   // 12. Make It Yours
  'p1-13': '',   // 13. Fixing Common Problems
  'p1-14': '',   // 14. Save Your Work
  'p1-15': '',   // 15. Mini Build: Stairs
  'p1-16': '',   // 16. Confidence Check
  'p1-17': '',   // 17. What's Next

  // ── Coding Pre-lessons ──
  'lc01': '',   // C01. What is Code?  ← paste GitHub Release URL here
  'lc02': '',   // C02. The Output Window
  'lc03': '',   // C03. Data Types
  'lc04': '',   // C04. Operators
  'lc05': '',   // C05. If / Then / Else

  // ── Lessons ──
  'lesson-1': '',   // C06. Variables & First Script
  'lesson-2': '',   // C07. Loops & Functions
  'lesson-3': '',   // Working Door
  'lesson-4': '',   // Coin Collector

  // ── C08–C12 ──
  'lesson-c08': '',   // C08. Tables & Arrays
  'lesson-c09': '',   // C09. Events & Touched
  'lesson-c10': '',   // C10. Scope
  'lesson-c11': '',   // C11. Strings & Math
  'lesson-c12': '',   // C12. Debugging

  // ── UI Scripting ──
  'ui-01': '',   // U01. ScreenGui & Frames
  'ui-02': '',   // U02. TextButton & Label
  'ui-03': '',   // U03. MouseButton1Click
  'ui-04': '',   // U04. LocalScript vs Script
  'ui-05': '',   // U05. RemoteEvents
};


// ── CAPTION URLS ─────────────────────────────────────────────────────────
// Upload a .vtt WebVTT file alongside each .mp4 in GitHub Releases.
// Leave as '' if no captions yet — the CC button hides automatically.
//
// .vtt format example:
//   WEBVTT
//
//   00:00:01.000 --> 00:00:04.000
//   Welcome to RoDev Academy.
//
//   00:00:05.000 --> 00:00:09.000
//   In this lesson we cover what code actually is.

export const CAPTION_URLS: Record<string, string> = {
  'p1-01': '', 'p1-02': '', 'p1-03': '', 'p1-04': '', 'p1-05': '',
  'p1-06': '', 'p1-07': '', 'p1-08': '', 'p1-09': '', 'p1-10': '',
  'p1-11': '', 'p1-12': '', 'p1-13': '', 'p1-14': '', 'p1-15': '',
  'p1-16': '', 'p1-17': '',
  'lc01': '',   // C01 captions — paste GitHub Release .vtt URL here
  'lc02': '', 'lc03': '', 'lc04': '', 'lc05': '',
  'lesson-1': '', 'lesson-2': '', 'lesson-3': '', 'lesson-4': '',
  'lesson-c08': '', 'lesson-c09': '', 'lesson-c10': '', 'lesson-c11': '', 'lesson-c12': '',
  'ui-01': '', 'ui-02': '', 'ui-03': '', 'ui-04': '', 'ui-05': '',
};

// ── TRANSCRIPTS ───────────────────────────────────────────────────────────

export const TRANSCRIPTS: Record<string, string> = {
  'lc01': '',
  'lc02': '',
  'lc03': '',
  'lc04': '',
  'lc05': '',
  'lesson-1': '',
  'lesson-2': '',
  'lesson-3': '',
  'lesson-4': '',
  'p1-01': '', 'p1-02': '', 'p1-03': '', 'p1-04': '', 'p1-05': '',
  'p1-06': '', 'p1-07': '', 'p1-08': '', 'p1-09': '', 'p1-10': '',
  'p1-11': '', 'p1-12': '', 'p1-13': '', 'p1-14': '', 'p1-15': '',
  'p1-16': '', 'p1-17': '',
};

// ── LESSON LOCKS ──────────────────────────────────────────────────────────

export const LOCKED_LESSONS: Record<string, boolean> = {
  'lesson-5': true,
  'lesson-6': true,
};

// ── CONTENT SAFETY ────────────────────────────────────────────────────────

export const SAFETY = {
  minAge: 10,
  contentRating: 'Everyone 10+',
  noUserContent: true,
  dataCollected: 'none',
  cookiesUsed: false,
} as const;

// ── FEATURE FLAGS ─────────────────────────────────────────────────────────

export const FEATURES = {
  showGithubButton: true,
  showYoutubeButton: true,
  showProgressBar: true,
  luaRunnerEnabled: true,
} as const;