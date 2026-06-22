/* ============================================================
 *  Shared seed data — used by both the file store and Postgres
 *  store to populate an empty database on first run.
 * ============================================================ */
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { CGL_TESTS, QUESTION_BANK } = require("../assets/js/data.js");

function defaultUsers() {
  const adminPass = process.env.ADMIN_PASSWORD || "admin123";
  const userPass = "test1234";
  return [
    {
      id: crypto.randomUUID(),
      email: (process.env.ADMIN_EMAIL || "admin@studyplanner.mock").toLowerCase(),
      full_name: "Site Admin",
      password_hash: bcrypt.hashSync(adminPass, 10),
      role: "admin",
      created_at: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      email: "student@studyplanner.mock",
      full_name: "Demo Student",
      password_hash: bcrypt.hashSync(userPass, 10),
      role: "user",
      created_at: new Date().toISOString(),
    },
  ];
}

function exams() {
  return [
    { slug: "cgl", name: "SSC CGL", description: "Staff Selection Commission — Combined Graduate Level" },
  ];
}

function tests() {
  return CGL_TESTS.map((t, i) => ({
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
  }));
}

function questions() {
  let id = 1;
  const out = [];
  Object.entries(QUESTION_BANK).forEach(([subject, qs]) => {
    qs.forEach((q) => {
      out.push({
        id: id++,
        subject,
        question: q.q,
        options: q.options,
        answer: q.answer,
        explanation: q.explain,
      });
    });
  });
  return out;
}

module.exports = { defaultUsers, exams, tests, questions };
