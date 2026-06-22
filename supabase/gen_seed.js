/* Generates seed.sql from the local question bank + test catalogue.
   Run: node supabase/gen_seed.js > supabase/seed.sql            */
const { CGL_TESTS, QUESTION_BANK } = require("../assets/js/data.js");

const esc = (s) => String(s).replace(/'/g, "''");
const lines = [];

lines.push("-- ============================================================");
lines.push("--  Mock Matrix Hub — seed data (auto-generated)");
lines.push("--  Run AFTER schema.sql.");
lines.push("-- ============================================================");
lines.push("");
lines.push("truncate public.questions, public.tests, public.exams restart identity cascade;");
lines.push("");

// exams
lines.push("insert into public.exams (slug, name, description) values");
lines.push("  ('cgl', 'SSC CGL', 'Staff Selection Commission — Combined Graduate Level');");
lines.push("");

// tests
lines.push("insert into public.tests (id, exam_slug, tier, category, title, questions_count, marks, minutes, level, subject, is_free, is_new, sort_order) values");
const testRows = CGL_TESTS.map((t, i) =>
  `  ('${esc(t.id)}', 'cgl', '${t.tier}', '${t.category}', '${esc(t.title)}', ${t.questions}, ${t.marks}, ${t.minutes}, '${esc(t.level)}', '${esc(t.subject)}', ${t.free}, ${t.isNew}, ${i})`
);
lines.push(testRows.join(",\n") + ";");
lines.push("");

// questions
lines.push("insert into public.questions (subject, question, options, answer, explanation) values");
const qRows = [];
for (const [subject, qs] of Object.entries(QUESTION_BANK)) {
  for (const q of qs) {
    const opts = JSON.stringify(q.options).replace(/'/g, "''");
    qRows.push(
      `  ('${esc(subject)}', '${esc(q.q)}', '${opts}'::jsonb, ${q.answer}, '${esc(q.explain)}')`
    );
  }
}
lines.push(qRows.join(",\n") + ";");
lines.push("");

process.stdout.write(lines.join("\n"));
