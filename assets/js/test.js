/* ===== Test engine: load test, run timer, palette, scoring, results ===== */
(function () {
  const POS = 2, NEG = 0.5; // marking scheme

  // --- test + questions are loaded asynchronously from the server ---
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  let test = null;          // resolved test row
  let questions = [];       // questions fetched from the server
  let state = null;         // populated once data is loaded
  let timerInt = null;

  // --- elements ---
  const $ = (id) => document.getElementById(id);
  const els = {
    name: $("testName"), meta: $("testMeta"), timer: $("timer"),
    qNum: $("qNum"), qTotal: $("qTotal"), qSubject: $("qSubject"),
    qText: $("qText"), options: $("options"), palette: $("palette"),
    testView: $("testView"), resultView: $("resultView"),
  };

  // --- timer ---
  function fmt(s) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  function startTimer() {
    els.timer.textContent = fmt(state.remaining);
    timerInt = setInterval(() => {
      if (state.submitted) return;
      state.remaining--;
      els.timer.textContent = fmt(Math.max(state.remaining, 0));
      els.timer.classList.toggle("warn", state.remaining <= 120 && state.remaining > 30);
      els.timer.classList.toggle("danger", state.remaining <= 30);
      if (state.remaining <= 0) { clearInterval(timerInt); submit(); }
    }, 1000);
  }

  // --- render question ---
  function renderQ() {
    const q = questions[state.cur];
    state.visited[state.cur] = true;
    els.qNum.textContent = state.cur + 1;
    els.qSubject.textContent = q.subject;
    els.qText.textContent = q.q;

    const keys = ["A", "B", "C", "D"];
    els.options.innerHTML = q.options.map((opt, i) => `
      <div class="opt ${state.answers[state.cur] === i ? "selected" : ""}" data-i="${i}">
        <span class="key">${keys[i]}</span><span>${opt}</span>
      </div>`).join("");

    els.options.querySelectorAll(".opt").forEach((el) => {
      el.addEventListener("click", () => {
        state.answers[state.cur] = Number(el.dataset.i);
        renderQ(); renderPalette();
      });
    });

    document.getElementById("reviewBtn").textContent =
      state.review[state.cur] ? "Unmark Review" : "Mark for Review";
    renderPalette();
  }

  // --- palette ---
  function renderPalette() {
    els.palette.innerHTML = questions.map((_, i) => {
      let cls = "pal-btn";
      const ans = state.answers[i] !== null;
      const rev = state.review[i];
      if (i === state.cur) cls += " current";
      if (ans && rev) cls += " answered-review";
      else if (ans) cls += " answered";
      else if (rev) cls += " review";
      else if (!state.visited[i]) cls += " notvisited";
      return `<button class="${cls}" data-i="${i}">${i + 1}</button>`;
    }).join("");
    els.palette.querySelectorAll(".pal-btn").forEach((b) => {
      b.addEventListener("click", () => { state.cur = Number(b.dataset.i); renderQ(); });
    });
  }

  // --- navigation buttons ---
  $("nextBtn").addEventListener("click", () => {
    if (state.cur < questions.length - 1) { state.cur++; renderQ(); }
  });
  $("prevBtn").addEventListener("click", () => {
    if (state.cur > 0) { state.cur--; renderQ(); }
  });
  $("clearBtn").addEventListener("click", () => {
    state.answers[state.cur] = null; renderQ();
  });
  $("reviewBtn").addEventListener("click", () => {
    state.review[state.cur] = !state.review[state.cur];
    if (state.cur < questions.length - 1) { state.cur++; }
    renderQ();
  });
  $("submitBtn").addEventListener("click", confirmSubmit);
  $("submitBtn2").addEventListener("click", confirmSubmit);

  function confirmSubmit() {
    const attempted = state.answers.filter((a) => a !== null).length;
    if (confirm(`You attempted ${attempted} of ${questions.length} questions.\n\nSubmit the test now?`)) submit();
  }

  // --- scoring + results ---
  function submit() {
    state.submitted = true;
    clearInterval(timerInt);

    let correct = 0, wrong = 0, skipped = 0;
    const sections = {};
    questions.forEach((q, i) => {
      const sec = sections[q.subject] || (sections[q.subject] = { att: 0, c: 0, w: 0, score: 0 });
      const a = state.answers[i];
      if (a === null) { skipped++; return; }
      sec.att++;
      if (a === q.answer) { correct++; sec.c++; sec.score += POS; }
      else { wrong++; sec.w++; sec.score -= NEG; }
    });

    const score = +(correct * POS - wrong * NEG).toFixed(2);
    const maxMarks = questions.length * POS;
    const accuracy = (correct + wrong) ? Math.round((correct / (correct + wrong)) * 100) : 0;

    $("rScore").textContent = score;
    $("rMax").textContent = maxMarks;
    $("rCorrect").textContent = correct;
    $("rWrong").textContent = wrong;
    $("rSkip").textContent = skipped;
    $("rAcc").textContent = accuracy + "%";
    $("rTitle").textContent = verdict(score, maxMarks);

    const tbody = document.querySelector("#secTable tbody");
    tbody.innerHTML = Object.entries(sections).map(([name, s]) =>
      `<tr><td>${name}</td><td>${s.att}</td><td style="color:var(--ok)">${s.c}</td><td style="color:var(--danger)">${s.w}</td><td><b>${(+s.score).toFixed(2)}</b></td></tr>`
    ).join("");

    renderRank({ score, maxMarks, accuracy });

    els.testView.style.display = "none";
    els.resultView.style.display = "block";
    window.scrollTo(0, 0);

    // Persist the attempt for the signed-in user (no-op in demo mode).
    if (window.MMH_API && window.MMH_API.saveAttempt) {
      const sectionsOut = Object.entries(sections).map(([name, s]) => ({
        section: name, attempted: s.att, correct: s.c, wrong: s.w, score: +s.score.toFixed(2),
      }));
      window.MMH_API.saveAttempt({
        testId: test.id,
        testTitle: test.title,
        score, maxMarks, correct, wrong, skipped, accuracy,
        details: { sections: sectionsOut },
      }).catch((e) => console.warn("Could not save attempt:", e.message));
    }
  }

  function verdict(score, max) {
    const p = score / max;
    if (p >= 0.75) return "Excellent! You're exam ready. 🚀";
    if (p >= 0.5) return "Good effort — keep practising. 💪";
    if (p >= 0.3) return "Decent start. Focus on weak sections.";
    return "Keep going — review the solutions below.";
  }

  /* --- Simulated All India Rank + leaderboard ---
     Derives a believable rank, percentile and a top-performers
     board from the user's score. (Real ranks would come from the
     backend once enough attempts are recorded.) */
  function renderRank({ score, maxMarks, accuracy }) {
    const grid = document.getElementById("rankGrid");
    const leadBody = document.querySelector("#leadTable tbody");
    if (!grid || !leadBody) return;

    const ratio = Math.max(0, Math.min(1, maxMarks ? score / maxMarks : 0));
    // a stable-ish total pool derived from the test id so it doesn't jump around
    const seed = (test.id || "t").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const pool = 6000 + (seed % 7) * 1000 + 480; // ~6.5k–12.9k candidates

    let percentile = Math.round(Math.pow(ratio, 0.7) * 990) / 10; // 0–99.0
    percentile = Math.max(1, Math.min(99.4, percentile));
    const rank = Math.max(1, Math.round(pool * (1 - percentile / 100)));

    grid.innerHTML = `
      <div class="rank-box"><div class="k">ALL INDIA RANK</div><div class="v">${rank.toLocaleString()}</div><div class="sub">out of ${pool.toLocaleString()} candidates</div></div>
      <div class="rank-box"><div class="k">PERCENTILE</div><div class="v">${percentile.toFixed(1)}</div><div class="sub">higher is better</div></div>
      <div class="rank-box"><div class="k">ACCURACY</div><div class="v">${accuracy}%</div><div class="sub">of attempted questions</div></div>`;

    // Build a small leaderboard with a few "top performers" + the user.
    const names = ["Aarav S.", "Priya K.", "Rohan M.", "Sneha R.", "Vikram J.", "Ananya P.", "Karthik N.", "Isha B."];
    const top = [];
    const topMax = maxMarks || 100;
    for (let i = 0; i < 5; i++) {
      const sc = +(topMax * (0.97 - i * 0.045)).toFixed(2);
      const acc = Math.max(70, 98 - i * 3);
      top.push({ rank: i + 1, name: names[i], score: sc, acc });
    }

    let rows;
    if (rank <= 5) {
      // user is in the top 5 — slot them in at their rank
      top[rank - 1] = { rank, name: "You", score, acc: accuracy, you: true };
      rows = top.slice(0, 5);
    } else {
      rows = top.slice(0, 4);
      rows.push({ rank, name: "You", score, acc: accuracy, you: true });
    }

    leadBody.innerHTML = rows.map((r) => `
      <tr class="${r.you ? "you" : ""}">
        <td><span class="lead-rank ${r.rank <= 3 ? "top" : ""}">${r.rank}</span></td>
        <td>${r.name}</td>
        <td>${r.score}</td>
        <td>${r.acc}%</td>
      </tr>`).join("");
  }

  // --- solutions review ---
  $("reviewSolBtn").addEventListener("click", () => {
    const wrap = $("solutionsWrap");
    if (wrap.style.display === "block") { wrap.style.display = "none"; return; }
    const keys = ["A", "B", "C", "D"];
    wrap.innerHTML = `<div class="section-head" style="margin-top:30px;"><h2 style="font-size:22px;">Solutions</h2></div>` +
      questions.map((q, i) => {
        const a = state.answers[i];
        const opts = q.options.map((opt, j) => {
          let cls = "opt";
          if (j === q.answer) cls += " correct";
          else if (j === a) cls += " wrong";
          return `<div class="${cls}"><span class="key">${keys[j]}</span><span>${opt}</span></div>`;
        }).join("");
        const tag = a === null ? '<span class="tag">Skipped</span>'
          : a === q.answer ? '<span class="tag free">Correct</span>'
          : '<span class="tag" style="background:rgba(255,93,108,.15);color:var(--danger)">Wrong</span>';
        return `<div class="q-panel" style="margin-bottom:14px;">
          <div class="q-head"><span>Q${i + 1} · ${q.subject}</span>${tag}</div>
          <div class="q-text" style="font-size:17px;">${q.q}</div>
          <div class="options">${opts}</div>
          <div class="explain"><b>Explanation:</b> ${q.explain}</div>
        </div>`;
      }).join("");
    wrap.style.display = "block";
    wrap.scrollIntoView({ behavior: "smooth" });
  });

  // keyboard nav
  document.addEventListener("keydown", (e) => {
    if (!state || state.submitted) return;
    if (e.key === "ArrowRight") $("nextBtn").click();
    if (e.key === "ArrowLeft") $("prevBtn").click();
    if (["1", "2", "3", "4"].includes(e.key)) {
      state.answers[state.cur] = Number(e.key) - 1; renderQ();
    }
  });

  // --- async init: fetch test + questions from the server (Supabase) ---
  async function init() {
    // Require login when a real backend is configured (demo mode allows through).
    if (window.MMH_AUTH) {
      const ok = await window.MMH_AUTH.requireAuth("login.html");
      if (window.MMH_CONFIGURED && !ok) return; // redirected to login
    }

    els.qText.textContent = "Loading questions…";
    try {
      test = await window.MMH_API.getTest(id);
      questions = await window.MMH_API.getQuestions(test);
    } catch (err) {
      console.error("Failed to load test:", err);
      els.qText.textContent = "Couldn't load this test from the server. Please go back and try again.";
      return;
    }

    if (!questions.length) {
      els.qText.textContent = "No questions are available for this test yet.";
      return;
    }

    state = {
      cur: 0,
      answers: new Array(questions.length).fill(null),
      visited: new Array(questions.length).fill(false),
      review: new Array(questions.length).fill(false),
      remaining: test.minutes * 60,
      submitted: false,
    };

    els.name.firstChild.textContent = test.title;
    els.meta.textContent = `${questions.length} questions · ${test.minutes} min · +${POS} / −${NEG}`;
    els.qTotal.textContent = questions.length;

    const back = document.getElementById("backLink");
    if (back) back.href = test.examSlug
      ? `exams/exam.html?slug=${encodeURIComponent(test.examSlug)}`
      : "index.html";

    startTimer();
    renderQ();
  }

  init();
})();
