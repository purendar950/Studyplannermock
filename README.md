# Study Planner Mock

A complete, runnable mock-test platform (SSC CGL and more) with user
authentication, saved attempts, and an admin panel — backed by its own REST API.

- **Frontend**: static HTML/CSS/JS (no build step)
- **Backend**: Node + Express, JWT auth, file-backed database (zero native deps)
- **Auth**: signup / login / logout with hashed passwords + JWT sessions
- **Admin panel**: role-secured CRUD for exams, test series and questions
- **Attempts**: every completed test is saved per user and shown on a dashboard

## Run it (2 commands)

```bash
cd server
npm install
npm start
```

Then open <http://localhost:3000>. The database auto-seeds on first run
(1 exam, 17 tests, a question bank) and creates two accounts:

| Role    | Email                          | Password   |
|---------|--------------------------------|------------|
| Admin   | `admin@studyplanner.mock`      | `admin123` |
| Student | `student@studyplanner.mock`    | `test1234` |

> Change the admin credentials with env vars: `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
> Set `JWT_SECRET` in production. Re-seed any time with `npm run seed`.

Sign in as the admin and visit **/admin/** to manage content. Sign in as the
student (or sign up) to take tests and see your results on **/dashboard.html**.

## Project structure

```
.
├── index.html              # landing page
├── login.html / signup.html
├── dashboard.html          # signed-in user's saved attempts
├── test.html               # the test runner (login required)
├── exams/cgl/index.html    # CGL test browser (tier/category filters)
├── admin/index.html        # admin panel (admin role required)
├── assets/
│   ├── css/styles.css
│   └── js/
│       ├── config.js       # API base URL
│       ├── apiClient.js    # fetch + JWT wrapper
│       ├── auth.js         # auth + route guards + navbar widget
│       ├── api.js          # exams/tests/questions/attempts
│       ├── exam.js         # CGL browser
│       ├── test.js         # test engine + scoring
│       ├── admin.js        # admin CRUD
│       └── data.js         # offline fallback sample bank
├── server/
│   ├── server.js           # Express app + REST API
│   ├── db.js               # file-backed store + seed
│   └── package.json
└── supabase/               # OPTIONAL: SQL to run on Supabase instead
```

## REST API

Base URL: `/api` (same origin when served by the Node server).

| Method | Endpoint                       | Auth   | Description                     |
|--------|--------------------------------|--------|---------------------------------|
| POST   | `/auth/signup`                 | –      | Create account, returns JWT     |
| POST   | `/auth/login`                  | –      | Log in, returns JWT             |
| GET    | `/auth/me`                     | user   | Current user                    |
| GET    | `/exams`                       | –      | List exams                      |
| GET    | `/tests?exam=cgl`              | –      | List tests for an exam          |
| GET    | `/tests/:id`                   | –      | Single test                     |
| GET    | `/tests/:id/questions`         | –      | Assembled questions for a test  |
| POST   | `/attempts`                    | user   | Save a completed attempt        |
| GET    | `/attempts`                    | user   | The user's attempts             |
| GET    | `/admin/stats`                 | admin  | Counts                          |
| CRUD   | `/admin/exams`                 | admin  | Manage exams                    |
| CRUD   | `/admin/tests`                 | admin  | Manage test series              |
| CRUD   | `/admin/questions`             | admin  | Manage questions                |

Auth is sent as `Authorization: Bearer <token>`. Admin routes require the
`admin` role; others are rejected with 401/403.

## Deploying (make it live)

This is a Node app that serves both the API and the frontend, so it deploys as
a **single web service**. Two easy options:

### Option A — Render (free, one click)

1. Push this repo to GitHub (already done).
2. Go to <https://render.com> → **New +** → **Blueprint** → connect this repo.
   Render reads [`render.yaml`](./render.yaml) automatically.
3. When prompted, set **ADMIN_PASSWORD** (the admin login password). `JWT_SECRET`
   is generated for you.
4. Click **Apply**. In ~2 minutes you get a live URL like
   `https://studyplannermock.onrender.com` — the full app (auth, tests, admin).

> One-click button (replace the URL if you fork):
> [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/purendar950/Studyplannermock)

### Option B — Any container host (Docker)

A [`Dockerfile`](./Dockerfile) is included. Build and run anywhere
(Railway, Fly.io, Google Cloud Run, a VPS):

```bash
docker build -t studyplannermock .
docker run -p 3000:3000 -e ADMIN_PASSWORD=yourpass -e JWT_SECRET=$(openssl rand -hex 32) studyplannermock
```

### Environment variables

| Variable         | Purpose                              | Default                      |
|------------------|--------------------------------------|------------------------------|
| `PORT`           | Port to listen on (set by the host)  | `3000`                       |
| `JWT_SECRET`     | Secret for signing sessions          | dev fallback (set in prod!)  |
| `ADMIN_EMAIL`    | Seeded admin email                   | `admin@studyplanner.mock`    |
| `ADMIN_PASSWORD` | Seeded admin password                | `admin123` (change it!)      |

> **Note on data:** the bundled file store resets on each redeploy (fine for a
> demo). For permanent accounts/attempts, attach a persistent disk or swap
> `server/db.js` for Postgres — happy to wire that up next.

### Hosting the frontend separately (optional)

If you prefer the static frontend on a CDN (e.g. Cloudflare Pages) and the API
elsewhere, set `API_BASE` in `assets/js/config.js` to your API URL. CORS is
already enabled on the server.

## Alternative: Supabase backend

If you prefer a managed backend, the `supabase/` folder has SQL
(`schema.sql`, `auth.sql`, `seed.sql`) to run on a Supabase project. See
`supabase/README.md`. The default stack above needs no external services.
