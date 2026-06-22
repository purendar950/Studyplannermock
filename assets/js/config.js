/* ============================================================
 *  Mock Matrix Hub — Supabase configuration
 *
 *  1. Create a project at https://supabase.com
 *  2. Run  supabase/schema.sql  then  supabase/seed.sql  in the SQL editor
 *  3. Project Settings → API → copy the Project URL and the anon public key
 *  4. Paste them below.
 *
 *  The anon key is safe to expose in the browser: the database has
 *  Row Level Security enabled with public READ-ONLY access only.
 *
 *  If these are left as placeholders, the app automatically falls back
 *  to the bundled local question bank (demo mode) so it still works.
 * ============================================================ */
window.MMH_CONFIG = {
  SUPABASE_URL: "https://YOUR-PROJECT-ref.supabase.co",
  SUPABASE_ANON_KEY: "YOUR-ANON-PUBLIC-KEY",
};
