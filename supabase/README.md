# Study Planner Mock — Supabase backend

A free mock-test platform (SSC CGL and more) with **Supabase** for the database,
**Supabase Auth** for accounts, and a built-in **admin panel** to manage exams,
test series and questions. The app runs in a read-only **demo mode** if Supabase
is not configured, so it never breaks.

## 1. Create a project

Sign up at <https://supabase.com>, create a project, and wait for the database.

## 2. Run the SQL (in order, in the SQL Editor)

1. [`schema.sql`](./schema.sql) — `exams`, `tests`, `questions` + public read RLS.
2. [`auth.sql`](./auth.sql) — `profiles`, `attempts`, the `is_admin()` helper,
   the signup trigger, and **admin-only write policies**.
3. [`seed.sql`](./seed.sql) — sample exam, test catalogue and question bank.
   Regenerate any time: `node supabase/gen_seed.js > supabase/seed.sql`.

## 3. Connect the frontend

**Project Settings → API**, copy the **Project URL** and **anon public** key into
[`assets/js/config.js`](../assets/js/config.js):

```js
window.MMH_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT-ref.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-PUBLIC-KEY",
};
```

The anon key is safe in the browser — Row Level Security only allows:
- **public** to `SELECT` exams/tests/questions,
- **signed-in users** to read/insert their own `attempts` and read their own `profile`,
- **admins** to insert/update/delete exams/tests/questions.

## 4. Create your first admin

1. Sign up through the app (`signup.html`).
2. In the Supabase SQL Editor, promote yourself:

   ```sql
   update public.profiles set is_admin = true
   where email = 'you@example.com';
   ```

3. Visit `/admin/` — you now have full management access.

## Authentication

- **Sign up / Sign in / Sign out** via Supabase Auth (email + password).
- Sessions persist across reloads (`assets/js/auth.js`).
- The navbar shows the signed-in user with a menu (My Attempts, Admin Panel, Sign out).
- **Taking a test requires login**; results are saved to the `attempts` table and
  shown on `dashboard.html`.
- A trigger prevents users from granting themselves admin rights.

## Admin panel (`/admin/`)

Admin-only (enforced by both the UI guard and RLS). Provides full CRUD for:

- **Exams** — slug, name, description.
- **Test series** — id, exam, tier, category, title, question/marks/time, level, flags.
- **Questions** — subject, question text, four options, correct answer, explanation
  (filterable by subject).

## Adding questions manually (SQL)

| column        | example                                  |
|---------------|------------------------------------------|
| `subject`     | `'Quant'`                                |
| `question`    | `'If 20% of a number is 50, ...'`        |
| `options`     | `'["200","250","150","300"]'::jsonb`     |
| `answer`      | `1`  (0-based index of the correct option) |
| `explanation` | `'0.20x = 50 → x = 250.'`                |
