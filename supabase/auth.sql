-- ============================================================
--  Study Planner Mock — Auth, roles, attempts & admin policies
--  Run AFTER schema.sql.
--
--  Uses Supabase Auth (auth.users). Adds:
--   - profiles            : 1:1 with auth.users, holds is_admin flag
--   - attempts            : saved test results per user
--   - is_admin()          : helper used by RLS policies
--   - auto profile creation trigger on signup
--   - admin-only write policies on exams / tests / questions
-- ============================================================

-- ---------- profiles ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ---------- is_admin() helper (defined BEFORE policies that use it) ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Users can read their own profile; admins can read everyone's.
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

-- Users can update their own profile (privilege escalation blocked by trigger below).
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- prevent users from granting themselves admin ----------
create or replace function public.guard_admin_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin and not public.is_admin() then
    raise exception 'Only admins can change the is_admin flag';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_admin_flag_trg on public.profiles;
create trigger guard_admin_flag_trg
  before update on public.profiles
  for each row execute function public.guard_admin_flag();

-- ---------- auto-create a profile when a user signs up ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- attempts (saved results) ----------
create table if not exists public.attempts (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  test_id    text not null references public.tests(id) on delete cascade,
  test_title text,
  score      numeric not null,
  max_marks  numeric not null,
  correct    int not null,
  wrong      int not null,
  skipped    int not null,
  accuracy   int not null,
  details    jsonb,
  created_at timestamptz not null default now()
);

create index if not exists attempts_user_idx on public.attempts (user_id, created_at desc);

alter table public.attempts enable row level security;

drop policy if exists "insert own attempts" on public.attempts;
create policy "insert own attempts" on public.attempts
  for insert with check (auth.uid() = user_id);

drop policy if exists "read own attempts" on public.attempts;
create policy "read own attempts" on public.attempts
  for select using (auth.uid() = user_id or public.is_admin());

-- ============================================================
--  Admin-only WRITE policies on content tables.
--  (Public SELECT policies from schema.sql remain in effect.)
-- ============================================================
drop policy if exists "admin write exams"     on public.exams;
drop policy if exists "admin write tests"     on public.tests;
drop policy if exists "admin write questions" on public.questions;

create policy "admin write exams" on public.exams
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin write tests" on public.tests
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin write questions" on public.questions
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
--  Promote a user to admin (run once, replace the email):
--    update public.profiles set is_admin = true
--    where email = 'you@example.com';
-- ============================================================
