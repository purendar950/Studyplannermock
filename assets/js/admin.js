/* ============================================================
 *  Study Planner Mock — Admin panel
 *  CRUD for exams, test series and questions (admin-only).
 *  Secured server-side by RLS (is_admin); UI also guards access.
 * ============================================================ */
(function () {
  const sb = window.MMH_SB;
  const configured = window.MMH_CONFIGURED;
  const $ = (id) => document.getElementById(id);
  const content = $("adminContent");
  const guardMsg = $("guardMsg");

  const SUBJECTS = ["Reasoning", "GK / GA", "Quant", "English", "Maths", "Computer", "GA"];
  const TIERS = ["tier1", "tier2"];
  const CATEGORIES = ["full", "sectional", "subject"];
  const LEVELS = ["Easy", "Moderate", "Hard"];

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // ---------- modal helpers ----------
  const modalBg = $("modalBg");
  let onSave = null;
  function openModal(title, bodyHtml, saveFn) {
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = bodyHtml;
    onSave = saveFn;
    modalBg.classList.add("show");
  }
  function closeModal() { modalBg.classList.remove("show"); onSave = null; }
  $("modalCancel").addEventListener("click", closeModal);
  modalBg.addEventListener("click", (e) => { if (e.target === modalBg) closeModal(); });
  $("modalSave").addEventListener("click", async () => {
    if (!onSave) return;
    const btn = $("modalSave");
    btn.disabled = true; btn.textContent = "Saving…";
    try { await onSave(); closeModal(); await renderView(currentView); }
    catch (err) { alert(err.message || "Save failed"); }
    finally { btn.disabled = false; btn.textContent = "Save"; }
  });

  function notConfiguredNotice() {
    return `<div class="notice">Demo mode — data shown below is read-only sample data.
      Add your Supabase keys in <b>assets/js/config.js</b> and run the SQL in <b>supabase/</b>
      to enable adding, editing and deleting content.</div>`;
  }

  // ---------- data access ----------
  async function fetchExams() {
    if (!configured) {
      return [{ slug: "cgl", name: "SSC CGL", description: "Combined Graduate Level (sample)" }];
    }
    const { data, error } = await sb.from("exams").select("*").order("slug");
    if (error) throw error; return data;
  }
  async function fetchTests() {
    if (!configured) return CGL_TESTS.map((t, i) => ({
      id: t.id, exam_slug: "cgl", tier: t.tier, category: t.category, title: t.title,
      questions_count: t.questions, marks: t.marks, minutes: t.minutes, level: t.level,
      subject: t.subject, is_free: t.free, is_new: t.isNew, sort_order: i,
    }));
    const { data, error } = await sb.from("tests").select("*").order("sort_order");
    if (error) throw error; return data;
  }
  async function fetchQuestions(subject) {
    if (!configured) {
      let out = [];
      Object.entries(QUESTION_BANK).forEach(([sub, qs]) => {
        qs.forEach((q, i) => out.push({ id: sub + "-" + i, subject: sub, question: q.q, options: q.options, answer: q.answer, explanation: q.explain }));
      });
      return subject ? out.filter((q) => q.subject === subject) : out;
    }
    let query = sb.from("questions").select("*").order("id");
    if (subject) query = query.eq("subject", subject);
    const { data, error } = await query;
    if (error) throw error; return data;
  }
  async function count(table) {
    if (!configured) {
      if (table === "exams") return 1;
      if (table === "tests") return CGL_TESTS.length;
      if (table === "questions") return Object.values(QUESTION_BANK).reduce((s, a) => s + a.length, 0);
      return 0;
    }
    const { count: c, error } = await sb.from(table).select("*", { count: "exact", head: true });
    if (error) throw error; return c;
  }
  function guardWrite() {
    if (!configured) { alert("Connect Supabase (assets/js/config.js) to manage content."); return false; }
    return true;
  }

  // ============================================================
  //  Views
  // ============================================================
  let currentView = "dashboard";

  async function viewDashboard() {
    const [ne, nt, nq] = await Promise.all([count("exams"), count("tests"), count("questions")]);
    content.innerHTML = `
      <div class="admin-head"><h1>Dashboard</h1></div>
      ${!configured ? notConfiguredNotice() : ""}
      <div class="admin-grid">
        <div class="card-box"><div class="k">Exams</div><div class="v">${ne}</div></div>
        <div class="card-box"><div class="k">Test Series</div><div class="v">${nt}</div></div>
        <div class="card-box"><div class="k">Questions</div><div class="v">${nq}</div></div>
        <div class="card-box"><div class="k">Status</div><div class="v" style="font-size:18px;color:${configured ? "var(--ok)" : "var(--warn)"}">${configured ? "Live" : "Demo"}</div></div>
      </div>
      <div class="card-box">
        <h3 style="margin-top:0;">Quick actions</h3>
        <div class="toolbar">
          <button class="btn sm" data-go="exams">+ Manage Exams</button>
          <button class="btn sm" data-go="tests">+ Manage Test Series</button>
          <button class="btn sm" data-go="questions">+ Manage Questions</button>
        </div>
      </div>`;
    content.querySelectorAll("[data-go]").forEach((b) =>
      b.addEventListener("click", () => switchView(b.dataset.go)));
  }

  // ---------- Exams ----------
  async function viewExams() {
    const exams = await fetchExams();
    content.innerHTML = `
      <div class="admin-head"><h1>Exams</h1><button class="btn sm" id="addExam">+ Add Exam</button></div>
      ${!configured ? notConfiguredNotice() : ""}
      <table class="dash-table">
        <thead><tr><th>Slug</th><th>Name</th><th>Description</th><th style="width:120px;">Actions</th></tr></thead>
        <tbody>${exams.map((e) => `
          <tr>
            <td><code>${esc(e.slug)}</code></td><td>${esc(e.name)}</td><td>${esc(e.description)}</td>
            <td>
              <button class="icon-btn" data-edit="${esc(e.slug)}">Edit</button>
              <button class="icon-btn danger" data-del="${esc(e.slug)}">Delete</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`;
    $("addExam").addEventListener("click", () => examForm());
    content.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => examForm(exams.find((x) => x.slug === b.dataset.edit))));
    content.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => deleteRow("exams", "slug", b.dataset.del, "exam")));
  }

  function examForm(row) {
    const r = row || {};
    openModal(row ? "Edit Exam" : "Add Exam", `
      <div class="form-grid">
        <div class="field"><label>Slug (unique)</label><input class="input" id="f_slug" value="${esc(r.slug)}" ${row ? "readonly" : ""} placeholder="cgl"></div>
        <div class="field"><label>Name</label><input class="input" id="f_name" value="${esc(r.name)}" placeholder="SSC CGL"></div>
        <div class="field full"><label>Description</label><textarea class="input" id="f_desc">${esc(r.description)}</textarea></div>
      </div>`, async () => {
        if (!guardWrite()) return;
        const payload = { slug: $("f_slug").value.trim(), name: $("f_name").value.trim(), description: $("f_desc").value.trim() };
        if (!payload.slug || !payload.name) throw new Error("Slug and name are required.");
        const { error } = row
          ? await sb.from("exams").update({ name: payload.name, description: payload.description }).eq("slug", row.slug)
          : await sb.from("exams").insert(payload);
        if (error) throw error;
      });
  }

  // ---------- Tests ----------
  async function viewTests() {
    const [tests, exams] = await Promise.all([fetchTests(), fetchExams()]);
    content.innerHTML = `
      <div class="admin-head"><h1>Test Series</h1><button class="btn sm" id="addTest">+ Add Test</button></div>
      ${!configured ? notConfiguredNotice() : ""}
      <table class="dash-table">
        <thead><tr><th>ID</th><th>Title</th><th>Tier</th><th>Category</th><th>Qs</th><th>Min</th><th style="width:120px;">Actions</th></tr></thead>
        <tbody>${tests.map((t) => `
          <tr>
            <td><code>${esc(t.id)}</code></td><td>${esc(t.title)}</td><td>${esc(t.tier)}</td>
            <td>${esc(t.category)}</td><td>${t.questions_count}</td><td>${t.minutes}</td>
            <td>
              <button class="icon-btn" data-edit="${esc(t.id)}">Edit</button>
              <button class="icon-btn danger" data-del="${esc(t.id)}">Delete</button>
            </td>
          </tr>`).join("")}</tbody>
      </table>`;
    $("addTest").addEventListener("click", () => testForm(null, exams));
    content.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => testForm(tests.find((x) => x.id === b.dataset.edit), exams)));
    content.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => deleteRow("tests", "id", b.dataset.del, "test")));
  }

  function testForm(row, exams) {
    const r = row || { tier: "tier1", category: "full", level: "Moderate", is_free: true, is_new: false, questions_count: 20, marks: 40, minutes: 30, sort_order: 0, subject: "All Sections" };
    const opt = (arr, val) => arr.map((x) => `<option value="${x}" ${x === val ? "selected" : ""}>${x}</option>`).join("");
    openModal(row ? "Edit Test" : "Add Test", `
      <div class="form-grid">
        <div class="field"><label>Test ID (unique)</label><input class="input" id="f_id" value="${esc(r.id)}" ${row ? "readonly" : ""} placeholder="t1-full-04"></div>
        <div class="field"><label>Exam</label><select class="input" id="f_exam">${exams.map((e) => `<option value="${esc(e.slug)}" ${e.slug === r.exam_slug ? "selected" : ""}>${esc(e.name)}</option>`).join("")}</select></div>
        <div class="field full"><label>Title</label><input class="input" id="f_title" value="${esc(r.title)}" placeholder="CGL Tier I — Full Mock 04"></div>
        <div class="field"><label>Tier</label><select class="input" id="f_tier">${opt(TIERS, r.tier)}</select></div>
        <div class="field"><label>Category</label><select class="input" id="f_cat">${opt(CATEGORIES, r.category)}</select></div>
        <div class="field"><label>Subject</label><input class="input" id="f_subject" value="${esc(r.subject)}" placeholder="Quant"></div>
        <div class="field"><label>Level</label><select class="input" id="f_level">${opt(LEVELS, r.level)}</select></div>
        <div class="field"><label>Questions</label><input class="input" type="number" id="f_q" value="${r.questions_count}"></div>
        <div class="field"><label>Marks</label><input class="input" type="number" id="f_marks" value="${r.marks}"></div>
        <div class="field"><label>Minutes</label><input class="input" type="number" id="f_min" value="${r.minutes}"></div>
        <div class="field"><label>Sort order</label><input class="input" type="number" id="f_sort" value="${r.sort_order || 0}"></div>
        <div class="field"><label>Free?</label><select class="input" id="f_free"><option value="true" ${r.is_free ? "selected" : ""}>Yes</option><option value="false" ${!r.is_free ? "selected" : ""}>No</option></select></div>
        <div class="field"><label>New?</label><select class="input" id="f_new"><option value="true" ${r.is_new ? "selected" : ""}>Yes</option><option value="false" ${!r.is_new ? "selected" : ""}>No</option></select></div>
      </div>`, async () => {
        if (!guardWrite()) return;
        const payload = {
          id: $("f_id").value.trim(), exam_slug: $("f_exam").value, title: $("f_title").value.trim(),
          tier: $("f_tier").value, category: $("f_cat").value, subject: $("f_subject").value.trim(),
          level: $("f_level").value, questions_count: +$("f_q").value, marks: +$("f_marks").value,
          minutes: +$("f_min").value, sort_order: +$("f_sort").value,
          is_free: $("f_free").value === "true", is_new: $("f_new").value === "true",
        };
        if (!payload.id || !payload.title) throw new Error("ID and title are required.");
        const { error } = row
          ? await sb.from("tests").update(payload).eq("id", row.id)
          : await sb.from("tests").insert(payload);
        if (error) throw error;
      });
  }

  // ---------- Questions ----------
  let qFilter = "";
  async function viewQuestions() {
    const questions = await fetchQuestions(qFilter);
    const opts = (val) => SUBJECTS.map((s) => `<option value="${s}" ${s === val ? "selected" : ""}>${s}</option>`).join("");
    content.innerHTML = `
      <div class="admin-head"><h1>Questions</h1><button class="btn sm" id="addQ">+ Add Question</button></div>
      ${!configured ? notConfiguredNotice() : ""}
      <div class="toolbar">
        <label style="color:var(--muted);font-weight:700;font-size:13px;">Filter by subject:</label>
        <select class="input" id="qFilter" style="width:auto;"><option value="">All</option>${opts(qFilter)}</select>
        <span class="spacer"></span>
        <span style="color:var(--muted);font-size:13px;">${questions.length} question(s)</span>
      </div>
      <table class="dash-table">
        <thead><tr><th>Subject</th><th>Question</th><th>Answer</th><th style="width:120px;">Actions</th></tr></thead>
        <tbody>${questions.map((q) => `
          <tr>
            <td>${esc(q.subject)}</td>
            <td>${esc(q.question).slice(0, 70)}${q.question.length > 70 ? "…" : ""}</td>
            <td>${["A", "B", "C", "D"][q.answer]}</td>
            <td>
              <button class="icon-btn" data-edit="${esc(q.id)}">Edit</button>
              ${configured ? `<button class="icon-btn danger" data-del="${esc(q.id)}">Delete</button>` : ""}
            </td>
          </tr>`).join("")}</tbody>
      </table>`;
    $("qFilter").addEventListener("change", (e) => { qFilter = e.target.value; viewQuestions(); });
    $("addQ").addEventListener("click", () => questionForm());
    content.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => questionForm(questions.find((x) => String(x.id) === b.dataset.edit))));
    content.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => deleteRow("questions", "id", b.dataset.del, "question")));
  }

  function questionForm(row) {
    const r = row || { subject: "Quant", options: ["", "", "", ""], answer: 0 };
    const o = Array.isArray(r.options) ? r.options : JSON.parse(r.options);
    const subOpts = SUBJECTS.map((s) => `<option value="${s}" ${s === r.subject ? "selected" : ""}>${s}</option>`).join("");
    const ansOpts = [0, 1, 2, 3].map((i) => `<option value="${i}" ${i === r.answer ? "selected" : ""}>Option ${["A", "B", "C", "D"][i]}</option>`).join("");
    openModal(row ? "Edit Question" : "Add Question", `
      <div class="form-grid">
        <div class="field"><label>Subject</label><select class="input" id="f_sub">${subOpts}</select></div>
        <div class="field"><label>Correct answer</label><select class="input" id="f_ans">${ansOpts}</select></div>
        <div class="field full"><label>Question</label><textarea class="input" id="f_q">${esc(r.question)}</textarea></div>
        <div class="field"><label>Option A</label><input class="input" id="f_o0" value="${esc(o[0])}"></div>
        <div class="field"><label>Option B</label><input class="input" id="f_o1" value="${esc(o[1])}"></div>
        <div class="field"><label>Option C</label><input class="input" id="f_o2" value="${esc(o[2])}"></div>
        <div class="field"><label>Option D</label><input class="input" id="f_o3" value="${esc(o[3])}"></div>
        <div class="field full"><label>Explanation</label><textarea class="input" id="f_exp">${esc(r.explanation)}</textarea></div>
      </div>`, async () => {
        if (!guardWrite()) return;
        const options = [$("f_o0").value, $("f_o1").value, $("f_o2").value, $("f_o3").value];
        const payload = {
          subject: $("f_sub").value, question: $("f_q").value.trim(),
          options, answer: +$("f_ans").value, explanation: $("f_exp").value.trim(),
        };
        if (!payload.question || options.some((x) => !x.trim())) throw new Error("Question and all four options are required.");
        const { error } = row
          ? await sb.from("questions").update(payload).eq("id", row.id)
          : await sb.from("questions").insert(payload);
        if (error) throw error;
      });
  }

  async function deleteRow(table, key, value, label) {
    if (!guardWrite()) return;
    if (!confirm(`Delete this ${label}? This cannot be undone.`)) return;
    const { error } = await sb.from(table).delete().eq(key, value);
    if (error) { alert(error.message); return; }
    await renderView(currentView);
  }

  // ============================================================
  //  Routing
  // ============================================================
  const VIEWS = { dashboard: viewDashboard, exams: viewExams, tests: viewTests, questions: viewQuestions };

  async function renderView(name) {
    currentView = name;
    content.innerHTML = `<div class="empty">Loading…</div>`;
    try { await (VIEWS[name] || viewDashboard)(); }
    catch (err) { content.innerHTML = `<div class="empty">Error: ${esc(err.message)}</div>`; }
  }

  function switchView(name) {
    document.querySelectorAll("#adminNav a[data-view]").forEach((a) =>
      a.classList.toggle("active", a.dataset.view === name));
    location.hash = name;
    renderView(name);
  }

  document.getElementById("adminNav").addEventListener("click", (e) => {
    const a = e.target.closest("a[data-view]");
    if (!a) return;
    e.preventDefault();
    switchView(a.dataset.view);
  });

  // ---------- boot ----------
  (async function boot() {
    if (configured) {
      const ok = await window.MMH_AUTH.requireAdmin("../login.html", "../index.html");
      if (!ok) return; // redirected
    }
    guardMsg.style.display = "none";
    content.style.display = "block";
    const start = (location.hash || "#dashboard").slice(1);
    switchView(VIEWS[start] ? start : "dashboard");
  })();
})();
