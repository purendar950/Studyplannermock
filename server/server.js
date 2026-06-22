/* ============================================================
 *  Study Planner Mock — API server
 *  Serves the static frontend + a full REST API:
 *    auth, exams, tests, questions, attempts, admin CRUD.
 * ============================================================ */
const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

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
  return (req, res, next) => {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) {
      if (required) return res.status(401).json({ error: "Authentication required" });
      return next();
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = db.findUserById(payload.sub);
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

// Assemble questions for a test (mix subjects for full mocks).
function assembleQuestions(test) {
  const total = Math.min(test.questions_count, 20);
  const pick = (subject, n) => {
    const pool = db.questionsBySubject(subject);
    const out = [];
    for (let i = 0; i < n && pool.length; i++) out.push(pool[i % pool.length]);
    return out;
  };
  let rows = [];
  if (test.category === "full") {
    const subs = ["Reasoning", "GK / GA", "Quant", "English"];
    const per = Math.ceil(total / subs.length);
    subs.forEach((s) => { rows = rows.concat(pick(s, per)); });
    rows = rows.slice(0, total);
  } else {
    rows = pick(test.subject, total);
  }
  return rows.map((q, i) => ({
    n: i + 1, q: q.question, options: q.options, answer: q.answer,
    explain: q.explanation, subject: q.subject,
  }));
}

// ============================================================
//  AUTH
// ============================================================
app.post("/api/auth/signup", (req, res) => {
  const { email, password, full_name } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  if (String(password).length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (db.findUserByEmail(email)) return res.status(409).json({ error: "An account with this email already exists" });

  const user = db.addUser({
    id: db.uid(),
    email: String(email).toLowerCase(),
    full_name: full_name || "",
    password_hash: bcrypt.hashSync(password, 10),
    role: "user",
    created_at: new Date().toISOString(),
  });
  return res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = db.findUserByEmail(email || "");
  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  return res.json({ token: signToken(user), user: publicUser(user) });
});

app.get("/api/auth/me", auth(true), (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// ============================================================
//  CONTENT (public read)
// ============================================================
app.get("/api/exams", (req, res) => {
  res.json(db.exams());
});

app.get("/api/tests", (req, res) => {
  const exam = req.query.exam;
  let tests = db.tests();
  if (exam) tests = tests.filter((t) => t.exam_slug === exam);
  tests.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  res.json(tests.map(mapTest));
});

app.get("/api/tests/:id", (req, res) => {
  const t = db.findTest(req.params.id);
  if (!t) return res.status(404).json({ error: "Test not found" });
  res.json(mapTest(t));
});

app.get("/api/tests/:id/questions", (req, res) => {
  const t = db.findTest(req.params.id);
  if (!t) return res.status(404).json({ error: "Test not found" });
  res.json(assembleQuestions(t));
});

// ============================================================
//  ATTEMPTS (auth)
// ============================================================
app.post("/api/attempts", auth(true), (req, res) => {
  const b = req.body || {};
  if (!b.testId) return res.status(400).json({ error: "testId is required" });
  const row = db.addAttempt({
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
});

app.get("/api/attempts", auth(true), (req, res) => {
  res.json(db.attemptsByUser(req.user.id));
});

// ============================================================
//  ADMIN CRUD (auth + admin)
// ============================================================
const admin = [auth(true), adminOnly];

// exams
app.post("/api/admin/exams", admin, (req, res) => {
  const { slug, name, description } = req.body || {};
  if (!slug || !name) return res.status(400).json({ error: "slug and name are required" });
  if (db.exams().find((e) => e.slug === slug)) return res.status(409).json({ error: "Exam slug already exists" });
  res.status(201).json(db.addExam({ slug, name, description: description || "" }));
});
app.put("/api/admin/exams/:slug", admin, (req, res) => {
  const updated = db.updateExam(req.params.slug, {
    name: req.body.name, description: req.body.description,
  });
  if (!updated) return res.status(404).json({ error: "Exam not found" });
  res.json(updated);
});
app.delete("/api/admin/exams/:slug", admin, (req, res) => {
  if (!db.deleteExam(req.params.slug)) return res.status(404).json({ error: "Exam not found" });
  res.json({ ok: true });
});

// tests
app.post("/api/admin/tests", admin, (req, res) => {
  const b = req.body || {};
  if (!b.id || !b.title) return res.status(400).json({ error: "id and title are required" });
  if (db.findTest(b.id)) return res.status(409).json({ error: "Test id already exists" });
  res.status(201).json(db.addTest({
    id: b.id, exam_slug: b.exam_slug || "cgl", tier: b.tier || "tier1", category: b.category || "full",
    title: b.title, questions_count: Number(b.questions_count) || 0, marks: Number(b.marks) || 0,
    minutes: Number(b.minutes) || 0, level: b.level || "Moderate", subject: b.subject || "All Sections",
    is_free: b.is_free !== false, is_new: !!b.is_new, sort_order: Number(b.sort_order) || 0,
  }));
});
app.put("/api/admin/tests/:id", admin, (req, res) => {
  const b = req.body || {};
  const patch = {};
  ["exam_slug", "tier", "category", "title", "level", "subject"].forEach((k) => { if (b[k] !== undefined) patch[k] = b[k]; });
  ["questions_count", "marks", "minutes", "sort_order"].forEach((k) => { if (b[k] !== undefined) patch[k] = Number(b[k]); });
  ["is_free", "is_new"].forEach((k) => { if (b[k] !== undefined) patch[k] = !!b[k]; });
  const updated = db.updateTest(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: "Test not found" });
  res.json(updated);
});
app.delete("/api/admin/tests/:id", admin, (req, res) => {
  if (!db.deleteTest(req.params.id)) return res.status(404).json({ error: "Test not found" });
  res.json({ ok: true });
});

// questions
app.get("/api/admin/questions", admin, (req, res) => {
  const subject = req.query.subject;
  let qs = db.questions();
  if (subject) qs = qs.filter((q) => q.subject === subject);
  res.json(qs);
});
app.post("/api/admin/questions", admin, (req, res) => {
  const b = req.body || {};
  if (!b.question || !Array.isArray(b.options) || b.options.length !== 4) {
    return res.status(400).json({ error: "question and four options are required" });
  }
  res.status(201).json(db.addQuestion({
    subject: b.subject || "Quant", question: b.question, options: b.options,
    answer: Number(b.answer) || 0, explanation: b.explanation || "",
  }));
});
app.put("/api/admin/questions/:id", admin, (req, res) => {
  const b = req.body || {};
  const patch = {};
  ["subject", "question", "explanation"].forEach((k) => { if (b[k] !== undefined) patch[k] = b[k]; });
  if (b.options !== undefined) patch.options = b.options;
  if (b.answer !== undefined) patch.answer = Number(b.answer);
  const updated = db.updateQuestion(req.params.id, patch);
  if (!updated) return res.status(404).json({ error: "Question not found" });
  res.json(updated);
});
app.delete("/api/admin/questions/:id", admin, (req, res) => {
  if (!db.deleteQuestion(req.params.id)) return res.status(404).json({ error: "Question not found" });
  res.json({ ok: true });
});

// admin stats
app.get("/api/admin/stats", admin, (req, res) => {
  res.json({
    exams: db.exams().length,
    tests: db.tests().length,
    questions: db.questions().length,
    users: db.raw.users.length,
    attempts: db.raw.attempts.length,
  });
});

// ============================================================
//  Static frontend
// ============================================================
app.use(express.static(ROOT, { extensions: ["html"] }));

// health
app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`Study Planner Mock running at http://localhost:${PORT}`);
  console.log(`API base: http://localhost:${PORT}/api`);
});
