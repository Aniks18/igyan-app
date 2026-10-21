-- iGyan RLS baseline — REVIEW BEFORE APPLYING
--
-- STATUS: UNVERIFIED. Not tested against the live database.
-- PREREQUISITE: migrate authentication to Supabase Auth with
--   public.users.id = auth.uid() for every account. Today's app signs in
--   through a custom users/password_hash table over the anon key, under
--   which THESE POLICIES WOULD DENY EVERYTHING (anon has no JWT identity).
--   Do not apply until that migration is done; test in staging first.
--
-- Tables covered: every table referenced by .from() in services/, utils/,
-- pages/ and app/ as of this writing (22 tables).

-- ─── Helpers ────────────────────────────────────────────────────────────────

create or replace function public.app_user_role()
returns text
language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid()
$$;

create or replace function public.app_user_school()
returns uuid
language sql stable security definer set search_path = public as $$
  select school_id from public.users where id = auth.uid()
$$;

create or replace function public.is_staff()
returns boolean
language sql stable as $$
  select public.app_user_role() in
    ('super_admin', 'co_admin', 'faculty', 'b2c_mentor')
$$;

create or replace function public.is_admin()
returns boolean
language sql stable as $$
  select public.app_user_role() in ('super_admin', 'co_admin')
$$;

-- Prevent privilege escalation: only admins may change a user's role or
-- school. Signups always land on the least-privilege default.
create or replace function public.guard_user_privileges()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    if new.role not in ('student', 'b2c_student') then
      new.role := 'student';
    end if;
    return new;
  end if;
  if new.role is distinct from old.role
     or new.school_id is distinct from old.school_id then
    if not public.is_admin() then
      raise exception 'Only admins may change role or school.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_user_privileges on public.users;
create trigger trg_guard_user_privileges
  before insert or update on public.users
  for each row execute function public.guard_user_privileges();

-- ─── users ──────────────────────────────────────────────────────────────────

alter table public.users enable row level security;

drop policy if exists users_select on public.users;
create policy users_select on public.users for select to authenticated
  using (id = auth.uid() or public.app_user_school() = school_id);

drop policy if exists users_insert on public.users;
create policy users_insert on public.users for insert to authenticated
  with check (true);

drop policy if exists users_update on public.users;
create policy users_update on public.users for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ─── sessions (legacy custom sessions; drop after Supabase Auth migration) ──

alter table public.sessions enable row level security;

drop policy if exists sessions_self on public.sessions;
create policy sessions_self on public.sessions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─── schools ────────────────────────────────────────────────────────────────

alter table public.schools enable row level security;

drop policy if exists schools_read on public.schools;
create policy schools_read on public.schools for select to authenticated
  using (id = public.app_user_school());

drop policy if exists schools_admin_write on public.schools;
create policy schools_admin_write on public.schools
  for all to authenticated
  using (public.is_admin() and id = public.app_user_school())
  with check (public.is_admin() and id = public.app_user_school());

-- ─── School-scoped tables ──────────────────────────────────────────────────
-- Read: anyone in the same school. Write: staff of the same school,
-- with user-management tables restricted to admins.
-- Tables: academic_sessions, subjects, classes, class_students,
-- class_subjects, faculty_assignments, faculty_profiles, student_profiles,
-- timetable_templates, timetable_days, timetable_slots, timetable_entries,
-- timetable_daily_records, timetable_daily_entries.

do $$
declare t text;
begin
  foreach t in array array[
    'academic_sessions', 'subjects', 'classes', 'class_students',
    'class_subjects', 'faculty_assignments', 'faculty_profiles',
    'student_profiles', 'timetable_templates', 'timetable_days',
    'timetable_slots', 'timetable_entries',
    'timetable_daily_records', 'timetable_daily_entries'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I_read on public.%I;', t || '_school', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (school_id = public.app_user_school());',
      t || '_school_read', t);
    execute format('drop policy if exists %I on public.%I;', t || '_staff_write', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_staff() and school_id = public.app_user_school()) with check (public.is_staff() and school_id = public.app_user_school());',
      t || '_staff_write', t);
  end loop;
end $$;

-- ─── Parent ↔ teacher messaging ─────────────────────────────────────────────
-- A participant sees only conversations they belong to; writes are limited
-- to participants. Mirrors the client-side assertParticipant() checks.

alter table public.parent_teacher_conversations enable row level security;
alter table public.parent_teacher_messages enable row level security;
alter table public.parent_teacher_call_logs enable row level security;
alter table public.parent_complaints enable row level security;

drop policy if exists ptc_participant on public.parent_teacher_conversations;
create policy ptc_participant on public.parent_teacher_conversations
  for all to authenticated
  using (parent_id = auth.uid() or teacher_id = auth.uid())
  with check (parent_id = auth.uid() or teacher_id = auth.uid());

drop policy if exists ptm_participant on public.parent_teacher_messages;
create policy ptm_participant on public.parent_teacher_messages
  for all to authenticated
  using (exists (
    select 1 from public.parent_teacher_conversations c
    where c.id = conversation_id
      and (c.parent_id = auth.uid() or c.teacher_id = auth.uid())
  ))
  with check (exists (
    select 1 from public.parent_teacher_conversations c
    where c.id = conversation_id
      and (c.parent_id = auth.uid() or c.teacher_id = auth.uid())
  ));

drop policy if exists ptcl_participant on public.parent_teacher_call_logs;
create policy ptcl_participant on public.parent_teacher_call_logs
  for all to authenticated
  using (exists (
    select 1 from public.parent_teacher_conversations c
    where c.id = conversation_id
      and (c.parent_id = auth.uid() or c.teacher_id = auth.uid())
  ))
  with check (exists (
    select 1 from public.parent_teacher_conversations c
    where c.id = conversation_id
      and (c.parent_id = auth.uid() or c.teacher_id = auth.uid())
  ));

-- Complaints: parents see/file their own; staff of the same school see all.
drop policy if exists pc_access on public.parent_complaints;
create policy pc_access on public.parent_complaints
  for all to authenticated
  using (parent_id = auth.uid()
         or (public.is_staff() and school_id = public.app_user_school()))
  with check (parent_id = auth.uid()
         or (public.is_staff() and school_id = public.app_user_school()));

-- Parent ↔ student links: parents see their own rows; staff see same-school.
alter table public.parent_student_assignments enable row level security;

drop policy if exists psa_access on public.parent_student_assignments;
create policy psa_access on public.parent_student_assignments
  for all to authenticated
  using (parent_id = auth.uid()
         or (public.is_staff() and school_id = public.app_user_school()))
  with check (parent_id = auth.uid()
         or (public.is_staff() and school_id = public.app_user_school()));
