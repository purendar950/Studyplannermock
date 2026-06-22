/* ============================================================
 *  Study Planner Mock — Authentication layer (REST + JWT)
 *
 *  Talks to the backend API (server/). Stores the JWT in
 *  localStorage and exposes sign up / in / out, session + admin
 *  checks, route guards, and a navbar auth widget.
 * ============================================================ */
(function () {
  const http = window.MMH_HTTP;
  let _user = null;     // cached current user
  let _loaded = false;  // whether we've resolved the session once

  const AUTH = {
    /* Resolve and cache the current user (null if signed out). */
    async getUser(force) {
      if (_loaded && !force) return _user;
      const token = http.getToken();
      if (!token) { _user = null; _loaded = true; return null; }
      try {
        const { user } = await http.request("/auth/me");
        _user = user;
      } catch (e) {
        _user = null;
        if (e.status === 401) http.setToken(null); // stale token
      }
      _loaded = true;
      return _user;
    },

    async isAdmin() {
      const u = await this.getUser();
      return !!(u && u.is_admin);
    },

    async signUp(email, password, fullName) {
      const data = await http.request("/auth/signup", {
        method: "POST",
        body: { email, password, full_name: fullName || "" },
      });
      http.setToken(data.token);
      _user = data.user; _loaded = true;
      return data;
    },

    async signIn(email, password) {
      const data = await http.request("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      http.setToken(data.token);
      _user = data.user; _loaded = true;
      return data;
    },

    async signOut() {
      http.setToken(null);
      _user = null; _loaded = true;
    },

    /* Guard: redirect to login if not authenticated. */
    async requireAuth(loginPath) {
      const user = await this.getUser();
      if (!user) {
        const next = encodeURIComponent(location.pathname + location.search);
        location.href = `${loginPath || "login.html"}?next=${next}`;
        return null;
      }
      return user;
    },

    /* Guard: require an admin; redirect otherwise. */
    async requireAdmin(loginPath, homePath) {
      const user = await this.getUser();
      if (!user) { location.href = loginPath || "../login.html"; return false; }
      if (!user.is_admin) { location.href = homePath || "../index.html"; return false; }
      return true;
    },
  };

  /* ---- Navbar auth widget: renders into id="authSlot" ---- */
  AUTH.renderNav = async function (opts) {
    opts = opts || {};
    const base = opts.base || "";
    const slot = document.getElementById("authSlot");
    if (!slot) return;

    const user = await this.getUser();
    if (!user) {
      slot.innerHTML = `
        <a href="${base}login.html" class="nav-link">Sign in</a>
        <a href="${base}signup.html" class="btn sm">Sign up</a>`;
      return;
    }

    const name = user.full_name || user.email;
    const initial = (name || "U").trim().charAt(0).toUpperCase();
    slot.innerHTML = `
      <div class="user-menu">
        <button class="avatar" id="avatarBtn" title="${name}">${initial}</button>
        <div class="menu" id="userMenu" hidden>
          <div class="menu-head">
            <strong>${name}</strong>
            <span>${user.email}${user.is_admin ? " · Admin" : ""}</span>
          </div>
          <a href="${base}dashboard.html">My Attempts</a>
          ${user.is_admin ? `<a href="${base}admin/index.html">Admin Panel</a>` : ""}
          <button id="logoutBtn">Sign out</button>
        </div>
      </div>`;

    const btn = document.getElementById("avatarBtn");
    const menu = document.getElementById("userMenu");
    btn.addEventListener("click", (e) => { e.stopPropagation(); menu.hidden = !menu.hidden; });
    document.addEventListener("click", () => { menu.hidden = true; });
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await AUTH.signOut();
      location.href = `${base}index.html`;
    });
  };

  window.MMH_AUTH = AUTH;
})();
