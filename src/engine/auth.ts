import emailjs from '@emailjs/browser';

type UserProgress = {
  lastPageId?: string;
  visitedPages: string[];
};

type UserData = {
  name: string;
  email: string;
  password: string;
  progress: UserProgress;
  createdAt: string;
};

const USERS_KEY = 'rodev-users';
const CURRENT_USER_KEY = 'rodev-current-user';

const EMAILJS_SERVICE_ID = 'service_qqg4ghx';
const EMAILJS_TEMPLATE_ID = 'template_inux88h';
const EMAILJS_PUBLIC_KEY = 'S8GW8xEWFzYNxw40K';

function isEmailConfigured(): boolean {
  return EMAILJS_SERVICE_ID !== 'YOUR_SERVICE_ID'
    && EMAILJS_TEMPLATE_ID !== 'YOUR_TEMPLATE_ID'
    && EMAILJS_PUBLIC_KEY !== 'YOUR_PUBLIC_KEY';
}

async function initEmailJS(): Promise<void> {
  if (isEmailConfigured()) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    console.log('EmailJS initialized');
  }
}

async function sendLoginNotification(user: UserData): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn('EmailJS is not configured; login notification not sent.');
    return;
  }

  const templateParams = {
    to_email: user.email,
    user_name: user.name,
    login_time: new Date().toLocaleString(),
  };

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log(`Login notification email sent to ${user.email}`);
  } catch (error) {
    console.error('Failed to send login notification email:', error);
    throw error;
  }
}

function loadUsers(): Record<string, UserData> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) as Record<string, UserData> : {};
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, UserData>): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentEmail(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

function setCurrentEmail(email: string | null): void {
  if (email) localStorage.setItem(CURRENT_USER_KEY, email.toLowerCase());
  else localStorage.removeItem(CURRENT_USER_KEY);
}

function getUserByEmail(email: string): UserData | null {
  const users = loadUsers();
  const key = email.toLowerCase();
  return users[key] ?? null;
}

export function getCurrentUser(): UserData | null {
  const email = getCurrentEmail();
  if (!email) return null;
  return getUserByEmail(email);
}

function prettyPageName(pageId: string): string {
  if (!pageId) return 'Unknown page';
  if (pageId === 'home') return 'Home';
  if (pageId === 'project-01') return 'Project 01';
  if (pageId.startsWith('p1-')) return `Phase 1 · Step ${pageId.slice(4)}`;
  if (pageId.startsWith('lc')) return `Coding Lesson ${pageId.slice(3)}`;
  if (pageId.startsWith('lesson-')) return `Lesson ${pageId.slice(7)}`;
  return pageId.replace(/-/g, ' ');
}

function setMessage(text: string, type: 'error' | 'success' = 'error'): void {
  const el = document.getElementById('auth-message');
  if (!el) return;
  el.textContent = text;
  el.className = `auth-message auth-message-${type}`;
}

export function signUp(name: string, email: string, password: string): { success: boolean; message: string } {
  if (!name.trim() || !email.trim() || !password.trim()) {
    return { success: false, message: 'Please fill in all fields.' };
  }

  const key = email.toLowerCase();
  const users = loadUsers();
  if (users[key]) {
    return { success: false, message: 'An account with that email already exists.' };
  }

  users[key] = {
    name: name.trim(),
    email: key,
    password: password.trim(),
    progress: { visitedPages: [] },
    createdAt: new Date().toISOString(),
  };
  saveUsers(users);
  setCurrentEmail(key);
  return { success: true, message: `Account created and signed in as ${key}.` };
}

export function signIn(email: string, password: string): { success: boolean; message: string } {
  if (!email.trim() || !password.trim()) {
    return { success: false, message: 'Please fill in both email and password.' };
  }

  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return { success: false, message: 'Email or password is incorrect.' };
  }

  setCurrentEmail(user.email);
  return { success: true, message: `Successfully logged in as ${user.email}.` };
}

export function logout(): void {
  setCurrentEmail(null);
  renderAuthState();
  closeAuthModal();
}

function getPageIdFromSidebarItem(item: HTMLElement): string | null {
  const onclick = item.getAttribute('onclick') ?? '';
  const match = onclick.match(/^nav\('(.+?)',this\)$/);
  return match ? match[1] : null;
}

function applyProgressMarkers(): void {
  const user = getCurrentUser();
  const visited = user?.progress?.visitedPages ?? [];
  document.querySelectorAll<HTMLElement>('.sb-item').forEach(item => {
    const pageId = getPageIdFromSidebarItem(item);
    if (!pageId) return;
    item.classList.toggle('done', visited.includes(pageId));
  });
}

export function setCurrentPage(pageId: string): void {
  const email = getCurrentEmail();
  if (!email) return;

  const users = loadUsers();
  const user = users[email.toLowerCase()];
  if (!user) return;

  if (!user.progress) user.progress = { visitedPages: [] };
  user.progress.lastPageId = pageId;
  if (!user.progress.visitedPages.includes(pageId)) {
    user.progress.visitedPages.push(pageId);
  }
  while (user.progress.visitedPages.length > 50) {
    user.progress.visitedPages.shift();
  }

  users[email.toLowerCase()] = user;
  saveUsers(users);
  renderAuthState();
}

export function continueLearning(): void {
  const user = getCurrentUser();
  if (!user?.progress?.lastPageId) return;

  const pageId = user.progress.lastPageId;
  if ((window as any).nav && pageId) {
    (window as any).nav(pageId, null);
  }
}

export function openAuthModal(tab: 'signin' | 'signup' = 'signin', message: string = '', type: 'error' | 'success' = 'error'): void {
  const overlay = document.getElementById('auth-modal');
  if (!overlay) return;

  overlay.classList.add('open');
  switchAuthTab(tab);
  setMessage(message, type);
}

export function closeAuthModal(): void {
  const overlay = document.getElementById('auth-modal');
  if (!overlay) return;
  overlay.classList.remove('open');
}

export function switchAuthTab(tab: 'signin' | 'signup'): void {
  const signinTab = document.getElementById('auth-tab-signin');
  const signupTab = document.getElementById('auth-tab-signup');
  const signinForm = document.getElementById('signin-form');
  const signupForm = document.getElementById('signup-form');

  if (signinTab) signinTab.classList.toggle('active', tab === 'signin');
  if (signupTab) signupTab.classList.toggle('active', tab === 'signup');
  if (signinForm) signinForm.classList.toggle('hidden', tab !== 'signin');
  if (signupForm) signupForm.classList.toggle('hidden', tab !== 'signup');
}

function attachFormListeners(): void {
  const signinForm = document.getElementById('signin-form') as HTMLFormElement | null;
  const signupForm = document.getElementById('signup-form') as HTMLFormElement | null;

  if (signinForm) {
    signinForm.addEventListener('submit', event => {
      event.preventDefault();
      const formData = new FormData(signinForm);
      const email = String(formData.get('email') ?? '');
      const password = String(formData.get('password') ?? '');
      const result = signIn(email, password);
      setMessage(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          sendLoginNotification(currentUser)
            .then(() => {
              setMessage(`Successfully logged in as ${currentUser.email}. Notification email request sent.`, 'success');
            })
            .catch(() => {
              setMessage(`Successfully logged in as ${currentUser.email}. Email notification failed to send.`, 'success');
            });
        }
        renderAuthState();
        setTimeout(() => closeAuthModal(), 800);
      }
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', event => {
      event.preventDefault();
      const formData = new FormData(signupForm);
      const name = String(formData.get('name') ?? '');
      const email = String(formData.get('email') ?? '');
      const password = String(formData.get('password') ?? '');
      const result = signUp(name, email, password);
      setMessage(result.message, result.success ? 'success' : 'error');
      if (result.success) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          sendLoginNotification(currentUser)
            .then(() => {
              setMessage(`Account created and signed in as ${currentUser.email}. Notification email request sent.`, 'success');
            })
            .catch(() => {
              setMessage(`Account created and signed in as ${currentUser.email}. Email notification failed to send.`, 'success');
            });
        }
        renderAuthState();
        setTimeout(() => closeAuthModal(), 800);
      }
    });
  }
}

function attachUiHandlers(): void {
  const actionBtn = document.getElementById('auth-action-btn');
  if (actionBtn) {
    actionBtn.addEventListener('click', () => {
      const user = getCurrentUser();
      if (user) {
        logout();
      } else {
        openAuthModal('signin');
      }
    });
  }

  const overlay = document.getElementById('auth-modal');
  if (overlay) {
    overlay.addEventListener('click', event => {
      if (event.target === overlay) closeAuthModal();
    });
  }

  const closeBtn = document.getElementById('auth-modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeAuthModal);
  }

  const signinTab = document.getElementById('auth-tab-signin');
  const signupTab = document.getElementById('auth-tab-signup');
  if (signinTab) signinTab.addEventListener('click', () => switchAuthTab('signin'));
  if (signupTab) signupTab.addEventListener('click', () => switchAuthTab('signup'));
}

function renderAuthState(): void {
  const statusEl = document.getElementById('auth-status');
  const actionBtn = document.getElementById('auth-action-btn');
  const continueBox = document.getElementById('home-continue');
  const continueLabel = document.getElementById('home-continue-label');

  const user = getCurrentUser();
  const hasProgress = !!user?.progress?.lastPageId;

  if (statusEl) {
    statusEl.textContent = user ? `Hi, ${user.name}` : 'Guest';
  }

  if (actionBtn) {
    actionBtn.textContent = user ? 'Logout' : 'Sign in';
    actionBtn.classList.toggle('auth-btn-logout', !!user);
  }

  if (continueBox) {
    if (user && hasProgress && user.progress.lastPageId !== 'home') {
      continueBox.style.display = 'block';
      if (continueLabel) continueLabel.textContent = `Continue where you left off: ${prettyPageName(user.progress.lastPageId!)}`;
    } else {
      continueBox.style.display = 'none';
    }
  }

  applyProgressMarkers();
}

export function initAuth(): void {
  initEmailJS();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      attachFormListeners();
      attachUiHandlers();
      renderAuthState();
    });
  } else {
    attachFormListeners();
    attachUiHandlers();
    renderAuthState();
  }
}

export function exposeGlobals(): void {
  (window as unknown as Record<string, unknown>).openAuthModal = openAuthModal;
  (window as unknown as Record<string, unknown>).closeAuthModal = closeAuthModal;
  (window as unknown as Record<string, unknown>).switchAuthTab = switchAuthTab;
  (window as unknown as Record<string, unknown>).continueLearning = continueLearning;
  (window as unknown as Record<string, unknown>).logout = logout;
}
