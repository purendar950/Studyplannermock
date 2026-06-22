/* ============================================================
 *  File-backed store (async interface) — zero dependencies.
 *  Persists collections to data/db.json. Used for local dev and
 *  any host without a DATABASE_URL.
 * ============================================================ */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const seed = require("./seed-data");

const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function empty() {
  return { users: [], exams: [], tests: [], questions: [], attempts: [], meta: {} };
}
let db = empty();

function persist() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function load() {
  try {
    if (fs.existsSync(DB_FILE)) { db = JSON.parse(fs.readFileSync(DB_FILE, "utf8")); return true; }
  } catch (e) { console.error("db.json unreadable, starting fresh:", e.message); }
  return false;
}

function doSeed() {
  db = empty();
  db.users = seed.defaultUsers();
  db.exams = seed.exams();
  db.tests = seed.tests();
  db.questions = seed.questions();
  db.meta = { seeded_at: new Date().toISOString() };
  persist();
  console.log(`[file store] seeded: ${db.users.length} users, ${db.exams.length} exams, ${db.tests.length} tests, ${db.questions.length} questions`);
}

const store = {
  kind: "file",

  async init() {
    const loaded = load();
    if (!loaded) doSeed();
  },
  async reseed() { doSeed(); },

  // users
  async findUserByEmail(email) { return db.users.find((u) => u.email === String(email).toLowerCase()) || null; },
  async findUserById(id) { return db.users.find((u) => u.id === id) || null; },
  async addUser(user) { db.users.push(user); persist(); return user; },

  // exams
  async exams() { return db.exams.slice(); },
  async addExam(e) { db.exams.push(e); persist(); return e; },
  async updateExam(slug, patch) {
    const e = db.exams.find((x) => x.slug === slug);
    if (!e) return null;
    Object.assign(e, patch); persist(); return e;
  },
  async deleteExam(slug) {
    const before = db.exams.length;
    db.exams = db.exams.filter((x) => x.slug !== slug);
    db.tests = db.tests.filter((t) => t.exam_slug !== slug);
    persist();
    return db.exams.length < before;
  },

  // tests
  async tests() { return db.tests.slice(); },
  async findTest(id) { return db.tests.find((t) => t.id === id) || null; },
  async addTest(t) { db.tests.push(t); persist(); return t; },
  async updateTest(id, patch) {
    const t = db.tests.find((x) => x.id === id);
    if (!t) return null;
    Object.assign(t, patch); persist(); return t;
  },
  async deleteTest(id) {
    const before = db.tests.length;
    db.tests = db.tests.filter((x) => x.id !== id);
    persist();
    return db.tests.length < before;
  },

  // questions
  async questions() { return db.questions.slice(); },
  async questionsBySubject(subject) { return db.questions.filter((q) => q.subject === subject); },
  async findQuestion(id) { return db.questions.find((q) => q.id === Number(id)) || null; },
  async addQuestion(q) {
    const nextId = db.questions.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    const row = { ...q, id: nextId };
    db.questions.push(row); persist(); return row;
  },
  async addQuestionsBulk(arr) {
    let nextId = db.questions.reduce((m, x) => Math.max(m, x.id), 0) + 1;
    const rows = arr.map((q) => ({ ...q, id: nextId++ }));
    db.questions.push(...rows);
    persist();
    return rows;
  },
  async updateQuestion(id, patch) {
    const q = db.questions.find((x) => x.id === Number(id));
    if (!q) return null;
    Object.assign(q, patch); persist(); return q;
  },
  async deleteQuestion(id) {
    const before = db.questions.length;
    db.questions = db.questions.filter((x) => x.id !== Number(id));
    persist();
    return db.questions.length < before;
  },

  // attempts
  async addAttempt(a) {
    const nextId = db.attempts.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
    const row = { ...a, id: nextId, created_at: new Date().toISOString() };
    db.attempts.push(row); persist(); return row;
  },
  async attemptsByUser(userId) {
    return db.attempts
      .filter((a) => a.user_id === userId)
      .sort((x, y) => new Date(y.created_at) - new Date(x.created_at));
  },

  // counts
  async counts() {
    return {
      exams: db.exams.length, tests: db.tests.length, questions: db.questions.length,
      users: db.users.length, attempts: db.attempts.length,
    };
  },
};

module.exports = store;
