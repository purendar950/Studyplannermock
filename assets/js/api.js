/* ============================================================
 *  Mock Matrix Hub — data access layer (server-side via Supabase)
 *
 *  All question/test data is fetched from Supabase (PostgREST).
 *  Falls back to the bundled local bank only if Supabase is not
 *  configured, so the demo never breaks.
 * ============================================================ */
(function () {
  // Use the shared client created in supabaseClient.js
  const supabase = window.MMH_SB;
  const usingServer = !!supabase;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ---- Map a DB question row to the shape the test engine expects ----
  function mapRow(row) {
    return {
      q: row.question,
      options: Array.isArray(row.options) ? row.options : JSON.parse(row.options),
      answer: row.answer,
      explain: row.explanation,
      subject: row.subject,
    };
  }

  // ============================================================
  //  Public API
  // ============================================================
  const API = {
    usingServer,

    /* List all exams in the catalogue (for the home page grid). */
    async getExams() {
      if (!usingServer) {
        return EXAMS.map((e) => ({ ...e, testCount: buildExamTests(e).length }));
      }
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },

    /* Return the test catalogue for an exam (default: ssc-cgl). */
    async getTests(examSlug = "ssc-cgl") {
      if (!usingServer) {
        const exam = (typeof getExam === "function" && getExam(examSlug)) || null;
        const tests = exam ? buildExamTests(exam) : CGL_TESTS;
        return tests.map((t) => ({ ...t }));
      }
      const { data, error } = await supabase
        .from("tests")
        .select("*")
        .eq("exam_slug", examSlug)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      // normalise DB columns -> UI field names
      return data.map((t) => ({
        id: t.id,
        tier: t.tier,
        category: t.category,
        title: t.title,
        questions: t.questions_count,
        marks: t.marks,
        minutes: t.minutes,
        level: t.level,
        subject: t.subject,
        free: t.is_free,
        isNew: t.is_new,
      }));
    },

    /* Return a single test row by id (searches every exam in demo mode). */
    async getTest(id) {
      if (!usingServer) {
        for (const exam of EXAMS) {
          const found = buildExamTests(exam).find((t) => t.id === id);
          if (found) return { ...found };
        }
        return { ...CGL_TESTS[0] };
      }
      const all = await this.getTests();
      return all.find((t) => t.id === id) || all[0];
    },

    /* Fetch questions for a test from the server.
       For "full" mocks we pull from multiple subjects and mix;
       otherwise we pull from the test's single subject pool.    */
    async getQuestions(test) {
      const total = Math.min(test.questions, 20); // demo cap for usability

      if (!usingServer) {
        // local fallback uses the bundled builder
        return buildQuestions(test);
      }

      let rows = [];
      if (test.category === "full") {
        const subs = ["Reasoning", "GK / GA", "Quant", "English"];
        const per = Math.ceil(total / subs.length);
        const results = await Promise.all(
          subs.map((s) =>
            supabase.from("questions").select("*").eq("subject", s).limit(per)
          )
        );
        results.forEach((r) => {
          if (r.error) throw r.error;
          rows = rows.concat(r.data);
        });
        rows = rows.slice(0, total);
      } else {
        const subject = test.subject;
        const { data, error } = await supabase
          .from("questions")
          .select("*")
          .eq("subject", subject)
          .limit(total);
        if (error) throw error;
        rows = data;
        // pad by repeating if the pool is smaller than requested
        let i = 0;
        while (rows.length < total && data.length) {
          rows.push(data[i % data.length]);
          i++;
        }
      }

      return rows.map(mapRow).map((q, i) => ({ ...q, n: i + 1 }));
    },
  };

  /* Save a completed attempt for the signed-in user. No-op in demo mode. */
  API.saveAttempt = async function (attempt) {
    if (!usingServer) return { skipped: true };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { skipped: true };
    const { error } = await supabase.from("attempts").insert({
      user_id: user.id,
      test_id: attempt.testId,
      test_title: attempt.testTitle,
      score: attempt.score,
      max_marks: attempt.maxMarks,
      correct: attempt.correct,
      wrong: attempt.wrong,
      skipped: attempt.skipped,
      accuracy: attempt.accuracy,
      details: attempt.details || null,
    });
    if (error) throw error;
    return { saved: true };
  };

  /* List the signed-in user's recent attempts. */
  API.getAttempts = async function (limit = 50) {
    if (!usingServer) return [];
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  };

  window.MMH_API = API;
})();
