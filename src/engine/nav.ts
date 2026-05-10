// ── Navigation, sidebar, search, phase toggles ───────────────────────────
import { getCurrentUser, openAuthModal, setCurrentPage } from './auth';

function getSidebarItemByPageId(id: string): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>('.sb-item')).find(item => {
    return item.getAttribute('onclick') === `nav('${id}',this)`;
  }) ?? null;
}

/** Navigate to a page by ID, optionally activating a sidebar element */
export function nav(id: string, sbEl: Element | null = null): void {
  const user = getCurrentUser();
  if (id.startsWith('p1-') && !user) {
    openAuthModal('signin', 'Sign in to start the Beginner course.', 'error');
    return;
  }

  // Hide all pages
  document.querySelectorAll<HTMLElement>('.lesson-page').forEach(p => p.classList.remove('active'));
  // Deactivate all sidebar items
  document.querySelectorAll<HTMLElement>('.sb-item, .sb-home').forEach(i => i.classList.remove('active'));

  // Show target page
  const page = document.getElementById(`page-${id}`);
  if (page) page.classList.add('active');

  // Activate sidebar item
  const targetSidebarItem = sbEl ?? getSidebarItemByPageId(id);
  if (targetSidebarItem) targetSidebarItem.classList.add('active');
  if (id === 'home') document.getElementById('sb-home')?.classList.add('active');

  // Scroll main to top
  document.getElementById('main')?.scrollTo(0, 0);

  // Close mobile sidebar
  document.getElementById('sidebar')?.classList.remove('mobile-open');

  // Update breadcrumb
  const label = id === 'home' ? 'Home' : id;
  const bc = document.getElementById('bc-cur');
  if (bc) bc.textContent = label;

  // Save progress for signed-in users
  setCurrentPage(id);

  // Notify project editor if navigating to project-01
  if (id === 'project-01') {
    window.dispatchEvent(new CustomEvent('rodev:project01-open'));
  }
}

/** Alias so legacy onclick="showPage('x')" still works */
export function showPage(id: string): void {
  nav(id, null);
}

/** Open the beginner course and jump to the first lesson */
export function openBeginnerCourse(): void {
  document.getElementById('phase-beginner')?.classList.add('open');
  document.getElementById('phase-basics')?.classList.add('open');
  const firstLesson = document.querySelector<HTMLElement>(".sb-item[onclick='nav(\'p1-01\',this)']");
  nav('p1-01', firstLesson);
}

/** Navigate to a Phase-1 step by number */
export function navP1(step: number): void {
  nav('p1-' + String(step).padStart(2, '0'), null);
}

/** Navigate to a Lua Coding lesson by number (lc01 … lc07) */
export function navLC(step: number): void {
  nav('lc0' + step, null);
}

/** Toggle a sidebar phase open/closed */
export function togglePhase(id: string): void {
  document.getElementById(id)?.classList.toggle('open');
}

/** Filter sidebar items by search query */
export function sbSearch(q: string): void {
  const query = q.toLowerCase().trim();
  document.querySelectorAll<HTMLElement>('.sb-item').forEach(item => {
    if (!query) { item.style.display = ''; return; }
    item.style.display = item.textContent?.toLowerCase().includes(query) ? '' : 'none';
  });
  // Open all phases when searching
  if (query) document.querySelectorAll('.sb-phase').forEach(p => p.classList.add('open'));
}

/** Mobile sidebar toggle button handler */
export function toggleMobileSidebar(): void {
  document.getElementById('sidebar')?.classList.toggle('mobile-open');
}

/** Expose functions globally so inline HTML onclick handlers can still call them */
export function exposeGlobals(): void {
  (window as unknown as Record<string, unknown>).nav = nav;
  (window as unknown as Record<string, unknown>).showPage = showPage;
  (window as unknown as Record<string, unknown>).openBeginnerCourse = openBeginnerCourse;
  (window as unknown as Record<string, unknown>).navP1 = navP1;
  (window as unknown as Record<string, unknown>).navLC = navLC;
  (window as unknown as Record<string, unknown>).togglePhase = togglePhase;
  (window as unknown as Record<string, unknown>).sbSearch = sbSearch;
  (window as unknown as Record<string, unknown>).toggleMobileSidebar = toggleMobileSidebar;
}
