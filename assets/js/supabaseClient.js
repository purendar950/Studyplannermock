/* ============================================================
 *  Shared Supabase client — created once, used by api.js & auth.js
 * ============================================================ */
(function () {
  const cfg = window.MMH_CONFIG || {};
  const configured =
    cfg.SUPABASE_URL &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes("YOUR-PROJECT") &&
    !cfg.SUPABASE_ANON_KEY.includes("YOUR-ANON");

  let client = null;
  if (configured && window.supabase && typeof window.supabase.createClient === "function") {
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  }

  window.MMH_SB = client;            // the supabase-js client (or null in demo mode)
  window.MMH_CONFIGURED = !!client;  // true when a real backend is wired up
})();
