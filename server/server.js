/* ============================================================
 *  Study Planner Mock — API server
 *  Serves the static frontend + a full REST API:
 *    auth, exams, tests, questions, attempts, admin CRUD.
 *  Storage is pluggable (file store locally, Postgres in prod).
 * ============================================================ */
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const store = require("./store");

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "studyplanner-dev-secret-change-me";
const ROOT = path.join(__dirname, "..");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ---------- helpers ----------
function publicUser(u) {
  return { id: u.id, email: u.email, full_name: u.full_name, role: u.role, is_admin: u.role === "admin" };
}
function signToken(u) {
  return jwt.sign({ sub: u.id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: "7d" });
}
function auth(required) {
  return async (req, res, next) => {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) {
      if (required) return res.status(401).json({ error: "Authentication required" });
      return next();
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await store.findUserById(payload.sub);
      if (!user) return res.status(401).json({ error: "Invalid session" });
      req.user = user;
    } catch (e) {
      if (required) return res.status(401).json({ error: "Invalid or expired token" });
    }
    next();
  };
}
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") return res.status(403).json({ error: "Admin access required" });
  next();
}
function mapTest(t) {
  return {
    id: t.id, exam_slug: t.exam_slug, tier: t.tier, category: t.category, title: t.title,
    questions: t.questions_count, marks: t.marks, minutes: t.minutes, level: t.level,
    subject: t.subject, free: t.is_free, isNew: t.is_new, sort_order: t.sort_order,
  };
}
// wrap async route handlers so rejections become 500s
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Assemble questions for a test (mix subjects for full mocks).
async function assembleQuestions(test) {
  const total = Math.min(test.questions_count, 20);
  const pick = async (subject, n) => {
    const pool = await store.questionsBySubject(subject);
    const out = [];
    for (let i = 0; i < n && pool.length; i++) out.push(pool[i % pool.length]);
    return out;
  };
  let rows = [];
  if (test.category === "full") {
    const subs = ["Reasoning", "GK / GA", "Quant", "English"];
    const per = Math.ceil(total / subs.length);
    for (const s of subs) rows = rows.concat(await pick(s, per));
    rows = rows.slice(0, total);
  } else {
    rows = await pick(test.subject, total);
  }
  return rows.map((q, i) => ({
    n: i + 1, q: q.question, options: q.options, answer: q.answer,
    explain: q.explanation, subject: q.subject,
  }));
}

// ============================================================
//  AUTH
// ============================================================
app.post("/api/auth/signup", wrap(async (req, res) => {
  const { email, password, full_name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  if (String(password).length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (await store.findUserByEmail(email)) return res.status(409).json({ error: "An account with this email already exists" });

  const user = await store.addUser({
    id: crypto.randomUUID(),
    email: String(email).toLowerCase(),
    full_name: full_name || "",
    password_hash: bcrypt.hashSync(password, 10),
    role: "user",
    created_at: new Date().toISOString(),
  });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

app.post("/api/auth/login", wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await store.findUserByEmail(email || "");
  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

app.get("/api/auth/me", auth(true), (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// ============================================================
//  CONTENT (public read)
// ============================================================
app.get("/api/exams", wrap(async (req, res) => {
  res.json(await store.exams());
}));

app.get("/api/tests", wrap(async (req, res) => {
  const exam = req.query.exam;
  let tests = await store.tests();
  if (exam) tests = tests.filter((t) => t.exam_slug === exam);
  tests.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  res.json(tests.map(mapTest));
}));

app.get("/api/tests/:id", wrap(async (req, res) => {
  const t = await store.findTest(req.params.id);
  if (!t) return res.status(404).json({ error: "Test not found" });
  res.json(mapTest(t));
}));

app.get("/api/tests/:id/questions", wrap(async (req, res) => {
  const t = await store.findTest(req.params.id);
  if (!t) return res.status(404).json({ error: "Test not found" });
  res.json(await assembleQuestions(t));
}));

// ============================================================
//  ATTEMPTS (auth)
// ============================================================
app.post("/api/attempts", auth(true), wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.testId) return res.status(400).json({ error: "testId is required" });
  const row = await store.addAttempt({
    user_id: req.user.id,
    test_id: b.testId,
    test_title: b.testTitle || "",
    score: Number(b.score) || 0,
    max_marks: Number(b.maxMarks) || 0,
    correct: Number(b.correct) || 0,
    wrong: Number(b.wrong) || 0,
    skipped: Number(b.skipped) || 0,
    accuracy: Number(b.accuracy) || 0,
    details: b.details || null,
  });
  res.status(201).json(row);
}));

app.get("/api/attempts", auth(true), wrap(async (req, res) => {
  res.json(await store.attemptsByUser(req.user.id));
}));

// ============================================================
//  ADMIN CRUD (auth + admin)
// ============================================================
const admin = [auth(true), adminOnly];

// exams
app.post("/api/admin/exams", admin, wrap(async (req, res) => {
  const { slug, name, description } = req.body || {};
  if (!slug || !name) return res.status(400).json({ error: "slug and name are required" });
  const exists = (await store.exams()).find((e) => e.slug === slug);
  if (exists) return res.status(409).json({ error: "Exam slug already exists" });
  res.status(201).json(await store.addExam({ slug, name, description: description || "" }));
}));
app.put("/api/admin/exams/:slug", admin, wrap(async (req, res) => {
  const updated = await store.updateExam(req.params.slug, { name: req.body.name, description: req.body.description });
  if (!updated) return res.status(404).json({ error: "Exam not found" });
  res.json(updated);
}));
app.delete("/api/admin/exams/:slug", admin, wrap(async (req, res) => {
  if (!(await store.deleteExam(req.params.slug))) return res.status(404).json({ error: "Exam not found" });
  res.json({ ok: true });
}));

// tests
app.post("/api/admin/tests", admin, wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.id || !b.title) return res.status(400).json({ error: "id and title are required" });
  if (await store.findTest(b.id)) return res.status(409).json({ error: "Test id already exists" });
  res.status(201).json(await store.addTest({
    id: b.id, exam_slug: b.exam_slug || "cgl", tier: b.tier || "tier1", category: b.category || "full",
    title: b.title, questions_count: Number(b.questions_count) || 0, marks: Number(b.marks) || 0,
    minutes: Number(b.minutes) || 0, level: b.level || "Moderate", subject: b.subject || "All Sections",
    is_free: b.is_free !== false, is_new: !!b.is_new, sort_order: Number(b.sort_order) || 0,
  }));
}));
app.put("/api/admin/tests/:id", admin, wrap(async (req, res) => {
  const b = req.body || {};
  const patch = {};
  ["exam_slug", "tier", "category", "title", "level", "subject"].forEach((k) => { if (b[k] !== undefined) patch[k] = b[k]; });
  ["questions_count", "marks", "minutes", "sort_order"].forEach((k) => { if (b[k] !== undefined) patch[k] = Number(b[k]); });
  ["is_free", "is_new"].forEach((k) => { if (b[k] !== undefined) patch[k] = !!b[k]; });
  const updated = await store.updateTest(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: "Test not found" });
  res.json(updated);
}));
app.delete("/api/admin/tests/:id", admin, wrap(async (req, res) => {
  if (!(await store.deleteTest(req.params.id))) return res.status(404).json({ error: "Test not found" });
  res.json({ ok: true });
}));

// questions
app.get("/api/admin/questions", admin, wrap(async (req, res) => {
  const subject = req.query.subject;
  const qs = subject ? await store.questionsBySubject(subject) : await store.questions();
  res.json(qs);
}));
app.post("/api/admin/questions", admin, wrap(async (req, res) => {
  const b = req.body || {};
  if (!b.question || !Array.isArray(b.options) || b.options.length !== 4) {
    return res.status(400).json({ error: "question and four options are required" });
  }
  res.status(201).json(await store.addQuestion({
    subject: b.subject || "Quant", question: b.question, options: b.options,
    answer: Number(b.answer) || 0, explanation: b.explanation || "",
  }));
}));
app.post("/api/admin/questions/bulk", admin, wrap(async (req, res) => {
  const list = Array.isArray(req.body && req.body.questions) ? req.body.questions : null;
  if (!list) return res.status(400).json({ error: "A 'questions' array is required" });
  if (list.length > 2000) return res.status(400).json({ error: "Too many rows (max 2000 per upload)" });

  const valid = [];
  const errors = [];
  list.forEach((item, idx) => {
    const row = idx + 1;
    if (!item || typeof item.question !== "string" || !item.question.trim()) {
      return errors.push(`Row ${row}: missing question`);
    }
    if (!Array.isArray(item.options) || item.options.length !== 4 || item.options.some((o) => !String(o).trim())) {
      return errors.push(`Row ${row}: needs 4 non-empty options`);
    }
    const ans = Number(item.answer);
    if (!(ans >= 0 && ans <= 3)) return errors.push(`Row ${row}: answer must be A-D`);
    valid.push({
      subject: (item.subject && String(item.subject).trim()) || "Quant",
      question: item.question.trim(),
      options: item.options.map((o) => String(o)),
      answer: ans,
      explanation: item.explanation ? String(item.explanation) : "",
    });
  });

  let inserted = [];
  if (valid.length) inserted = await store.addQuestionsBulk(valid);
  res.status(201).json({ inserted: inserted.length, failed: errors.length, errors: errors.slice(0, 50) });
}));
app.put("/api/admin/questions/:id", admin, wrap(async (req, res) => {
  const b = req.body || {};
  const patch = {};
  ["subject", "question", "explanation"].forEach((k) => { if (b[k] !== undefined) patch[k] = b[k]; });
  if (b.options !== undefined) patch.options = b.options;
  if (b.answer !== undefined) patch.answer = Number(b.answer);
  const updated = await store.updateQuestion(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: "Question not found" });
  res.json(updated);
}));
app.delete("/api/admin/questions/:id", admin, wrap(async (req, res) => {
  if (!(await store.deleteQuestion(req.params.id))) return res.status(404).json({ error: "Question not found" });
  res.json({ ok: true });
}));

// admin stats
app.get("/api/admin/stats", admin, wrap(async (req, res) => {
  res.json(await store.counts());
}));

// health
app.get("/api/health", (req, res) => res.json({ ok: true, store: store.kind, time: new Date().toISOString() }));

// ============================================================
//  Static frontend
// ============================================================
app.use(express.static(ROOT, { extensions: ["html"] }));

// error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ---------- boot ----------
store.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Study Planner Mock running at http://localhost:${PORT}`);
      console.log(`API base: http://localhost:${PORT}/api  (store: ${store.kind})`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize store:", err);
    process.exit(1);
  });
