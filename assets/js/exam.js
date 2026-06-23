/* ===== Generic exam page: slug-driven header, paper tabs, =====
   ===== category chips and test-list rendering.            ===== */
(function () {
  const params = new URLSearchParams(location.search);
  const slug = params.get("slug") || "ssc-cgl";

  const state = { tier: null, cat: "full", tests: [], tiers: [] };

  const listEl = document.getElementById("testList");
  const tierTabs = document.getElementById("tierTabs");
  const catChips = document.getElementById("catChips");
  const nameEl = document.getElementById("examName");
  const taglineEl = document.getElementById("examTagline");
  const crumbEl = document.getElementById("crumbExam");

  function levelColor(level) {
    if (level === "Easy") return "var(--ok)";
    if (level === "Hard") return "var(--danger)";
    return "var(--warn)";
  }

  function card(t) {
    const tags = [];
    if (t.free) tags.push('<span class="tag free">Free</span>');
    else tags.push('<span class="tag">🔒 Premium</span>');
    if (t.isNew) tags.push('<span class="tag new">New</span>');
    tags.push(`<span class="tag">${t.subject}</span>`);

    return `
      <div class="test-card">
        <div class="row"><h3>${t.title}</h3></div>
        <div class="tags">${tags.join("")}</div>
        <div class="test-meta">
          <span><b>${t.questions}</b> Qs</span>
          <span><b>${t.marks}</b> Marks</span>
          <span><b>${t.minutes}</b> min</span>
          <span>Level: <b style="color:${levelColor(t.level)}">${t.level}</b></span>
        </div>
        <div class="row">
          <span class="test-meta"><span>+2 correct &nbsp;/&nbsp; −0.5 wrong</span></span>
          <a class="btn sm" href="../test.html?id=${encodeURIComponent(t.id)}">Start Test →</a>
        </div>
      </div>`;
  }

  function renderList() {
    const items = state.tests.filter(
      (t) => t.tier === state.tier && t.category === state.cat
    );
    if (!items.length) {
      listEl.innerHTML = `<div class="empty">No tests in this category yet. Check back soon!</div>`;
      return;
    }
    listEl.innerHTML = items.map(card).join("");
  }

  function renderTierTabs() {
    tierTabs.innerHTML = state.tiers.map((t, i) =>
      `<button class="tab ${i === 0 ? "active" : ""}" data-tier="${t.key}">${t.label}</button>`
    ).join("");
    tierTabs.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.tier = btn.dataset.tier;
        tierTabs.querySelectorAll(".tab").forEach((c) => c.classList.toggle("active", c === btn));
        renderList();
      });
    });
  }

  catChips.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    state.cat = btn.dataset.cat;
    [...catChips.children].forEach((c) => c.classList.toggle("active", c === btn));
    renderList();
  });

  /* Resolve exam meta (name/tagline). Prefer local catalogue, then API. */
  async function resolveExamMeta() {
    if (typeof getExam === "function") {
      const e = getExam(slug);
      if (e) return e;
    }
    try {
      const exams = await window.MMH_API.getExams();
      return exams.find((e) => e.slug === slug) || null;
    } catch (_) { return null; }
  }

  async function init() {
    listEl.innerHTML = `<div class="empty">Loading tests…</div>`;

    const meta = await resolveExamMeta();
    const displayName = (meta && meta.name) || slug.toUpperCase();
    nameEl.textContent = `${displayName} Mock Tests`;
    taglineEl.textContent = (meta && meta.tagline) ||
      "Attempt the latest-pattern mock tests with sectional timing, negative marking and instant analysis.";
    crumbEl.textContent = displayName;
    document.title = `${displayName} Mock Tests | Study Planner Mock`;

    try {
      state.tests = await window.MMH_API.getTests(slug);
    } catch (err) {
      console.error("Failed to load tests:", err);
      listEl.innerHTML = `<div class="empty">Couldn't load tests from the server. Please refresh.</div>`;
      return;
    }

    // Derive the available papers/tiers (preserving first-seen order).
    const seen = new Set();
    state.tiers = [];
    state.tests.forEach((t) => {
      if (!seen.has(t.tier)) {
        seen.add(t.tier);
        state.tiers.push({ key: t.tier, label: t.tierLabel || t.tier });
      }
    });
    state.tier = state.tiers.length ? state.tiers[0].key : null;

    renderTierTabs();
    renderList();
  }

  init();
})();
