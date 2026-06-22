/* ============================================================
 *  Study Planner Mock — tiny file-backed database
 *  Zero native dependencies: persists collections to data/db.json.
 *  Good enough for a self-contained, runnable backend.
 * ============================================================ */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Reuse the bundled question bank + test catalogue (it exports via module.exports).
const { CGL_TESTS, QUESTION_BANK } = require("../assets/js/data.js");

function emptyDb() {
  return { users: [], exams: [], tests: [], questions: [], attempts: [], meta: {} };
}

let db = emptyDb();

function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      db = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
      return true;
    }
  } catch (e) {
    console.error("Failed to read db.json, starting fresh:", e.message);
  }
  return false;
}

function save() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function uid() {
  return crypto.randomUUID();
}

function seed() {
  db = emptyDb();

  // ----- default admin + demo user -----
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  const userPass = "test1234";
  db.users.push({
    id: uid(),
    email: (process.env.ADMIN_EMAIL || "admin@studyplanner.mock").toLowerCase(),
    full_name: "Site Admin",
    password_hash: bcrypt.hashSync(adminPass, 10),
    role: "admin",
    created_at: new Date().toISOString(),
  });
  db.users.push({
    id: uid(),
    email: "student@studyplanner.mock",
    full_name: "Demo Student",
    password_hash: bcrypt.hashSync(userPass, 10),
    role: "user",
    created_at: new Date().toISOString(),
  });

  // ----- exams -----
  db.exams.push({
    slug: "cgl",
    name: "SSC CGL",
    description: "Staff Selection Commission — Combined Graduate Level",
  });

  // ----- tests -----
  CGL_TESTS.forEach((t, i) => {
    db.tests.push({
      id: t.id,
      exam_slug: "cgl",
      tier: t.tier,
      category: t.category,
      title: t.title,
      questions_count: t.questions,
      marks: t.marks,
      minutes: t.minutes,
      level: t.level,
      subject: t.subject,
      is_free: !!t.free,
      is_new: !!t.isNew,
      sort_order: i,
    });
  });

  // ----- questions (subject pool) -----
  let qid = 1;
  Object.entries(QUESTION_BANK).forEach(([subject, qs]) => {
    qs.forEach((q) => {
      db.questions.push({
        id: qid++,
        subject,
        question: q.q,
        options: q.options,
        answer: q.answer,
        explanation: q.explain,
      });
    });
  });

  db.meta = { seeded_at: new Date().toISOString() };
  save();
  console.log(
    `Seeded DB: ${db.users.length} users, ${db.exams.length} exams, ${db.tests.length} tests, ${db.questions.length} questions`
  );
}

function init() {
  const loaded = load();
  if (!loaded || process.argv.includes("--reseed")) {
    seed();
  }
}

// ---- collection helpers ----
const api = {
  get raw() { return db; },
  save,
  uid,

  // users
  findUserByEmail(email) {
    return db.users.find((u) => u.email === String(email).toLowerCase());
  },
  findUserById(id) {
    return db.users.find((u) => u.id === id);
  },
  addUser(user) {
    db.users.push(user);
    save();
    return user;
  },

  // exams
  exams() { return db.exams; },
  addExam(e) { db.exams.push(e); save(); return e; },
  updateExam(slug, patch) {
    const e = db.exams.find((x) => x.slug === slug);
    if (!e) return null;
    Object.assign(e, patch);
    save();
    return e;
  },
  deleteExam(slug) {
    const before = db.exams.length;
    db.exams = db.exams.filter((x) => x.slug !== slug);
    db.tests = db.tests.filter((t) => t.exam_slug !== slug);
    save();
    return db.exams.length < before;
  },

  // tests
  tests() { return db.tests; },
  findTest(id) { return db.tests.find((t) => t.id === id); },
  addTest(t) { db.tests.push(t); save(); return t; },
  updateTest(id, patch) {
    const t = db.tests.find((x) => x.id === id);
    if (!t) return null;
    Object.assign(t, patch);
    save();
    return t;
  },
  deleteTest(id) {
    const before = db.tests.length;
    db.tests = db.tests.filter((x) => x.id !== id);
    save();
    return db.tests.length < before;
  },

  // questions
  questions() { return db.questions; },
  questionsBySubject(subject) {
    return db.questions.filter((q) => q.subject === subject);
  },
  findQuestion(id) { return db.questions.find((q) => q.id === Number(id)); },
  addQuestion(q) {
    const nextId = db.questions.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    const row = { ...q, id: nextId };
    db.questions.push(row);
    save();
    return row;
  },
  updateQuestion(id, patch) {
    const q = db.questions.find((x) => x.id === Number(id));
    if (!q) return null;
    Object.assign(q, patch);
    save();
    return q;
  },
  deleteQuestion(id) {
    const before = db.questions.length;
    db.questions = db.questions.filter((x) => x.id !== Number(id));
    save();
    return db.questions.length < before;
  },

  // attempts
  addAttempt(a) {
    const nextId = db.attempts.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
    const row = { ...a, id: nextId, created_at: new Date().toISOString() };
    db.attempts.push(row);
    save();
    return row;
  },
  attemptsByUser(userId) {
    return db.attempts
      .filter((a) => a.user_id === userId)
      .sort((x, y) => new Date(y.created_at) - new Date(x.created_at));
  },
};

// Run directly: `node db.js --reseed`
if (require.main === module) {
  seed();
} else {
  init();
}

module.exports = api;
