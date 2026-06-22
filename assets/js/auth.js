/* ============================================================
 *  Study Planner Mock — Authentication layer (Supabase Auth)
 *
 *  Exposes window.MMH_AUTH with sign up / in / out, session +
 *  admin checks, route guards, and a navbar auth widget.
 * ============================================================ */
(function () {
  const sb = window.MMH_SB;
  const configured = window.MMH_CONFIGURED;

  let _profile = null; // cached profile row {id,email,full_name,is_admin}

  const AUTH = {
    configured,

    async getSession() {
      if (!configured) return null;
      const { data } = await sb.auth.getSession();
      return data.session;
    },

    async getUser() {
      if (!configured) return null;
      const { data } = await sb.auth.getUser();
      return data.user;
    },

    async getProfile(force) {
      if (!configured) return null;
      if (_profile && !force) return _profile;
      const user = await this.getUser();
      if (!user) return null;
      const { data } = await sb
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      _profile = data || { id: user.id, email: user.email, is_admin: false };
      return _profile;
    },

    async isAdmin() {
      const p = await this.getProfile();
      return !!(p && p.is_admin);
    },

    async signUp(email, password, fullName) {
      if (!configured) throw new Error("Backend not configured. Add Supabase keys in assets/js/config.js.");
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName || "" } },
      });
      if (error) throw error;
      return data;
    },

    async signIn(email, password) {
      if (!configured) throw new Error("Backend not configured. Add Supabase keys in assets/js/config.js.");
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      _profile = null;
      return data;
    },

    async signOut() {
      if (!configured) return;
      await sb.auth.signOut();
      _profile = null;
    },

    /* Guard: redirect to login if not authenticated. Returns user or null. */
    async requireAuth(redirect) {
      if (!configured) return null; // demo mode: allow through
      const user = await this.getUser();
      if (!user) {
        const next = encodeURIComponent(location.pathname + location.search);
        location.href = `${redirect || "login.html"}?next=${next}`;
        return null;
      }
      return user;
    },

    /* Guard: require an admin. Redirects non-admins. */
    async requireAdmin(loginPath, homePath) {
      if (!configured) return true; // demo mode: allow through so the UI is viewable
      const user = await this.getUser();
      if (!user) { location.href = loginPath || "../login.html"; return false; }
      const admin = await this.isAdmin();
      if (!admin) { location.href = homePath || "../index.html"; return false; }
      return true;
    },
  };

  /* ---- Navbar auth widget: renders into an element with id="authSlot" ---- */
  AUTH.renderNav = async function (opts) {
    opts = opts || {};
    const base = opts.base || ""; // path prefix to site root, e.g. "../../"
    const slot = document.getElementById("authSlot");
    if (!slot) return;

    if (!configured) {
      slot.innerHTML = `<a href="${base}login.html" class="btn sm ghost">Sign in</a>`;
      return;
    }

    const user = await this.getUser();
    if (!user) {
      slot.innerHTML = `
        <a href="${base}login.html" class="nav-link">Sign in</a>
        <a href="${base}signup.html" class="btn sm">Sign up</a>`;
      return;
    }

    const profile = await this.getProfile();
    const admin = profile && profile.is_admin;
    const name = (profile && (profile.full_name || profile.email)) || user.email;
    const initial = (name || "U").trim().charAt(0).toUpperCase();

    slot.innerHTML = `
      <div class="user-menu">
        <button class="avatar" id="avatarBtn" title="${name}">${initial}</button>
        <div class="menu" id="userMenu" hidden>
          <div class="menu-head">
            <strong>${name}</strong>
            <span>${user.email}${admin ? " · Admin" : ""}</span>
          </div>
          <a href="${base}dashboard.html">My Attempts</a>
          ${admin ? `<a href="${base}admin/index.html">Admin Panel</a>` : ""}
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
