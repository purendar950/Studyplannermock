/* ============================================================
 *  Study Planner Mock — low-level HTTP client for the REST API.
 *  Handles the base URL, JWT bearer token, and JSON parsing.
 * ============================================================ */
(function () {
  const BASE = (window.MMH_CONFIG && window.MMH_CONFIG.API_BASE) || "/api";
  const TOKEN_KEY = "spm_token";

  function getToken() { return localStorage.getItem(TOKEN_KEY); }
  function setToken(t) { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); }

  async function request(path, opts) {
    opts = opts || {};
    const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
    const token = getToken();
    if (token) headers.Authorization = "Bearer " + token;

    const res = await fetch(BASE + path, {
      method: opts.method || "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    let data = null;
    try { data = await res.json(); } catch (e) { /* no body */ }

    if (!res.ok) {
      const msg = (data && data.error) || ("Request failed (" + res.status + ")");
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  window.MMH_HTTP = { request, getToken, setToken, BASE };
})();
