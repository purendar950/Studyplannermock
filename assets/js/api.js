/* ============================================================
 *  Study Planner Mock — data access layer (REST API)
 *
 *  Fetches exams/tests/questions from the backend. If the API is
 *  unreachable (e.g. opened as a static file without the server),
 *  it falls back to the bundled sample bank so browsing still works.
 * ============================================================ */
(function () {
  const http = window.MMH_HTTP;
  const hasLocal = typeof CGL_TESTS !== "undefined";

  function localTests() {
    return hasLocal ? CGL_TESTS.map((t) => ({ ...t })) : [];
  }

  const API = {
    async getTests(examSlug = "cgl") {
      try {
        return await http.request(`/tests?exam=${encodeURIComponent(examSlug)}`);
      } catch (e) {
        console.warn("API unreachable, using local catalogue:", e.message);
        return localTests();
      }
    },

    async getTest(id) {
      try {
        return await http.request(`/tests/${encodeURIComponent(id)}`);
      } catch (e) {
        const all = localTests();
        return all.find((t) => t.id === id) || all[0];
      }
    },

    async getQuestions(test) {
      try {
        return await http.request(`/tests/${encodeURIComponent(test.id)}/questions`);
      } catch (e) {
        if (hasLocal && typeof buildQuestions === "function") return buildQuestions(test);
        return [];
      }
    },

    /* Save a completed attempt (requires login). */
    async saveAttempt(attempt) {
      if (!http.getToken()) return { skipped: true };
      try {
        return await http.request("/attempts", { method: "POST", body: attempt });
      } catch (e) {
        console.warn("Could not save attempt:", e.message);
        return { error: e.message };
      }
    },

    /* List the signed-in user's attempts. */
    async getAttempts() {
      if (!http.getToken()) return [];
      return await http.request("/attempts");
    },
  };

  window.MMH_API = API;
})();
