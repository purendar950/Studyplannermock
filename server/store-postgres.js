/* ============================================================
 *  Postgres-backed store (async) — used in production when
 *  DATABASE_URL is set (e.g. Render Postgres). Creates its schema
 *  on first run and seeds if empty.
 * ============================================================ */
const { Pool } = require("pg");
const seed = require("./seed-data");

const connectionString = process.env.DATABASE_URL;
// Managed Postgres (Render/Heroku/Supabase) needs SSL; allow disabling for local.
const ssl = process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false };
const pool = new Pool({ connectionString, ssl });

const SCHEMA = `
create table if not exists users (
  id uuid primary key,
  email text unique not null,
  full_name text,
  password_hash text not null,
  role text not null default 'user',
  created_at timestamptz not null default now()
);
create table if not exists exams (
  slug text primary key,
  name text not null,
  description text
);
create table if not exists tests (
  id text primary key,
  exam_slug text references exams(slug) on delete cascade,
  tier text, category text, title text,
  questions_count int default 0, marks int default 0, minutes int default 0,
  level text, subject text,
  is_free boolean default true, is_new boolean default false,
  sort_order int default 0
);
create table if not exists questions (
  id bigserial primary key,
  subject text not null,
  question text not null,
  options jsonb not null,
  answer int not null,
  explanation text
);
create table if not exists attempts (
  id bigserial primary key,
  user_id uuid references users(id) on delete cascade,
  test_id text,
  test_title text,
  score numeric, max_marks numeric,
  correct int, wrong int, skipped int, accuracy int,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists attempts_user_idx on attempts (user_id, created_at desc);
create index if not exists questions_subject_idx on questions (subject);
`;

async function q(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

async function doSeed() {
  const users = seed.defaultUsers();
  for (const u of users) {
    await q(
      `insert into users (id,email,full_name,password_hash,role,created_at)
       values ($1,$2,$3,$4,$5,$6) on conflict (email) do nothing`,
      [u.id, u.email, u.full_name, u.password_hash, u.role, u.created_at]
    );
  }
  for (const e of seed.exams()) {
    await q(`insert into exams (slug,name,description) values ($1,$2,$3) on conflict (slug) do nothing`,
      [e.slug, e.name, e.description]);
  }
  for (const t of seed.tests()) {
    await q(
      `insert into tests (id,exam_slug,tier,category,title,questions_count,marks,minutes,level,subject,is_free,is_new,sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) on conflict (id) do nothing`,
      [t.id, t.exam_slug, t.tier, t.category, t.title, t.questions_count, t.marks, t.minutes, t.level, t.subject, t.is_free, t.is_new, t.sort_order]
    );
  }
  for (const ques of seed.questions()) {
    await q(`insert into questions (subject,question,options,answer,explanation) values ($1,$2,$3,$4,$5)`,
      [ques.subject, ques.question, JSON.stringify(ques.options), ques.answer, ques.explanation]);
  }
  console.log("[postgres store] seeded default data");
}

const store = {
  kind: "postgres",

  async init() {
    await pool.query(SCHEMA);
    const [{ count }] = await q(`select count(*)::int as count from exams`);
    if (count === 0) await doSeed();
  },
  async reseed() {
    await q(`truncate attempts, questions, tests, exams, users restart identity cascade`);
    await doSeed();
  },

  // users
  async findUserByEmail(email) {
    const rows = await q(`select * from users where email=$1`, [String(email).toLowerCase()]);
    return rows[0] || null;
  },
  async findUserById(id) {
    const rows = await q(`select * from users where id=$1`, [id]);
    return rows[0] || null;
  },
  async addUser(u) {
    await q(`insert into users (id,email,full_name,password_hash,role,created_at) values ($1,$2,$3,$4,$5,$6)`,
      [u.id, u.email, u.full_name, u.password_hash, u.role, u.created_at]);
    return u;
  },

  // exams
  async exams() { return q(`select * from exams order by slug`); },
  async addExam(e) {
    await q(`insert into exams (slug,name,description) values ($1,$2,$3)`, [e.slug, e.name, e.description]);
    return e;
  },
  async updateExam(slug, patch) {
    const rows = await q(`update exams set name=coalesce($2,name), description=coalesce($3,description) where slug=$1 returning *`,
      [slug, patch.name ?? null, patch.description ?? null]);
    return rows[0] || null;
  },
  async deleteExam(slug) {
    const rows = await q(`delete from exams where slug=$1 returning slug`, [slug]);
    return rows.length > 0;
  },

  // tests
  async tests() { return q(`select * from tests order by sort_order`); },
  async findTest(id) { const rows = await q(`select * from tests where id=$1`, [id]); return rows[0] || null; },
  async addTest(t) {
    await q(
      `insert into tests (id,exam_slug,tier,category,title,questions_count,marks,minutes,level,subject,is_free,is_new,sort_order)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [t.id, t.exam_slug, t.tier, t.category, t.title, t.questions_count, t.marks, t.minutes, t.level, t.subject, t.is_free, t.is_new, t.sort_order]
    );
    return t;
  },
  async updateTest(id, patch) {
    const cols = ["exam_slug", "tier", "category", "title", "questions_count", "marks", "minutes", "level", "subject", "is_free", "is_new", "sort_order"];
    const sets = [], vals = [id];
    cols.forEach((c) => { if (patch[c] !== undefined) { vals.push(patch[c]); sets.push(`${c}=$${vals.length}`); } });
    if (!sets.length) return this.findTest(id);
    const rows = await q(`update tests set ${sets.join(",")} where id=$1 returning *`, vals);
    return rows[0] || null;
  },
  async deleteTest(id) {
    const rows = await q(`delete from tests where id=$1 returning id`, [id]);
    return rows.length > 0;
  },

  // questions
  async questions() { return q(`select * from questions order by id`); },
  async questionsBySubject(subject) { return q(`select * from questions where subject=$1 order by id`, [subject]); },
  async findQuestion(id) { const rows = await q(`select * from questions where id=$1`, [Number(id)]); return rows[0] || null; },
  async addQuestion(qst) {
    const rows = await q(`insert into questions (subject,question,options,answer,explanation) values ($1,$2,$3,$4,$5) returning *`,
      [qst.subject, qst.question, JSON.stringify(qst.options), qst.answer, qst.explanation]);
    return rows[0];
  },
  async updateQuestion(id, patch) {
    const sets = [], vals = [Number(id)];
    ["subject", "question", "answer", "explanation"].forEach((c) => {
      if (patch[c] !== undefined) { vals.push(patch[c]); sets.push(`${c}=$${vals.length}`); }
    });
    if (patch.options !== undefined) { vals.push(JSON.stringify(patch.options)); sets.push(`options=$${vals.length}`); }
    if (!sets.length) return this.findQuestion(id);
    const rows = await q(`update questions set ${sets.join(",")} where id=$1 returning *`, vals);
    return rows[0] || null;
  },
  async deleteQuestion(id) {
    const rows = await q(`delete from questions where id=$1 returning id`, [Number(id)]);
    return rows.length > 0;
  },

  // attempts
  async addAttempt(a) {
    const rows = await q(
      `insert into attempts (user_id,test_id,test_title,score,max_marks,correct,wrong,skipped,accuracy,details)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
      [a.user_id, a.test_id, a.test_title, a.score, a.max_marks, a.correct, a.wrong, a.skipped, a.accuracy,
       a.details ? JSON.stringify(a.details) : null]
    );
    return rows[0];
  },
  async attemptsByUser(userId) {
    return q(`select * from attempts where user_id=$1 order by created_at desc`, [userId]);
  },

  // counts
  async counts() {
    const rows = await q(`select
      (select count(*) from exams)::int as exams,
      (select count(*) from tests)::int as tests,
      (select count(*) from questions)::int as questions,
      (select count(*) from users)::int as users,
      (select count(*) from attempts)::int as attempts`);
    return rows[0];
  },
};

module.exports = store;
