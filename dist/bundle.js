// node_modules/@emailjs/browser/es/models/EmailJSResponseStatus.js
var EmailJSResponseStatus = class {
  constructor(_status = 0, _text = "Network Error") {
    this.status = _status;
    this.text = _text;
  }
};

// node_modules/@emailjs/browser/es/utils/createWebStorage/createWebStorage.js
var createWebStorage = () => {
  if (typeof localStorage === "undefined")
    return;
  return {
    get: (key) => Promise.resolve(localStorage.getItem(key)),
    set: (key, value) => Promise.resolve(localStorage.setItem(key, value)),
    remove: (key) => Promise.resolve(localStorage.removeItem(key))
  };
};

// node_modules/@emailjs/browser/es/store/store.js
var store = {
  origin: "https://api.emailjs.com",
  blockHeadless: false,
  storageProvider: createWebStorage()
};

// node_modules/@emailjs/browser/es/utils/buildOptions/buildOptions.js
var buildOptions = (options) => {
  if (!options)
    return {};
  if (typeof options === "string") {
    return {
      publicKey: options
    };
  }
  if (options.toString() === "[object Object]") {
    return options;
  }
  return {};
};

// node_modules/@emailjs/browser/es/methods/init/init.js
var init = (options, origin = "https://api.emailjs.com") => {
  if (!options)
    return;
  const opts = buildOptions(options);
  store.publicKey = opts.publicKey;
  store.blockHeadless = opts.blockHeadless;
  store.storageProvider = opts.storageProvider;
  store.blockList = opts.blockList;
  store.limitRate = opts.limitRate;
  store.origin = opts.origin || origin;
};

// node_modules/@emailjs/browser/es/api/sendPost.js
var sendPost = async (url, data, headers = {}) => {
  const response = await fetch(store.origin + url, {
    method: "POST",
    headers,
    body: data
  });
  const message = await response.text();
  const responseStatus = new EmailJSResponseStatus(response.status, message);
  if (response.ok) {
    return responseStatus;
  }
  throw responseStatus;
};

// node_modules/@emailjs/browser/es/utils/validateParams/validateParams.js
var validateParams = (publicKey, serviceID, templateID) => {
  if (!publicKey || typeof publicKey !== "string") {
    throw "The public key is required. Visit https://dashboard.emailjs.com/admin/account";
  }
  if (!serviceID || typeof serviceID !== "string") {
    throw "The service ID is required. Visit https://dashboard.emailjs.com/admin";
  }
  if (!templateID || typeof templateID !== "string") {
    throw "The template ID is required. Visit https://dashboard.emailjs.com/admin/templates";
  }
};

// node_modules/@emailjs/browser/es/utils/validateTemplateParams/validateTemplateParams.js
var validateTemplateParams = (templateParams) => {
  if (templateParams && templateParams.toString() !== "[object Object]") {
    throw "The template params have to be the object. Visit https://www.emailjs.com/docs/sdk/send/";
  }
};

// node_modules/@emailjs/browser/es/utils/isHeadless/isHeadless.js
var isHeadless = (navigator2) => {
  return navigator2.webdriver || !navigator2.languages || navigator2.languages.length === 0;
};

// node_modules/@emailjs/browser/es/errors/headlessError/headlessError.js
var headlessError = () => {
  return new EmailJSResponseStatus(451, "Unavailable For Headless Browser");
};

// node_modules/@emailjs/browser/es/utils/validateBlockListParams/validateBlockListParams.js
var validateBlockListParams = (list, watchVariable) => {
  if (!Array.isArray(list)) {
    throw "The BlockList list has to be an array";
  }
  if (typeof watchVariable !== "string") {
    throw "The BlockList watchVariable has to be a string";
  }
};

// node_modules/@emailjs/browser/es/utils/isBlockedValueInParams/isBlockedValueInParams.js
var isBlockListDisabled = (options) => {
  return !options.list?.length || !options.watchVariable;
};
var getValue = (data, name) => {
  return data instanceof FormData ? data.get(name) : data[name];
};
var isBlockedValueInParams = (options, params) => {
  if (isBlockListDisabled(options))
    return false;
  validateBlockListParams(options.list, options.watchVariable);
  const value = getValue(params, options.watchVariable);
  if (typeof value !== "string")
    return false;
  return options.list.includes(value);
};

// node_modules/@emailjs/browser/es/errors/blockedEmailError/blockedEmailError.js
var blockedEmailError = () => {
  return new EmailJSResponseStatus(403, "Forbidden");
};

// node_modules/@emailjs/browser/es/utils/validateLimitRateParams/validateLimitRateParams.js
var validateLimitRateParams = (throttle, id) => {
  if (typeof throttle !== "number" || throttle < 0) {
    throw "The LimitRate throttle has to be a positive number";
  }
  if (id && typeof id !== "string") {
    throw "The LimitRate ID has to be a non-empty string";
  }
};

// node_modules/@emailjs/browser/es/utils/isLimitRateHit/isLimitRateHit.js
var getLeftTime = async (id, throttle, storage) => {
  const lastTime = Number(await storage.get(id) || 0);
  return throttle - Date.now() + lastTime;
};
var isLimitRateHit = async (defaultID, options, storage) => {
  if (!options.throttle || !storage) {
    return false;
  }
  validateLimitRateParams(options.throttle, options.id);
  const id = options.id || defaultID;
  const leftTime = await getLeftTime(id, options.throttle, storage);
  if (leftTime > 0) {
    return true;
  }
  await storage.set(id, Date.now().toString());
  return false;
};

// node_modules/@emailjs/browser/es/errors/limitRateError/limitRateError.js
var limitRateError = () => {
  return new EmailJSResponseStatus(429, "Too Many Requests");
};

// node_modules/@emailjs/browser/es/methods/send/send.js
var send = async (serviceID, templateID, templateParams, options) => {
  const opts = buildOptions(options);
  const publicKey = opts.publicKey || store.publicKey;
  const blockHeadless = opts.blockHeadless || store.blockHeadless;
  const storageProvider = opts.storageProvider || store.storageProvider;
  const blockList = { ...store.blockList, ...opts.blockList };
  const limitRate = { ...store.limitRate, ...opts.limitRate };
  if (blockHeadless && isHeadless(navigator)) {
    return Promise.reject(headlessError());
  }
  validateParams(publicKey, serviceID, templateID);
  validateTemplateParams(templateParams);
  if (templateParams && isBlockedValueInParams(blockList, templateParams)) {
    return Promise.reject(blockedEmailError());
  }
  if (await isLimitRateHit(location.pathname, limitRate, storageProvider)) {
    return Promise.reject(limitRateError());
  }
  const params = {
    lib_version: "4.4.1",
    user_id: publicKey,
    service_id: serviceID,
    template_id: templateID,
    template_params: templateParams
  };
  return sendPost("/api/v1.0/email/send", JSON.stringify(params), {
    "Content-type": "application/json"
  });
};

// node_modules/@emailjs/browser/es/utils/validateForm/validateForm.js
var validateForm = (form) => {
  if (!form || form.nodeName !== "FORM") {
    throw "The 3rd parameter is expected to be the HTML form element or the style selector of the form";
  }
};

// node_modules/@emailjs/browser/es/methods/sendForm/sendForm.js
var findHTMLForm = (form) => {
  return typeof form === "string" ? document.querySelector(form) : form;
};
var sendForm = async (serviceID, templateID, form, options) => {
  const opts = buildOptions(options);
  const publicKey = opts.publicKey || store.publicKey;
  const blockHeadless = opts.blockHeadless || store.blockHeadless;
  const storageProvider = store.storageProvider || opts.storageProvider;
  const blockList = { ...store.blockList, ...opts.blockList };
  const limitRate = { ...store.limitRate, ...opts.limitRate };
  if (blockHeadless && isHeadless(navigator)) {
    return Promise.reject(headlessError());
  }
  const currentForm = findHTMLForm(form);
  validateParams(publicKey, serviceID, templateID);
  validateForm(currentForm);
  const formData = new FormData(currentForm);
  if (isBlockedValueInParams(blockList, formData)) {
    return Promise.reject(blockedEmailError());
  }
  if (await isLimitRateHit(location.pathname, limitRate, storageProvider)) {
    return Promise.reject(limitRateError());
  }
  formData.append("lib_version", "4.4.1");
  formData.append("service_id", serviceID);
  formData.append("template_id", templateID);
  formData.append("user_id", publicKey);
  return sendPost("/api/v1.0/email/send-form", formData);
};

// node_modules/@emailjs/browser/es/index.js
var es_default = {
  init,
  send,
  sendForm,
  EmailJSResponseStatus
};

// src/engine/auth.ts
var USERS_KEY = "rodev-users";
var CURRENT_USER_KEY = "rodev-current-user";
var EMAILJS_SERVICE_ID = "service_qqg4ghx";
var EMAILJS_TEMPLATE_ID = "template_inux88h";
var EMAILJS_PUBLIC_KEY = "S8GW8xEWFzYNxw40K";
function isEmailConfigured() {
  return EMAILJS_SERVICE_ID !== "YOUR_SERVICE_ID" && EMAILJS_TEMPLATE_ID !== "YOUR_TEMPLATE_ID" && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY";
}
async function initEmailJS() {
  if (isEmailConfigured()) {
    es_default.init({ publicKey: EMAILJS_PUBLIC_KEY });
    console.log("EmailJS initialized");
  }
}
async function sendLoginNotification(user) {
  if (!isEmailConfigured()) {
    console.warn("EmailJS is not configured; login notification not sent.");
    return;
  }
  const templateParams = {
    to_email: user.email,
    user_name: user.name,
    login_time: (/* @__PURE__ */ new Date()).toLocaleString()
  };
  try {
    await es_default.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
    console.log(`Login notification email sent to ${user.email}`);
  } catch (error) {
    console.error("Failed to send login notification email:", error);
    throw error;
  }
}
function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function getCurrentEmail() {
  return localStorage.getItem(CURRENT_USER_KEY);
}
function setCurrentEmail(email) {
  if (email) localStorage.setItem(CURRENT_USER_KEY, email.toLowerCase());
  else localStorage.removeItem(CURRENT_USER_KEY);
}
function getUserByEmail(email) {
  const users = loadUsers();
  const key = email.toLowerCase();
  return users[key] ?? null;
}
function getCurrentUser() {
  const email = getCurrentEmail();
  if (!email) return null;
  return getUserByEmail(email);
}
function prettyPageName(pageId) {
  if (!pageId) return "Unknown page";
  if (pageId === "home") return "Home";
  if (pageId === "project-01") return "Project 01";
  if (pageId.startsWith("p1-")) return `Phase 1 \xB7 Step ${pageId.slice(4)}`;
  if (pageId.startsWith("lc")) return `Coding Lesson ${pageId.slice(3)}`;
  if (pageId.startsWith("lesson-")) return `Lesson ${pageId.slice(7)}`;
  return pageId.replace(/-/g, " ");
}
function setMessage(text, type = "error") {
  const el = document.getElementById("auth-message");
  if (!el) return;
  el.textContent = text;
  el.className = `auth-message auth-message-${type}`;
}
function signUp(name, email, password) {
  if (!name.trim() || !email.trim() || !password.trim()) {
    return { success: false, message: "Please fill in all fields." };
  }
  const key = email.toLowerCase();
  const users = loadUsers();
  if (users[key]) {
    return { success: false, message: "An account with that email already exists." };
  }
  users[key] = {
    name: name.trim(),
    email: key,
    password: password.trim(),
    progress: { visitedPages: [] },
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveUsers(users);
  setCurrentEmail(key);
  return { success: true, message: `Account created and signed in as ${key}.` };
}
function signIn(email, password) {
  if (!email.trim() || !password.trim()) {
    return { success: false, message: "Please fill in both email and password." };
  }
  const user = getUserByEmail(email);
  if (!user || user.password !== password) {
    return { success: false, message: "Email or password is incorrect." };
  }
  setCurrentEmail(user.email);
  return { success: true, message: `Successfully logged in as ${user.email}.` };
}
function logout() {
  setCurrentEmail(null);
  renderAuthState();
  closeAuthModal();
}
function getPageIdFromSidebarItem(item) {
  const onclick = item.getAttribute("onclick") ?? "";
  const match = onclick.match(/^nav\('(.+?)',this\)$/);
  return match ? match[1] : null;
}
function applyProgressMarkers() {
  const user = getCurrentUser();
  const visited = user?.progress?.visitedPages ?? [];
  document.querySelectorAll(".sb-item").forEach((item) => {
    const pageId = getPageIdFromSidebarItem(item);
    if (!pageId) return;
    item.classList.toggle("done", visited.includes(pageId));
  });
}
function setCurrentPage(pageId) {
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
function continueLearning() {
  const user = getCurrentUser();
  if (!user?.progress?.lastPageId) return;
  const pageId = user.progress.lastPageId;
  if (window.nav && pageId) {
    window.nav(pageId, null);
  }
}
function openAuthModal(tab = "signin", message = "", type = "error") {
  const overlay = document.getElementById("auth-modal");
  if (!overlay) return;
  overlay.classList.add("open");
  switchAuthTab(tab);
  setMessage(message, type);
}
function closeAuthModal() {
  const overlay = document.getElementById("auth-modal");
  if (!overlay) return;
  overlay.classList.remove("open");
}
function switchAuthTab(tab) {
  const signinTab = document.getElementById("auth-tab-signin");
  const signupTab = document.getElementById("auth-tab-signup");
  const signinForm = document.getElementById("signin-form");
  const signupForm = document.getElementById("signup-form");
  if (signinTab) signinTab.classList.toggle("active", tab === "signin");
  if (signupTab) signupTab.classList.toggle("active", tab === "signup");
  if (signinForm) signinForm.classList.toggle("hidden", tab !== "signin");
  if (signupForm) signupForm.classList.toggle("hidden", tab !== "signup");
}
function attachFormListeners() {
  const signinForm = document.getElementById("signin-form");
  const signupForm = document.getElementById("signup-form");
  if (signinForm) {
    signinForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(signinForm);
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");
      const result = signIn(email, password);
      setMessage(result.message, result.success ? "success" : "error");
      if (result.success) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          sendLoginNotification(currentUser).then(() => {
            setMessage(`Successfully logged in as ${currentUser.email}. Notification email request sent.`, "success");
          }).catch(() => {
            setMessage(`Successfully logged in as ${currentUser.email}. Email notification failed to send.`, "success");
          });
        }
        renderAuthState();
        setTimeout(() => closeAuthModal(), 800);
      }
    });
  }
  if (signupForm) {
    signupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(signupForm);
      const name = String(formData.get("name") ?? "");
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");
      const result = signUp(name, email, password);
      setMessage(result.message, result.success ? "success" : "error");
      if (result.success) {
        const currentUser = getCurrentUser();
        if (currentUser) {
          sendLoginNotification(currentUser).then(() => {
            setMessage(`Account created and signed in as ${currentUser.email}. Notification email request sent.`, "success");
          }).catch(() => {
            setMessage(`Account created and signed in as ${currentUser.email}. Email notification failed to send.`, "success");
          });
        }
        renderAuthState();
        setTimeout(() => closeAuthModal(), 800);
      }
    });
  }
}
function attachUiHandlers() {
  const actionBtn = document.getElementById("auth-action-btn");
  if (actionBtn) {
    actionBtn.addEventListener("click", () => {
      const user = getCurrentUser();
      if (user) {
        logout();
      } else {
        openAuthModal("signin");
      }
    });
  }
  const overlay = document.getElementById("auth-modal");
  if (overlay) {
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) closeAuthModal();
    });
  }
  const closeBtn = document.getElementById("auth-modal-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeAuthModal);
  }
  const signinTab = document.getElementById("auth-tab-signin");
  const signupTab = document.getElementById("auth-tab-signup");
  if (signinTab) signinTab.addEventListener("click", () => switchAuthTab("signin"));
  if (signupTab) signupTab.addEventListener("click", () => switchAuthTab("signup"));
}
function renderAuthState() {
  const statusEl = document.getElementById("auth-status");
  const actionBtn = document.getElementById("auth-action-btn");
  const continueBox = document.getElementById("home-continue");
  const continueLabel = document.getElementById("home-continue-label");
  const user = getCurrentUser();
  const hasProgress = !!user?.progress?.lastPageId;
  if (statusEl) {
    statusEl.textContent = user ? `Hi, ${user.name}` : "Guest";
  }
  if (actionBtn) {
    actionBtn.textContent = user ? "Logout" : "Sign in";
    actionBtn.classList.toggle("auth-btn-logout", !!user);
  }
  if (continueBox) {
    if (user && hasProgress && user.progress.lastPageId !== "home") {
      continueBox.style.display = "block";
      if (continueLabel) continueLabel.textContent = `Continue where you left off: ${prettyPageName(user.progress.lastPageId)}`;
    } else {
      continueBox.style.display = "none";
    }
  }
  applyProgressMarkers();
}
function initAuth() {
  initEmailJS();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
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
function exposeGlobals() {
  window.openAuthModal = openAuthModal;
  window.closeAuthModal = closeAuthModal;
  window.switchAuthTab = switchAuthTab;
  window.continueLearning = continueLearning;
  window.logout = logout;
}

// src/engine/nav.ts
function getSidebarItemByPageId(id) {
  return Array.from(document.querySelectorAll(".sb-item")).find((item) => {
    return item.getAttribute("onclick") === `nav('${id}',this)`;
  }) ?? null;
}
function nav(id, sbEl = null) {
  const user = getCurrentUser();
  if (id.startsWith("p1-") && !user) {
    openAuthModal("signin", "Sign in to start the Beginner course.", "error");
    return;
  }
  document.querySelectorAll(".lesson-page").forEach((p) => p.classList.remove("active"));
  document.querySelectorAll(".sb-item, .sb-home").forEach((i) => i.classList.remove("active"));
  const page = document.getElementById(`page-${id}`);
  if (page) page.classList.add("active");
  const targetSidebarItem = sbEl ?? getSidebarItemByPageId(id);
  if (targetSidebarItem) targetSidebarItem.classList.add("active");
  if (id === "home") document.getElementById("sb-home")?.classList.add("active");
  document.getElementById("main")?.scrollTo(0, 0);
  document.getElementById("sidebar")?.classList.remove("mobile-open");
  const label = id === "home" ? "Home" : id;
  const bc = document.getElementById("bc-cur");
  if (bc) bc.textContent = label;
  setCurrentPage(id);
  if (id === "project-01") {
    window.dispatchEvent(new CustomEvent("rodev:project01-open"));
  }
}
function showPage(id) {
  nav(id, null);
}
function openBeginnerCourse() {
  document.getElementById("phase-beginner")?.classList.add("open");
  document.getElementById("phase-basics")?.classList.add("open");
  const firstLesson = document.querySelector(".sb-item[onclick='nav('p1-01',this)']");
  nav("p1-01", firstLesson);
}
function navP1(step) {
  nav("p1-" + String(step).padStart(2, "0"), null);
}
function navLC(step) {
  nav("lc0" + step, null);
}
function togglePhase(id) {
  document.getElementById(id)?.classList.toggle("open");
}
function sbSearch(q) {
  const query = q.toLowerCase().trim();
  document.querySelectorAll(".sb-item").forEach((item) => {
    if (!query) {
      item.style.display = "";
      return;
    }
    item.style.display = item.textContent?.toLowerCase().includes(query) ? "" : "none";
  });
  if (query) document.querySelectorAll(".sb-phase").forEach((p) => p.classList.add("open"));
}
function toggleMobileSidebar() {
  document.getElementById("sidebar")?.classList.toggle("mobile-open");
}
function exposeGlobals2() {
  window.nav = nav;
  window.showPage = showPage;
  window.openBeginnerCourse = openBeginnerCourse;
  window.navP1 = navP1;
  window.navLC = navLC;
  window.togglePhase = togglePhase;
  window.sbSearch = sbSearch;
  window.toggleMobileSidebar = toggleMobileSidebar;
}

// src/engine/luaRunner.ts
function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function runLua(editorId, outputId, btnId) {
  const code = document.getElementById(editorId)?.value ?? "";
  const out = document.getElementById(outputId);
  const btn = document.getElementById(btnId);
  if (!out) return;
  if (!code.trim()) {
    out.innerHTML = '<span class="out-error">Nothing to run.</span>';
    return;
  }
  out.innerHTML = "";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Running\u2026";
  }
  const lines = [];
  setTimeout(() => {
    try {
      const L = fengari.lauxlib.luaL_newstate();
      fengari.lualib.luaL_openlibs(L);
      fengari.lua.lua_pushcfunction(L, (luaState) => {
        const n = fengari.lua.lua_gettop(luaState);
        const parts = [];
        for (let i = 1; i <= n; i++) {
          const t = fengari.lua.lua_type(luaState, i);
          if (t === fengari.lua.LUA_TSTRING) parts.push(fengari.lua.lua_tojsstring(luaState, i));
          else if (t === fengari.lua.LUA_TNUMBER) parts.push(String(fengari.lua.lua_tonumber(luaState, i)));
          else if (t === fengari.lua.LUA_TBOOLEAN) parts.push(fengari.lua.lua_toboolean(luaState, i) ? "true" : "false");
          else if (t === fengari.lua.LUA_TNIL) parts.push("nil");
          else parts.push(fengari.lua.luaL_tolstring(luaState, i, null));
        }
        lines.push(parts.join("	"));
        return 0;
      });
      fengari.lua.lua_setglobal(L, fengari.to_luastring("print"));
      const status = fengari.lauxlib.luaL_dostring(L, fengari.to_luastring(code));
      if (status !== fengari.lua.LUA_OK) {
        const errMsg = fengari.lua.lua_tojsstring(L, -1);
        out.innerHTML = `<span class="out-error">Error: ${escapeHtml(errMsg)}</span>`;
      } else {
        out.innerHTML = lines.length === 0 ? '<span class="empty">\u2014 no output (add print() calls to see results) \u2014</span>' : lines.map((l) => `<span class="out-line">${escapeHtml(String(l))}</span>`).join("\n");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      out.innerHTML = `<span class="out-error">Runner error: ${escapeHtml(msg)}</span>`;
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = "\u25B6 Run";
    }
  }, 10);
}
function runLuaCheck(editorId, outputId, btnId, checkFn) {
  const code = document.getElementById(editorId)?.value ?? "";
  const out = document.getElementById(outputId);
  const btn = document.getElementById(btnId);
  if (!out) return;
  if (!code.trim()) {
    out.innerHTML = '<span class="out-error">Nothing to run.</span>';
    return;
  }
  out.innerHTML = "";
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Running\u2026";
  }
  const lines = [];
  setTimeout(() => {
    try {
      const L = fengari.lauxlib.luaL_newstate();
      fengari.lualib.luaL_openlibs(L);
      fengari.lua.lua_pushcfunction(L, (luaState) => {
        const n = fengari.lua.lua_gettop(luaState);
        const parts = [];
        for (let i = 1; i <= n; i++) {
          const t = fengari.lua.lua_type(luaState, i);
          if (t === fengari.lua.LUA_TSTRING) parts.push(fengari.lua.lua_tojsstring(luaState, i));
          else if (t === fengari.lua.LUA_TNUMBER) parts.push(String(fengari.lua.lua_tonumber(luaState, i)));
          else if (t === fengari.lua.LUA_TBOOLEAN) parts.push(fengari.lua.lua_toboolean(luaState, i) ? "true" : "false");
          else if (t === fengari.lua.LUA_TNIL) parts.push("nil");
          else parts.push(fengari.lua.luaL_tolstring(luaState, i, null));
        }
        lines.push(parts.join("	"));
        return 0;
      });
      fengari.lua.lua_setglobal(L, fengari.to_luastring("print"));
      const status = fengari.lauxlib.luaL_dostring(L, fengari.to_luastring(code));
      if (status !== fengari.lua.LUA_OK) {
        const errMsg = fengari.lua.lua_tojsstring(L, -1);
        out.innerHTML = `<span class="out-error">\u274C Error: ${escapeHtml(errMsg)}</span>`;
      } else {
        out.classList.remove("empty");
        if (lines.length === 0) {
          out.innerHTML = '<span class="empty">\u2014 no output (add print() calls) \u2014</span>';
        } else {
          const feedback = checkFn ? checkFn(lines, code) : null;
          out.innerHTML = lines.map((l) => `<span class="out-line">${escapeHtml(String(l))}</span>`).join("\n");
          if (feedback) {
            const color = feedback.pass ? "var(--green)" : "var(--amber)";
            const text = feedback.pass ? "\u2713 Correct!" : `\u26A0 ${escapeHtml(feedback.msg ?? "")}`;
            out.innerHTML += `
<span class="out-line" style="margin-top:6px;display:block;padding:5px 0;border-top:1px solid var(--line);color:${color}">${text}</span>`;
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      out.innerHTML = `<span class="out-error">Runner error: ${escapeHtml(msg)}</span>`;
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = "\u25B6 Run";
    }
  }, 10);
}
function showHint(id) {
  document.getElementById(id)?.classList.toggle("show");
}
function checkP01B1(lines) {
  if (lines.some((l) => l.trim() === "0")) return { pass: true };
  if (lines.length === 0) return { pass: false, msg: "Add print(coins) to see the output." };
  return { pass: false, msg: "Expected output: 0 \u2014 make sure you set coins = 0 and print it." };
}
function checkP01B2(lines) {
  const expected = ["Coins: 1", "Coins: 2", "Coins: 3"];
  const match = expected.every((e, i) => lines[i]?.trim() === e);
  if (match) return { pass: true };
  if (lines.length === 0) return { pass: false, msg: 'Nothing printed. Add coins = coins + 1 and print("Coins: " .. coins) inside the function.' };
  return { pass: false, msg: "Expected: Coins: 1 / Coins: 2 / Coins: 3 \u2014 check your addition and string concat." };
}
function checkP01B3(lines) {
  const expected = ["Coins: 1", "Coins: 2", "Coins: 3"];
  const match = expected.every((e, i) => lines[i]?.trim() === e);
  if (match) return { pass: true };
  return { pass: false, msg: 'Expected Coins: 1, Coins: 2, Coins: 3 \u2014 use "Coins: " .. coins as the labelText.' };
}
function checkP01D1(lines) {
  if (lines.some((l) => l.includes("leaderstats created for TestUser"))) return { pass: true };
  return { pass: false, msg: 'Output should include "leaderstats created for TestUser with Coins = 0"' };
}
function checkP01D2(lines) {
  if (lines.some((l) => l.toLowerCase().includes("alex") && l.includes("5"))) return { pass: true };
  return { pass: false, msg: `Print something like "Alex's coins updated to 5"` };
}
function exposeGlobals3() {
  const g = window;
  g.runLua = runLua;
  g.runLuaCheck = runLuaCheck;
  g.showHint = showHint;
  g.checkP01B1 = checkP01B1;
  g.checkP01B2 = checkP01B2;
  g.checkP01B3 = checkP01B3;
  g.checkP01D1 = checkP01D1;
  g.checkP01D2 = checkP01D2;
}

// src/data/project.ts
var P1_TASKS = [
  {
    tab: "ls",
    label: "ClickScript",
    text: "<strong>Task 1 of 5</strong> \u2014 Get references to your UI elements.<br/>Write: <code>local button = script.Parent.ClickButton</code><br/>Write: <code>local coinLabel = script.Parent.CoinLabel</code>",
    starter: "-- ClickScript (LocalScript inside ClickingGui)\n-- Reference the button and label:\n\nlocal button = \nlocal coinLabel = ",
    check: (c) => /local\s+button\s*=\s*script\.Parent/.test(c) && /local\s+coinLabel\s*=\s*script\.Parent/.test(c),
    hint: "local button = script.Parent.ClickButton\nlocal coinLabel = script.Parent.CoinLabel",
    pass: "You referenced both UI elements. script.Parent = ClickingGui. Then .ClickButton goes one level deeper."
  },
  {
    tab: "ls",
    label: "ClickScript",
    text: "<strong>Task 2 of 5</strong> \u2014 Wire up the click event.<br/>Add <code>local coins = 0</code>, then <code>button.MouseButton1Click:Connect(function() ... end)</code><br/>Inside: increment coins, update <code>coinLabel.Text</code>.",
    starter: "local button = script.Parent.ClickButton\nlocal coinLabel = script.Parent.CoinLabel\nlocal coins = 0\n\nbutton.MouseButton1Click:Connect(function()\n  -- add 1 to coins\n  -- update coinLabel.Text\nend)",
    check: (c) => /MouseButton1Click\s*:\s*Connect/.test(c) && /coins\s*=\s*coins\s*\+\s*1/.test(c) && /\.Text\s*=/.test(c),
    hint: 'coins = coins + 1\ncoinLabel.Text = "Coins: " .. coins',
    pass: "The click event is live. Every click adds 1 coin and updates the label in real time."
  },
  {
    tab: "ss",
    label: "LeaderboardScript",
    text: "<strong>Task 3 of 5</strong> \u2014 Server leaderboard setup.<br/><code>Players.PlayerAdded:Connect()</code> \u2192 create a <code>leaderstats</code> Folder with a <code>Coins</code> IntValue set to 0.",
    starter: '-- LeaderboardScript (Script in ServerScriptService)\nlocal Players = game:GetService("Players")\n\nPlayers.PlayerAdded:Connect(function(player)\n  local ls = Instance.new("Folder")\n  ls.Name = "leaderstats"\n  ls.Parent = player\n\n  local coins = Instance.new("IntValue")\n  coins.Name = "Coins"\n  coins.Value = 0\n  coins.Parent = ls\nend)',
    check: (c) => /Players\.PlayerAdded\s*:\s*Connect/.test(c) && /leaderstats/.test(c) && /IntValue/.test(c),
    hint: "Read the starter code \u2014 it IS the answer. Understand each line.",
    pass: 'The leaderboard is set up. Roblox auto-reads the "leaderstats" folder name and displays it in-game.'
  },
  {
    tab: "ss",
    label: "LeaderboardScript",
    text: '<strong>Task 4 of 5</strong> \u2014 Listen for the RemoteEvent on the server.<br/>Add: <code>local event = ReplicatedStorage:WaitForChild("AddCoin")</code><br/>Then: <code>event.OnServerEvent:Connect(function(player) ... end)</code>',
    starter: 'local Players = game:GetService("Players")\nlocal ReplicatedStorage = game:GetService("ReplicatedStorage")\nlocal event = ReplicatedStorage:WaitForChild("AddCoin")\n\n-- PlayerAdded setup (already done)\n\nevent.OnServerEvent:Connect(function(player)\n  local ls = player:FindFirstChild("leaderstats")\n  if ls then\n    ls.Coins.Value = ls.Coins.Value + 1\n  end\nend)',
    check: (c) => /OnServerEvent\s*:\s*Connect/.test(c) && /WaitForChild/.test(c),
    hint: "event.OnServerEvent:Connect(function(player)\n  ls.Coins.Value = ls.Coins.Value + 1\nend)",
    pass: "The server now listens for clicks. The leaderboard updates live."
  },
  {
    tab: "ls",
    label: "ClickScript",
    text: "<strong>Task 5 of 5</strong> \u2014 Fire the RemoteEvent from the client.<br/>Inside the click function, add: <code>game.ReplicatedStorage.AddCoin:FireServer()</code>",
    starter: 'local button = script.Parent.ClickButton\nlocal coinLabel = script.Parent.CoinLabel\nlocal event = game.ReplicatedStorage:WaitForChild("AddCoin")\nlocal coins = 0\n\nbutton.MouseButton1Click:Connect(function()\n  coins = coins + 1\n  coinLabel.Text = "Coins: " .. coins\n  -- fire the server:\n  \nend)',
    check: (c) => /FireServer\s*\(\s*\)/.test(c),
    hint: "event:FireServer()",
    pass: "COMPLETE! Client fires \u2192 server updates leaderboard. Your clicking game is fully wired."
  }
];
var P1_STEP_TASK = { 4: 0, 5: 1, 6: 2, 7: 4 };
var P1_STEP_TAB = { 4: "ls", 5: "ls", 6: "ss", 7: "ls" };

// src/engine/editor.ts
var p1CurrentTask = -1;
var p1CurrentStep = 1;
var p1EditorReady = false;
var LKW = /* @__PURE__ */ new Set(["local", "function", "if", "then", "else", "elseif", "end", "for", "do", "while", "repeat", "until", "return", "break", "in", "and", "or", "not"]);
var LBL = /* @__PURE__ */ new Set(["print", "type", "tostring", "tonumber", "pairs", "ipairs", "error", "assert", "pcall", "require", "next", "select", "unpack"]);
var LGL = /* @__PURE__ */ new Set(["game", "workspace", "script", "Players", "ReplicatedStorage", "ServerScriptService", "StarterGui", "Instance", "Vector3", "CFrame", "Color3", "UDim2", "math", "string", "table", "task", "TweenService", "UserInputService"]);
var LBO = /* @__PURE__ */ new Set(["true", "false", "nil"]);
function tokenizeLua(code) {
  const out = [];
  let i = 0;
  while (i < code.length) {
    if (code[i] === "-" && code[i + 1] === "-") {
      let j = i;
      while (j < code.length && code[j] !== "\n") j++;
      out.push(`<span style="color:var(--lua-comment);font-style:italic">${escapeHtml(code.slice(i, j))}</span>`);
      i = j;
      continue;
    }
    if (code[i] === '"') {
      let j = i + 1;
      while (j < code.length && code[j] !== '"' && code[j] !== "\n") {
        if (code[j] === "\\") j++;
        j++;
      }
      out.push(`<span style="color:var(--lua-string)">${escapeHtml(code.slice(i, j + 1))}</span>`);
      i = j + 1;
      continue;
    }
    if (code[i] === "'") {
      let j = i + 1;
      while (j < code.length && code[j] !== "'" && code[j] !== "\n") {
        if (code[j] === "\\") j++;
        j++;
      }
      out.push(`<span style="color:var(--lua-string)">${escapeHtml(code.slice(i, j + 1))}</span>`);
      i = j + 1;
      continue;
    }
    if (/\d/.test(code[i]) || code[i] === "." && /\d/.test(code[i + 1] ?? "")) {
      let j = i;
      while (j < code.length && /[\d.]/.test(code[j])) j++;
      out.push(`<span style="color:var(--lua-number)">${escapeHtml(code.slice(i, j))}</span>`);
      i = j;
      continue;
    }
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
        while (k < code.length && code[k] === " ") k++;
        if (code[k] === "(") {
          out.push(`<span style="color:var(--lua-method)">${escapeHtml(w)}</span>`);
        } else if (i > 0 && /[.:]/.test(code[i - 1])) {
          out.push(`<span style="color:var(--lua-property)">${escapeHtml(w)}</span>`);
        } else {
          out.push(escapeHtml(w));
        }
      }
      i = j;
      continue;
    }
    if (code[i] === "." && code[i + 1] === ".") {
      out.push(`<span style="color:var(--lua-number)">..</span>`);
      i += 2;
      continue;
    }
    if (code[i] === "\n") {
      out.push("\n");
      i++;
      continue;
    }
    out.push(escapeHtml(code[i]));
    i++;
  }
  return out.join("");
}
function detectErrors(code) {
  const errors = [];
  const lines = code.split("\n");
  let open = 0;
  lines.forEach((line, i) => {
    const s = line.replace(/--.*$/, "").replace(/"[^"]*"|'[^']*'/g, '""').trim();
    open += (s.match(/\b(function|if|for|while|do|repeat)\b/g) ?? []).length - (s.match(/\bend\b/g) ?? []).length;
    if (/\bif\b.+[^<>=~]\s+do\b/.test(s)) errors.push({ line: i + 1, msg: 'Use "then" after if' });
    if ((s.match(/"/g) ?? []).length % 2 !== 0) errors.push({ line: i + 1, msg: "Unclosed string" });
  });
  return errors;
}
function evalLua(code) {
  const lines = [];
  const print = (...a) => lines.push(a.map((x) => x === null || x === void 0 ? "nil" : String(x)).join("	"));
  let js = code.replace(/game\s*[.:]\s*[\w.:]+/g, "nil").replace(/workspace\s*[.:]\s*\w+/g, "nil").replace(/script\s*[.:]\s*\w+/g, "nil").replace(/Instance\.new\s*\([^)]*\)/g, "{}").replace(/:WaitForChild\s*\([^)]*\)/g, "").replace(/\.Text\s*=/g, "._t=").replace(/FireServer\s*\(/g, 'print("\u2192 FireServer called")//').replace(/OnServerEvent\s*:\s*Connect\s*\(/g, 'print("\u2192 OnServerEvent connected")//').replace(/--[^\n]*/g, "").replace(/\blocal\b/g, "let ").replace(/\bthen\b/g, "{").replace(/\bdo\b/g, "{").replace(/\bend\b/g, "}").replace(/\belseif\b/g, "} else if").replace(/\bnil\b/g, "null").replace(/\bnot\s+/g, "!").replace(/\band\b/g, "&&").replace(/\bor\b/g, "||").replace(/\.\./g, "+").replace(/~=/g, "!==").replace(/let\s+function\s+(\w+)\s*\(/g, "function $1(").replace(/function\s*\(/g, "function(").replace(/for\s+(\w+)\s*=\s*([^,\n{]+),\s*([^\n,{]+?)\s*\{/g, "for(let $1=$2;$1<=$3;$1++){");
  try {
    const fn = new Function("print", "nil", js);
    fn(print, null);
    return { output: lines };
  } catch (e) {
    return { error: e.message, output: lines };
  }
}
function explainError(err) {
  const e = err.toLowerCase();
  if (e.includes("<eof>")) return 'Missing "end" \u2014 every if/function/for needs a matching end.';
  if (e.includes("concatenate") && e.includes("nil")) return 'Using ".." on nil. Is the variable defined?';
  if (e.includes("arithmetic") && e.includes("nil")) return "Math on nil. Check variable name spelling.";
  if (e.includes("attempt to call")) return "Not a function. Check the name is spelled correctly.";
  return "Check line numbers in the error. They tell you exactly where to look.";
}
function updateGutter(code) {
  const g = document.getElementById("p1-gutter");
  if (!g) return;
  const n = Math.max(code.split("\n").length + 3, 20);
  const errs = new Set(detectErrors(code).map((e) => e.line));
  g.innerHTML = Array.from(
    { length: n },
    (_, i) => `<span class="prp-ln${errs.has(i + 1) ? " err" : ""}">${i + 1}</span>`
  ).join("");
}
function highlight(code) {
  const el = document.getElementById("p1-highlight");
  if (el) el.innerHTML = tokenizeLua(code);
}
function updateCursor() {
  const ta = document.getElementById("p1-code");
  if (!ta) return;
  const txt = ta.value.slice(0, ta.selectionStart).split("\n");
  const cursor = document.getElementById("p1-cursor");
  if (cursor) cursor.textContent = `Ln ${txt.length}, Col ${txt[txt.length - 1].length + 1}`;
  document.querySelectorAll(".prp-ln").forEach(
    (el, i) => el.classList.toggle("cur", i === txt.length - 1)
  );
}
function updateErrors(code) {
  const errs = detectErrors(code);
  const el = document.getElementById("p1-errs");
  if (!el) return;
  el.innerHTML = errs.length ? `<span class="prp-err-badge">${errs.length}</span> error${errs.length > 1 ? "s" : ""}` : `<span style="color:#4fc1ff;font-size:9px;opacity:.85">\u2713 No errors</span>`;
}
function p1SetTask(idx) {
  p1CurrentTask = idx;
  const task = P1_TASKS[idx];
  const taskText = document.getElementById("p1-task-text");
  if (taskText) taskText.innerHTML = task.text;
  const dots = document.getElementById("p1-task-dots");
  if (dots) {
    dots.innerHTML = P1_TASKS.map(
      (_, i) => `<div class="prp-td ${i < idx ? "done" : i === idx ? "cur" : ""}"></div>`
    ).join("");
  }
  const ta = document.getElementById("p1-code");
  if (ta) {
    ta.value = task.starter ?? "";
    updateGutter(ta.value);
    highlight(ta.value);
  }
  const out = document.getElementById("p1-output");
  if (out) out.innerHTML = '<span class="prp-out-empty">-- Write your code and click RUN, then CHECK.</span>';
  const btn = document.getElementById("p1-check-btn");
  if (btn) {
    btn.textContent = "CHECK \u2713";
    btn.classList.remove("passed");
  }
  document.getElementById("p1-hint")?.classList.remove("show");
  const errs = document.getElementById("p1-errs");
  if (errs) errs.innerHTML = "";
}
function p1SwitchTab(tab) {
  document.getElementById("p1-ft-ls")?.classList.toggle("active", tab === "ls");
  document.getElementById("p1-ft-ss")?.classList.toggle("active", tab === "ss");
  const scriptType = document.getElementById("p1-script-type");
  if (scriptType) scriptType.textContent = tab === "ls" ? "LocalScript" : "Script";
}
function p1GoStep(n) {
  if (n > p1CurrentStep) document.getElementById("p1-t" + p1CurrentStep)?.classList.add("done");
  p1CurrentStep = n;
  document.querySelectorAll(".plp-tab").forEach((t, i) => t.classList.toggle("active", i === n - 1));
  document.querySelectorAll(".plp-step").forEach((s, i) => s.classList.toggle("active", i === n - 1));
  const pct = Math.round(n / 7 * 100);
  const prog = document.getElementById("p1-prog");
  if (prog) prog.style.width = pct + "%";
  const stepLabel = document.getElementById("p1-step-label");
  if (stepLabel) stepLabel.textContent = `Step ${n} of 7`;
  const taskIdx = P1_STEP_TASK[n];
  if (taskIdx !== void 0) {
    p1SetTask(taskIdx);
    const tab = P1_STEP_TAB[n];
    if (tab) p1SwitchTab(tab);
  }
}
function p1Run() {
  const ta = document.getElementById("p1-code");
  const out = document.getElementById("p1-output");
  if (!ta || !out) return;
  const code = ta.value;
  if (!code.trim()) {
    out.innerHTML = '<span class="prp-out-warn">Nothing to run.</span>';
    return;
  }
  const result = evalLua(code);
  if (result.error) {
    const hint = explainError(result.error);
    out.innerHTML = `<span class="prp-out-error">${escapeHtml(result.error)}</span>${hint ? `<span class="prp-out-hint">\u{1F4A1} ${escapeHtml(hint)}</span>` : ""}`;
  } else {
    let html = `<span class="prp-out-info">-- Browser sim (game.*, script.Parent won't resolve)</span>
`;
    html += result.output.length ? result.output.map((l) => `<span class="prp-out-ok">${escapeHtml(String(l))}</span>`).join("\n") : `<span class="prp-out-info">-- Code ran, no print() output.</span>`;
    out.innerHTML = html;
  }
}
function p1Check() {
  if (p1CurrentTask < 0) {
    const out2 = document.getElementById("p1-output");
    if (out2) out2.innerHTML = '<span class="prp-out-info">Complete steps on the left to unlock coding tasks.</span>';
    return;
  }
  const ta = document.getElementById("p1-code");
  const out = document.getElementById("p1-output");
  const btn = document.getElementById("p1-check-btn");
  const task = P1_TASKS[p1CurrentTask];
  if (!ta || !out || !btn) return;
  if (task.check(ta.value)) {
    btn.textContent = "\u2713 PASSED";
    btn.classList.add("passed");
    out.innerHTML = `<span class="prp-out-ok">\u2713 ${escapeHtml(task.pass)}</span>`;
    document.getElementById("p1-hint")?.classList.remove("show");
    if (p1CurrentTask < P1_TASKS.length - 1) {
      setTimeout(() => {
        p1SetTask(p1CurrentTask + 1);
        btn.textContent = "CHECK \u2713";
        btn.classList.remove("passed");
      }, 2500);
    }
  } else {
    btn.textContent = "CHECK \u2713";
    btn.classList.remove("passed");
    out.innerHTML = `<span style="color:var(--amber);display:block">Not quite \u2014 re-read the task. Use RUN to see errors first.</span>`;
  }
}
function p1ShowHint() {
  if (p1CurrentTask < 0) return;
  const h = document.getElementById("p1-hint");
  if (!h) return;
  h.textContent = "\u{1F4A1} Hint:\n" + P1_TASKS[p1CurrentTask].hint;
  h.classList.toggle("show");
}
function initP1Editor() {
  if (p1EditorReady) return;
  p1EditorReady = true;
  const ta = document.getElementById("p1-code");
  const hl = document.getElementById("p1-highlight");
  if (!ta || !hl) return;
  ta.addEventListener("input", () => {
    updateGutter(ta.value);
    highlight(ta.value);
    updateErrors(ta.value);
  });
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = ta.selectionStart, en = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + "  " + ta.value.slice(en);
      ta.selectionStart = ta.selectionEnd = s + 2;
      updateGutter(ta.value);
      highlight(ta.value);
    }
  });
  ta.addEventListener("scroll", () => {
    hl.scrollTop = ta.scrollTop;
    hl.scrollLeft = ta.scrollLeft;
  });
  ta.addEventListener("click", updateCursor);
  ta.addEventListener("keyup", updateCursor);
  updateGutter("");
}
function exposeGlobals4() {
  const g = window;
  g.p1GoStep = p1GoStep;
  g.p1Run = p1Run;
  g.p1Check = p1Check;
  g.p1ShowHint = p1ShowHint;
  g.p1SetTask = p1SetTask;
  g.p1SwitchTab = p1SwitchTab;
  g.initP1Editor = initP1Editor;
}

// src/engine/interactions.ts
var MCQ_CUSTOM = {
  "mcq-l1": ["", "\u2713 Correct \u2014 local keeps the variable private to this script. Faster and no naming conflicts.", "", ""],
  "mcq-l2": ["", "", '\u2713 Correct \u2014 the value you pass in ("Alex") becomes the parameter variable (name) inside the function.', ""],
  "mcq-l3": ["", "\u2713 Correct \u2014 isOpen stays true forever, so the if check always blocks new calls. The door is locked open.", "", ""],
  "mcq-l4": ["", "\u2713 Correct \u2014 the coin body is still there and solid. Walking over it keeps triggering Touched, which keeps collecting.", "", ""]
};
function checkMCQ(el, type) {
  const opts = el.closest(".it-options")?.querySelectorAll(".it-option");
  opts?.forEach((o) => o.classList.add("disabled"));
  el.classList.add(type);
  const fbs = el.closest(".it-body")?.querySelectorAll(".it-feedback");
  const fb = fbs && fbs.length > 0 ? fbs[fbs.length - 1] : null;
  if (!fb) return;
  fb.classList.add("show", type);
  fb.textContent = type === "correct" ? "\u2713 Correct!" : "\u2717 Not quite \u2014 re-read the section above and try the next lesson.";
  if (opts) {
    const optIdx = Array.from(opts).indexOf(el);
    const custom = MCQ_CUSTOM[fb.id];
    if (custom?.[optIdx]) fb.textContent = custom[optIdx];
  }
}
function checkGuess(el, type) {
  const opts = el.closest(".gt-options")?.querySelectorAll(".gt-option");
  opts?.forEach((o) => o.classList.add("disabled"));
  el.classList.add(type);
  const fb = el.closest(".gt-body")?.querySelector(".gt-fb");
  if (fb) {
    fb.classList.add("show", type);
    fb.textContent = el.dataset.fb ?? "";
  }
}
function selectBugLine(el, isCorrect) {
  el.classList.remove("selected-correct", "selected-wrong");
  el.classList.add(isCorrect ? "selected-correct" : "selected-wrong");
  if (!isCorrect) setTimeout(() => el.classList.remove("selected-wrong"), 700);
}
function toggleDcHints(btn) {
  const wrap = btn.nextElementSibling;
  const open = wrap?.classList.toggle("open") ?? false;
  btn.textContent = open ? "Hide hints \u2191" : "Unlock hints \u2193";
}
function toggleDcSolution(btn) {
  const sol = btn.nextElementSibling;
  const open = sol?.classList.toggle("open") ?? false;
  btn.textContent = open ? "Hide fix" : "Show fix";
}
function toggleAnswer(btn) {
  const box = btn.nextElementSibling;
  const open = box?.classList.toggle("open") ?? false;
  btn.textContent = open ? "Hide answer" : "Show answer";
}
function toggleTranscript(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  if (el.style.maxHeight === "none") {
    el.style.maxHeight = "68px";
    btn.textContent = "Show full transcript \u2193";
  } else {
    el.style.maxHeight = "none";
    btn.textContent = "Hide transcript \u2191";
  }
}
function toggleHintBox(id) {
  document.getElementById(id)?.classList.toggle("open");
}
function checkWriteL1() {
  const v = document.getElementById("wt-l1")?.value.trim().toLowerCase() ?? "";
  const res = document.getElementById("wt-res-l1");
  if (!res) return;
  res.classList.add("show");
  if (v.includes("local") && v.includes("playername") && (v.includes('"') || v.includes("'")) && v.includes("=")) {
    res.className = "wt-result show pass";
    res.textContent = "\u2713 Correct! local, playerName, = and a quoted string value.";
  } else {
    res.className = "wt-result show fail";
    let h = "\u2717 Not quite. ";
    if (!v.includes("local")) h += 'Missing "local". ';
    if (!v.includes("playername")) h += "Variable should be named playerName. ";
    if (!v.includes('"') && !v.includes("'")) h += "String values need quotes. ";
    res.textContent = h;
  }
}
function checkWriteL2() {
  const v = document.getElementById("wt-l2")?.value.trim().toLowerCase() ?? "";
  const res = document.getElementById("wt-res-l2");
  if (!res) return;
  res.classList.add("show");
  if (v.includes("for") && v.includes("1") && v.includes("3") && v.includes("do") && v.includes("print") && v.includes("end")) {
    res.className = "wt-result show pass";
    res.textContent = "\u2713 Looks right! for loop from 1 to 3 with print inside.";
  } else {
    res.className = "wt-result show fail";
    let h = "\u2717 Not quite. ";
    if (!v.includes("for")) h += "Need a for keyword. ";
    if (!v.includes("do")) h += 'Need "do" after the numbers. ';
    if (!v.includes("end")) h += 'Need "end" to close the loop. ';
    res.textContent = h;
  }
}
function checkWriteL4() {
  const v = document.getElementById("wt-l4")?.value.trim().toLowerCase() ?? "";
  const res = document.getElementById("wt-res-l4");
  if (!res) return;
  res.classList.add("show");
  if (v.includes("player") && v.includes("leaderstats") && v.includes("coins") && v.includes("value") && v.includes("+=")) {
    res.className = "wt-result show pass";
    res.textContent = "\u2713 Correct! player.leaderstats.Coins.Value += 1";
  } else {
    res.className = "wt-result show fail";
    let h = "\u2717 Not quite. ";
    if (!v.includes("leaderstats")) h += "Need leaderstats in the path. ";
    if (!v.includes("coins")) h += "Need Coins (the IntValue name). ";
    if (!v.includes("value")) h += "Need .Value at the end. ";
    if (!v.includes("+=")) h += "Use += 1 to add. ";
    res.textContent = h;
  }
}
function copyCode(btn) {
  const pre = btn.closest(".code-wrap")?.querySelector("pre");
  if (!pre) return;
  navigator.clipboard.writeText(pre.textContent ?? "").then(() => {
    btn.textContent = "Copied!";
    setTimeout(() => {
      btn.textContent = "Copy";
    }, 1500);
  });
}
var demoCoins = 0;
var demoCooldown = false;
function collectDemoCoin() {
  if (demoCooldown) return;
  demoCooldown = true;
  const coin = document.getElementById("demo-coin");
  const val = document.getElementById("demo-coins");
  coin?.classList.add("collected");
  demoCoins++;
  if (val) {
    val.textContent = String(demoCoins);
    val.classList.add("bump");
    setTimeout(() => val.classList.remove("bump"), 400);
  }
  setTimeout(() => {
    coin?.classList.remove("collected");
    demoCooldown = false;
  }, 2e3);
}
function toggleCheck(el) {
  el.classList.toggle("checked");
  updateConfResult();
}
function updateConfResult() {
  const items = document.querySelectorAll("#conf-checklist .check-item");
  const total = items.length;
  const done = document.querySelectorAll("#conf-checklist .check-item.checked").length;
  const res = document.getElementById("conf-result");
  if (!res) return;
  if (done === 0) {
    res.style.color = "var(--txt3)";
    res.textContent = "Tick the boxes above to see your result.";
  } else if (done < total) {
    res.style.color = "var(--amber)";
    res.textContent = `${done}/${total} \u2014 Good progress. Go back and practice the ones you haven't ticked yet before moving on.`;
  } else {
    res.style.color = "var(--green)";
    res.textContent = `\u2713 ${done}/${total} \u2014 You're ready. Head to Lesson 18 and start writing code.`;
  }
}
var IMAGES = {
  "open-studio": "",
  "new-baseplate": "",
  "insert-script": "",
  "output-window": "",
  "script-editor": "",
  "insert-part": "",
  "resize-part": "",
  "anchor-part": "",
  "insert-script-part": "",
  "door-play-test": "",
  "door-open-result": "",
  "coin-part": "",
  "leaderstats-explorer": "",
  "coin-collected": ""
};
function injectImages() {
  document.querySelectorAll("img[data-key]").forEach((img) => {
    const src = IMAGES[img.dataset.key ?? ""];
    if (src) {
      img.src = src;
      img.classList.add("loaded");
      img.closest(".img-step-img")?.querySelector(".img-placeholder")?.remove();
    }
  });
}
function exposeGlobals5() {
  const g = window;
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

// src/data/config.ts
var SITE = {
  name: "RoDev Academy",
  tagline: "Build. Don't Just Watch.",
  youtubeChannel: "https://www.youtube.com/@RoDevAcademy",
  youtubeHandle: "@RoDevAcademy",
  github: "https://github.com/YOUR_USERNAME/rodev-academy",
  discord: "",
  contact: ""
};
var VIDEO_URLS = {
  // ── Phase 1 — Studio Basics ──
  "p1-01": "",
  // 01. Why You're Here
  "p1-02": "",
  // 02. Install Studio
  "p1-03": "",
  // 03. First Launch
  "p1-04": "",
  // 04. Move Around
  "p1-05": "",
  // 05. The 3 Panels
  "p1-06": "",
  // 06. Click & Observe
  "p1-07": "",
  // 07. Insert a Part
  "p1-08": "",
  // 08. Transform Tools
  "p1-09": "",
  // 09. Play Your Game
  "p1-10": "",
  // 10. What's Actually Happening
  "p1-11": "",
  // 11. Hierarchy
  "p1-12": "",
  // 12. Make It Yours
  "p1-13": "",
  // 13. Fixing Common Problems
  "p1-14": "",
  // 14. Save Your Work
  "p1-15": "",
  // 15. Mini Build: Stairs
  "p1-16": "",
  // 16. Confidence Check
  "p1-17": "",
  // 17. What's Next
  // ── Coding Pre-lessons ──
  "lc01": "",
  // C01. What is Code?  ← paste GitHub Release URL here
  "lc02": "",
  // C02. The Output Window
  "lc03": "",
  // C03. Data Types
  "lc04": "",
  // C04. Operators
  "lc05": "",
  // C05. If / Then / Else
  // ── Lessons ──
  "lesson-1": "",
  // C06. Variables & First Script
  "lesson-2": "",
  // C07. Loops & Functions
  "lesson-3": "",
  // Working Door
  "lesson-4": "",
  // Coin Collector
  // ── C08–C12 ──
  "lesson-c08": "",
  // C08. Tables & Arrays
  "lesson-c09": "",
  // C09. Events & Touched
  "lesson-c10": "",
  // C10. Scope
  "lesson-c11": "",
  // C11. Strings & Math
  "lesson-c12": "",
  // C12. Debugging
  // ── UI Scripting ──
  "ui-01": "",
  // U01. ScreenGui & Frames
  "ui-02": "",
  // U02. TextButton & Label
  "ui-03": "",
  // U03. MouseButton1Click
  "ui-04": "",
  // U04. LocalScript vs Script
  "ui-05": ""
  // U05. RemoteEvents
};
var CAPTION_URLS = {
  "p1-01": "",
  "p1-02": "",
  "p1-03": "",
  "p1-04": "",
  "p1-05": "",
  "p1-06": "",
  "p1-07": "",
  "p1-08": "",
  "p1-09": "",
  "p1-10": "",
  "p1-11": "",
  "p1-12": "",
  "p1-13": "",
  "p1-14": "",
  "p1-15": "",
  "p1-16": "",
  "p1-17": "",
  "lc01": "",
  // C01 captions — paste GitHub Release .vtt URL here
  "lc02": "",
  "lc03": "",
  "lc04": "",
  "lc05": "",
  "lesson-1": "",
  "lesson-2": "",
  "lesson-3": "",
  "lesson-4": "",
  "lesson-c08": "",
  "lesson-c09": "",
  "lesson-c10": "",
  "lesson-c11": "",
  "lesson-c12": "",
  "ui-01": "",
  "ui-02": "",
  "ui-03": "",
  "ui-04": "",
  "ui-05": ""
};
var TRANSCRIPTS = {
  "lc01": "",
  "lc02": "",
  "lc03": "",
  "lc04": "",
  "lc05": "",
  "lesson-1": "",
  "lesson-2": "",
  "lesson-3": "",
  "lesson-4": "",
  "p1-01": "",
  "p1-02": "",
  "p1-03": "",
  "p1-04": "",
  "p1-05": "",
  "p1-06": "",
  "p1-07": "",
  "p1-08": "",
  "p1-09": "",
  "p1-10": "",
  "p1-11": "",
  "p1-12": "",
  "p1-13": "",
  "p1-14": "",
  "p1-15": "",
  "p1-16": "",
  "p1-17": ""
};
var LOCKED_LESSONS = {
  "lesson-5": true,
  "lesson-6": true
};
var FEATURES = {
  showGithubButton: true,
  showYoutubeButton: true,
  showProgressBar: true,
  luaRunnerEnabled: true
};

// src/engine/Videoplayer.ts
function fmt(s) {
  if (!isFinite(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
var IC = {
  play: `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`,
  pause: `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`,
  volOn: `<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>`,
  volOff: `<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>`,
  cc: `<svg viewBox="0 0 24 24"><path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1zm7 0h-1.5v-.5h-2v3h2V13H18v1a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1z"/></svg>`,
  fs: `<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>`,
  fsExit: `<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg>`
};
function parseVTT(raw) {
  const cues = [];
  const blocks = raw.replace(/\r\n/g, "\n").split(/\n\n+/);
  function toSec(ts) {
    const parts = ts.trim().split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return parts[0] * 60 + parts[1];
  }
  for (const block of blocks) {
    const lines = block.trim().split("\n");
    const arrow = lines.findIndex((l) => l.includes("-->"));
    if (arrow === -1) continue;
    const [startStr, endStr] = lines[arrow].split("-->");
    const text = lines.slice(arrow + 1).join("\n").trim();
    if (text) cues.push({ start: toSec(startStr), end: toSec(endStr), text });
  }
  return cues;
}
function buildHTML(id, videoUrl, captionUrl) {
  const trackTag = captionUrl ? `<track kind="subtitles" src="${captionUrl}" srclang="en" label="English" default/>` : "";
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
          <option value="0.5">0.5\xD7</option>
          <option value="0.75">0.75\xD7</option>
          <option value="1" selected>1\xD7</option>
          <option value="1.25">1.25\xD7</option>
          <option value="1.5">1.5\xD7</option>
          <option value="2">2\xD7</option>
        </select>

        <!-- Captions toggle (only shown when captions exist) -->
        <button class="rdv-btn rdv-cc-btn${captionUrl ? "" : " rdv-hidden"}"
          id="rdvcc-${id}" title="Captions (C)">${IC.cc}</button>

        <!-- Fullscreen -->
        <button class="rdv-btn" id="rdvfs-${id}" title="Fullscreen (F)">${IC.fs}</button>

      </div>
    </div>
  </div>`;
}
function initPlayer(id, captionUrl) {
  const wrap = document.getElementById(`rdvp-${id}`);
  const video = document.getElementById(`rdvv-${id}`);
  const playBtn = document.getElementById(`rdvplay-${id}`);
  const muteBtn = document.getElementById(`rdvmute-${id}`);
  const volEl = document.getElementById(`rdvvol-${id}`);
  const fill = document.getElementById(`rdvfill-${id}`);
  const buf = document.getElementById(`rdvbuf-${id}`);
  const timeEl = document.getElementById(`rdvtime-${id}`);
  const bar = document.getElementById(`rdvbar-${id}`);
  const tooltip = document.getElementById(`rdvtip-${id}`);
  const fsBtn = document.getElementById(`rdvfs-${id}`);
  const spdSel = document.getElementById(`rdvspd-${id}`);
  const ccBtn = document.getElementById(`rdvcc-${id}`);
  const capEl = document.getElementById(`rdvcap-${id}`);
  if (!wrap || !video) return;
  const togglePlay = () => video.paused ? video.play() : video.pause();
  wrap.addEventListener("click", (e) => {
    if (e.target.closest(".rdv-controls")) return;
    togglePlay();
  });
  playBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlay();
  });
  video.addEventListener("play", () => {
    wrap.classList.replace("paused", "playing");
    playBtn.innerHTML = IC.pause;
  });
  video.addEventListener("pause", () => {
    wrap.classList.replace("playing", "paused");
    playBtn.innerHTML = IC.play;
  });
  video.addEventListener("ended", () => {
    wrap.classList.replace("playing", "paused");
    playBtn.innerHTML = IC.play;
  });
  video.addEventListener("timeupdate", () => {
    if (!video.duration) return;
    const pct = video.currentTime / video.duration * 100;
    fill.style.width = `${pct}%`;
    timeEl.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
    updateCaptions(video.currentTime);
  });
  video.addEventListener("progress", () => {
    if (!video.duration || !video.buffered.length) return;
    const pct = video.buffered.end(video.buffered.length - 1) / video.duration * 100;
    buf.style.width = `${pct}%`;
  });
  function seekTo(e) {
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pct * video.duration;
  }
  bar.addEventListener("mousemove", (e) => {
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    tooltip.textContent = fmt(pct * (video.duration || 0));
    tooltip.style.left = `${pct * 100}%`;
    tooltip.classList.add("show");
  });
  bar.addEventListener("mouseleave", () => tooltip.classList.remove("show"));
  let dragging = false;
  bar.addEventListener("mousedown", (e) => {
    dragging = true;
    seekTo(e);
  });
  document.addEventListener("mousemove", (e) => {
    if (dragging) seekTo(e);
  });
  document.addEventListener("mouseup", () => {
    dragging = false;
  });
  bar.addEventListener("click", seekTo);
  volEl.addEventListener("input", () => {
    video.volume = parseFloat(volEl.value);
    video.muted = video.volume === 0;
    muteBtn.innerHTML = video.muted ? IC.volOff : IC.volOn;
  });
  muteBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    video.muted = !video.muted;
    muteBtn.innerHTML = video.muted ? IC.volOff : IC.volOn;
    if (!video.muted) volEl.value = String(video.volume || 1);
  });
  spdSel.addEventListener("change", (e) => {
    e.stopPropagation();
    video.playbackRate = parseFloat(spdSel.value);
  });
  let cues = [];
  let captionsOn = true;
  if (captionUrl) {
    fetch(captionUrl).then((r) => r.text()).then((raw) => {
      cues = parseVTT(raw);
    }).catch(() => {
      ccBtn.classList.add("rdv-hidden");
    });
  }
  function updateCaptions(t) {
    if (!captionsOn || !cues.length) {
      capEl.textContent = "";
      capEl.classList.remove("show");
      return;
    }
    const cue = cues.find((c) => t >= c.start && t <= c.end);
    if (cue) {
      capEl.textContent = cue.text;
      capEl.classList.add("show");
    } else {
      capEl.textContent = "";
      capEl.classList.remove("show");
    }
  }
  ccBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    captionsOn = !captionsOn;
    ccBtn.classList.toggle("rdv-cc-active", captionsOn);
    if (!captionsOn) {
      capEl.textContent = "";
      capEl.classList.remove("show");
    }
  });
  fsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      wrap.requestFullscreen?.();
      fsBtn.innerHTML = IC.fsExit;
    } else {
      document.exitFullscreen?.();
      fsBtn.innerHTML = IC.fs;
    }
  });
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement) fsBtn.innerHTML = IC.fs;
  });
  wrap.addEventListener("keydown", (e) => {
    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault();
        togglePlay();
        break;
      case "ArrowRight":
        e.preventDefault();
        video.currentTime = Math.min(video.duration, video.currentTime + 5);
        break;
      case "ArrowLeft":
        e.preventDefault();
        video.currentTime = Math.max(0, video.currentTime - 5);
        break;
      case "ArrowUp":
        e.preventDefault();
        video.volume = Math.min(1, video.volume + 0.1);
        volEl.value = String(video.volume);
        break;
      case "ArrowDown":
        e.preventDefault();
        video.volume = Math.max(0, video.volume - 0.1);
        volEl.value = String(video.volume);
        break;
      case "m":
        video.muted = !video.muted;
        muteBtn.innerHTML = video.muted ? IC.volOff : IC.volOn;
        break;
      case "c":
        ccBtn.click();
        break;
      case "f":
        fsBtn.click();
        break;
    }
  });
}
function mountPlayer(lessonId, videoUrl, captionUrl = "") {
  const page = document.getElementById(`page-${lessonId}`);
  if (!page) return;
  const frame = page.querySelector(".video-frame");
  if (!frame) return;
  frame.classList.add("has-video");
  frame.innerHTML = buildHTML(lessonId, videoUrl, captionUrl);
  requestAnimationFrame(() => initPlayer(lessonId, captionUrl));
}

// src/engine/renderer.ts
function injectVideos() {
  Object.entries(VIDEO_URLS).forEach(([lessonId, url]) => {
    if (!url) return;
    mountPlayer(lessonId, url, CAPTION_URLS[lessonId] ?? "");
  });
}
function injectTranscripts() {
  Object.entries(TRANSCRIPTS).forEach(([lessonId, text]) => {
    if (!text) return;
    const el = document.querySelector(`#page-${lessonId} .transcript`);
    if (el) el.textContent = text;
  });
}
function applyLocks() {
  Object.entries(LOCKED_LESSONS).forEach(([lessonId, locked]) => {
    if (!locked) return;
    const wrap = document.querySelector(`#page-${lessonId} .lesson-wrap`);
    if (!wrap) return;
    wrap.innerHTML = `
      <div class="lesson-eyebrow">${lessonId.toUpperCase()}</div>
      <h1 class="lesson-title">COMING<br/>SOON</h1>
      <p class="lesson-desc">This lesson is in production. Complete the previous lessons and check back soon.</p>
      <div class="lesson-nav">
        <button class="lnav-btn" onclick="nav('home',null)">\u2190 BACK TO HOME</button>
      </div>`;
  });
}
function injectSocialLinks() {
  document.querySelectorAll(".gh-link").forEach((a) => {
    if (SITE.github) a.href = SITE.github;
  });
  document.querySelectorAll(".ytlink, .sb-yt").forEach((a) => {
    if (SITE.youtubeChannel) a.href = SITE.youtubeChannel;
  });
  document.querySelectorAll(".video-placeholder a").forEach((a) => {
    if (SITE.youtubeChannel) a.href = SITE.youtubeChannel;
    const textNode = Array.from(a.childNodes).find(
      (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim().startsWith("@")
    );
    if (textNode) textNode.textContent = ` ${SITE.youtubeHandle} \xB7 UPLOADING SOON`;
  });
}
function applyFeatureFlags() {
  const ghBtn = document.querySelector(".gh-link");
  if (ghBtn) ghBtn.style.display = FEATURES.showGithubButton ? "" : "none";
  const ytBtn = document.querySelector(".ytlink");
  if (ytBtn) ytBtn.style.display = FEATURES.showYoutubeButton ? "" : "none";
  const progWrap = document.querySelector(".prog-wrap");
  if (progWrap) progWrap.style.display = FEATURES.showProgressBar ? "" : "none";
  if (!FEATURES.luaRunnerEnabled) {
    document.querySelectorAll(".lua-runner").forEach((r) => {
      r.style.opacity = "0.4";
      r.style.pointerEvents = "none";
    });
  }
}
function setVideoUrl(lessonId, url) {
  VIDEO_URLS[lessonId] = url;
  mountPlayer(lessonId, url, CAPTION_URLS[lessonId] ?? "");
}
function initRenderer() {
  injectVideos();
  injectTranscripts();
  applyLocks();
  injectSocialLinks();
  applyFeatureFlags();
}

// src/main.ts
exposeGlobals2();
exposeGlobals3();
exposeGlobals4();
exposeGlobals5();
exposeGlobals();
window.setVideoId = setVideoUrl;
window.addEventListener("rodev:project01-open", () => initP1Editor());
document.addEventListener("DOMContentLoaded", () => {
  initRenderer();
  injectImages();
  initAuth();
});
//# sourceMappingURL=bundle.js.map
