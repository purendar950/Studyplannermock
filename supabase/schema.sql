-- ============================================================
--  Mock Matrix Hub — Supabase schema
--  Run this in the Supabase SQL Editor (or via the CLI) once.
-- ============================================================

-- Clean re-run (safe for dev). Comment these out in production.
drop table if exists public.questions cascade;
drop table if exists public.tests cascade;
drop table if exists public.exams cascade;

-- ---------- exams ----------
create table public.exams (
  id          bigint generated always as identity primary key,
  slug        text not null unique,           -- e.g. 'cgl'
  name        text not null,                  -- 'SSC CGL'
  description text,
  created_at  timestamptz not null default now()
);

-- ---------- tests (the catalogue) ----------
create table public.tests (
  id              text primary key,           -- e.g. 't1-full-01'
  exam_slug       text not null references public.exams(slug) on delete cascade,
  tier            text not null check (tier in ('tier1','tier2')),
  category        text not null check (category in ('full','sectional','subject')),
  title           text not null,
  questions_count int  not null default 0,
  marks           int  not null default 0,
  minutes         int  not null default 0,
  level           text not null default 'Moderate',
  subject         text not null default 'All Sections',
  is_free         boolean not null default true,
  is_new          boolean not null default false,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

-- ---------- questions (subject-keyed pool) ----------
create table public.questions (
  id          bigint generated always as identity primary key,
  subject     text not null,                  -- 'Quant', 'Reasoning', ...
  question    text not null,
  options     jsonb not null,                 -- ["A","B","C","D"]
  answer      int  not null check (answer between 0 and 3),
  explanation text,
  created_at  timestamptz not null default now()
);

create index questions_subject_idx on public.questions (subject);
create index tests_filter_idx      on public.tests (exam_slug, tier, category, sort_order);

-- ============================================================
--  Row Level Security: allow public (anon) READ-ONLY access.
--  Writes are blocked for anon — seed/manage with the service role.
-- ============================================================
alter table public.exams     enable row level security;
alter table public.tests     enable row level security;
alter table public.questions enable row level security;

create policy "public read exams"     on public.exams     for select using (true);
create policy "public read tests"     on public.tests     for select using (true);
create policy "public read questions" on public.questions for select using (true);
