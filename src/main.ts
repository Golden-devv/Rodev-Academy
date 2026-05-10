// ── RoDev Academy — Main Entry Point ─────────────────────────────────────

import { exposeGlobals as exposeNav } from './engine/nav';
import { exposeGlobals as exposeLua } from './engine/luaRunner';
import { exposeGlobals as exposeEditor } from './engine/editor';
import { exposeGlobals as exposeInteractions, injectImages } from './engine/interactions';
import { initRenderer, setVideoUrl } from './engine/renderer';
import { initP1Editor } from './engine/editor';
import { initAuth, exposeGlobals as exposeAuth } from './engine/auth';

// Expose everything globally so inline HTML onclick="" handlers work
exposeNav();
exposeLua();
exposeEditor();
exposeInteractions();
exposeAuth();

// Expose setVideoId so it can be called from the console or a config
(window as unknown as Record<string, unknown>).setVideoId = setVideoUrl;

// Wire up project-01 editor
window.addEventListener('rodev:project01-open', () => initP1Editor());

// Mount all data-driven lesson pages + inject images when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initRenderer();
  injectImages();
  initAuth();
});