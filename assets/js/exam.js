/* ===== CGL exam page: tab/chip filtering + test list rendering ===== */
(function () {
  const state = { tier: "tier1", cat: "full", tests: [] };
  const listEl = document.getElementById("testList");
  const tierTabs = document.getElementById("tierTabs");
  const catChips = document.getElementById("catChips");

  function levelColor(level) {
    if (level === "Easy") return "var(--ok)";
    if (level === "Hard") return "var(--danger)";
    return "var(--warn)";
  }

  function card(t) {
    const tags = [];
    if (t.free) tags.push('<span class="tag free">Free</span>');
    if (t.isNew) tags.push('<span class="tag new">New</span>');
    tags.push(`<span class="tag">${t.subject}</span>`);

    return `
      <div class="test-card">
        <div class="row">
          <h3>${t.title}</h3>
        </div>
        <div class="tags">${tags.join("")}</div>
        <div class="test-meta">
          <span><b>${t.questions}</b> Qs</span>
          <span><b>${t.marks}</b> Marks</span>
          <span><b>${t.minutes}</b> min</span>
          <span>Level: <b style="color:${levelColor(t.level)}">${t.level}</b></span>
        </div>
        <div class="row">
          <span class="test-meta"><span>+2 correct &nbsp;/&nbsp; −0.5 wrong</span></span>
          <a class="btn sm" href="../../test.html?id=${encodeURIComponent(t.id)}">Start Test →</a>
        </div>
      </div>`;
  }

  function render() {
    const items = state.tests.filter(
      (t) => t.tier === state.tier && t.category === state.cat
    );
    if (!items.length) {
      listEl.innerHTML = `<div class="empty">No tests in this category yet. Check back soon!</div>`;
      return;
    }
    listEl.innerHTML = items.map(card).join("");
  }

  tierTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn) return;
    state.tier = btn.dataset.tier;
    [...tierTabs.children].forEach((c) => c.classList.toggle("active", c === btn));
    render();
  });

  catChips.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn) return;
    state.cat = btn.dataset.cat;
    [...catChips.children].forEach((c) => c.classList.toggle("active", c === btn));
    render();
  });

  // Initial load — fetch the catalogue from the server (Supabase).
  async function init() {
    listEl.innerHTML = `<div class="empty">Loading tests…</div>`;
    try {
      state.tests = await window.MMH_API.getTests("cgl");
      render();
    } catch (err) {
      console.error("Failed to load tests:", err);
      listEl.innerHTML = `<div class="empty">Couldn't load tests from the server. Please refresh.</div>`;
    }
  }

  init();
})();
