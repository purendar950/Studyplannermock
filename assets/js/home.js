/* ===== Home page: render exam catalogue grouped by category ===== */
(function () {
  const groupsEl = document.getElementById("examGroups");
  const chipsEl = document.getElementById("groupChips");
  let exams = [];
  let active = "All";

  function statusBadge(e) {
    if (e.status === "live") return '<span class="badge">Live</span>';
    return '<span class="badge soon">Coming soon</span>';
  }

  function examCard(e) {
    const href = e.status === "live"
      ? `exams/exam.html?slug=${encodeURIComponent(e.slug)}`
      : "#exams";
    const tag = e.status === "live" ? "a" : "div";
    const sections = (e.papers && e.papers[0] && e.papers[0].subjects.length) || 0;
    return `
      <${tag} class="exam-card" ${tag === "a" ? `href="${href}"` : ""}>
        <div class="ico">${e.icon || "📘"}</div>
        ${statusBadge(e)}
        <h3>${e.name}</h3>
        <p>${e.tagline || ""}</p>
        <div class="meta">
          <span><b>${e.testCount || 0}</b> tests</span>
          <span><b>${sections}</b> sections</span>
          ${e.popular ? '<span style="color:var(--accent)">★ Popular</span>' : ""}
        </div>
      </${tag}>`;
  }

  function render() {
    const visible = exams.filter((e) => active === "All" || e.group === active);
    // group by category
    const byGroup = {};
    visible.forEach((e) => { (byGroup[e.group] = byGroup[e.group] || []).push(e); });

    if (!visible.length) {
      groupsEl.innerHTML = `<div class="empty">No exams in this category yet.</div>`;
      return;
    }

    groupsEl.innerHTML = Object.entries(byGroup).map(([group, list]) => `
      <div class="exam-group">
        <h3 class="group-title">${group}</h3>
        <div class="exam-grid">${list.map(examCard).join("")}</div>
      </div>`).join("");
  }

  function renderChips() {
    const groups = ["All", ...Array.from(new Set(exams.map((e) => e.group)))];
    chipsEl.innerHTML = groups.map((g) =>
      `<button class="chip ${g === active ? "active" : ""}" data-group="${g}">${g}</button>`
    ).join("");
    chipsEl.querySelectorAll(".chip").forEach((b) => {
      b.addEventListener("click", () => {
        active = b.dataset.group;
        chipsEl.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === b));
        render();
      });
    });
  }

  async function init() {
    try {
      exams = await window.MMH_API.getExams();
    } catch (err) {
      console.error("Failed to load exams:", err);
      groupsEl.innerHTML = `<div class="empty">Couldn't load exams. Please refresh.</div>`;
      return;
    }
    renderChips();
    render();
  }

  init();
})();
