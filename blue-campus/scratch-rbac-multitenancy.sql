-- Phase 2: 4-tier RBAC + multi-tenancy.
-- Run this whole file once in the Supabase SQL editor, AFTER the new app
-- code (getCurrentProfile/effectiveSchoolId/getColumns(role)/etc.) is
-- already deployed and verified — see the plan's sequencing section.
-- It's safe to re-run if something fails partway through.

-- ============================================================
-- 1) profiles: new columns. The old role check constraint (only allowed
--    'staff'/'student') is dropped here but NOT replaced yet — the
--    stricter constraint can only go on AFTER existing 'staff' rows are
--    migrated below, otherwise adding it fails immediately by validating
--    against rows that don't satisfy it yet.
-- ============================================================
alter table public.profiles
  add column if not exists school_id integer references public.schools(id),
  add column if not exists student_id integer references public.students(id);

alter table public.profiles drop constraint if exists profiles_role_check;

-- ============================================================
-- 2) Backfill existing data
-- ============================================================
-- Before running the next two statements, sanity-check what's live:
--   select email, role, school_id from public.profiles;
-- There should be exactly one account you want to become 'admin'.

-- Latent bug fix: students.school_id was never set by createStudent/
-- updateStudent, so existing rows are almost certainly NULL. There is only
-- one real school today (id = 2), so backfill to that.
update public.students set school_id = 2 where school_id is null;

-- Same latent bug on boats/courses/instructors: createBoat/createCourse only
-- ever had a working school_id field on their EDIT forms, never on create,
-- and createInstructor never had one at all. Backfill any NULL rows to the
-- one real school so they don't become invisible to school-scoped roles.
update public.boats set school_id = 2 where school_id is null;
update public.courses set school_id = 2 where school_id is null;
update public.instructors set school_id = 2 where school_id is null;

-- Promote your own account to admin (edit the email if needed).
update public.profiles set role = 'admin', school_id = null
  where email = 'dario.linder@msn.com';

-- Everyone else who was a 'staff' account becomes 'school' at the one
-- existing school, matching today's de-facto single-tenant behavior.
update public.profiles set role = 'school', school_id = 2
  where role = 'staff';

-- Now that every row satisfies the new set of allowed values, the
-- stricter constraint can be added safely.
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'school', 'instructor', 'student'));

-- ============================================================
-- 3) handle_new_user(): read role/school_id/student_id from user metadata
--    instead of hardcoding 'staff'. Provision new accounts via Supabase
--    Dashboard -> Authentication -> Invite user (or the Admin API), setting
--    user_metadata: { role, school_id, student_id } at creation time.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role, school_id, student_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'school'),
    nullif(new.raw_user_meta_data->>'school_id', '')::integer,
    nullif(new.raw_user_meta_data->>'student_id', '')::integer
  );
  return new;
end;
$$;

-- ============================================================
-- 4) Helper functions used inside RLS policies (security definer so they
--    can read `profiles` regardless of the calling role's own RLS).
-- ============================================================
create or replace function public.current_role()
returns text language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_school_id()
returns integer language sql stable security definer set search_path = ''
as $$
  select school_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_student_id()
returns integer language sql stable security definer set search_path = ''
as $$
  select student_id from public.profiles where id = auth.uid();
$$;

-- ============================================================
-- 5) Drop every existing policy on each app table (defensively handling
--    template_groups, which may not exist on every environment).
-- ============================================================
do $$
declare
  tbl text;
  pol record;
begin
  foreach tbl in array array[
    'schools', 'courses', 'instructors', 'boats', 'students',
    'registrations', 'lessons', 'lesson_participants', 'skill_sets',
    'skills', 'skill_tracking', 'transactions', 'templates',
    'lesson_template', 'template_groups'
  ]
  loop
    if to_regclass('public.' || tbl) is not null then
      for pol in
        select policyname from pg_policies
        where schemaname = 'public' and tablename = tbl
      loop
        execute format('drop policy %I on public.%I', pol.policyname, tbl);
      end loop;
    end if;
  end loop;
end $$;

-- ============================================================
-- 6) schools: admin-only, full stop.
-- ============================================================
create policy "admin full access" on public.schools
  for all to authenticated
  using (public.current_role() = 'admin')
  with check (public.current_role() = 'admin');

-- ============================================================
-- 7) Shape A: admin + school write; instructor/student read-only (scoped).
--    courses, boats, instructors, registrations, skill_sets, skills all
--    have (or resolve to) a school_id column directly or via one join.
-- ============================================================
create policy "admin full access" on public.courses for all to authenticated
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "school write own" on public.courses for all to authenticated
  using (public.current_role() = 'school' and school_id = public.current_school_id())
  with check (public.current_role() = 'school' and school_id = public.current_school_id());
create policy "scoped read" on public.courses for select to authenticated
  using (public.current_role() in ('instructor', 'student') and school_id = public.current_school_id());

create policy "admin full access" on public.boats for all to authenticated
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "school write own" on public.boats for all to authenticated
  using (public.current_role() = 'school' and school_id = public.current_school_id())
  with check (public.current_role() = 'school' and school_id = public.current_school_id());
create policy "scoped read" on public.boats for select to authenticated
  using (public.current_role() in ('instructor', 'student') and school_id = public.current_school_id());

-- instructors: NOT readable by 'student' (hourly_rate is sensitive).
create policy "admin full access" on public.instructors for all to authenticated
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "school write own" on public.instructors for all to authenticated
  using (public.current_role() = 'school' and school_id = public.current_school_id())
  with check (public.current_role() = 'school' and school_id = public.current_school_id());
create policy "instructor read own school" on public.instructors for select to authenticated
  using (public.current_role() = 'instructor' and school_id = public.current_school_id());

create policy "admin full access" on public.registrations for all to authenticated
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "school write own" on public.registrations for all to authenticated
  using (public.current_role() = 'school' and school_id = public.current_school_id())
  with check (public.current_role() = 'school' and school_id = public.current_school_id());
create policy "instructor read own school" on public.registrations for select to authenticated
  using (public.current_role() = 'instructor' and school_id = public.current_school_id());
create policy "student read own" on public.registrations for select to authenticated
  using (public.current_role() = 'student' and student_id = public.current_student_id());

create policy "admin full access" on public.skill_sets for all to authenticated
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "school write own" on public.skill_sets for all to authenticated
  using (
    public.current_role() = 'school'
    and exists (select 1 from public.courses c where c.id = skill_sets.course_id and c.school_id = public.current_school_id())
  )
  with check (
    public.current_role() = 'school'
    and exists (select 1 from public.courses c where c.id = skill_sets.course_id and c.school_id = public.current_school_id())
  );
create policy "scoped read" on public.skill_sets for select to authenticated
  using (
    public.current_role() in ('instructor', 'student')
    and exists (select 1 from public.courses c where c.id = skill_sets.course_id and c.school_id = public.current_school_id())
  );

create policy "admin full access" on public.skills for all to authenticated
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "school write own" on public.skills for all to authenticated
  using (
    public.current_role() = 'school'
    and exists (
      select 1 from public.skill_sets ss join public.courses c on c.id = ss.course_id
      where ss.id = skills.skill_set and c.school_id = public.current_school_id()
    )
  )
  with check (
    public.current_role() = 'school'
    and exists (
      select 1 from public.skill_sets ss join public.courses c on c.id = ss.course_id
      where ss.id = skills.skill_set and c.school_id = public.current_school_id()
    )
  );
create policy "scoped read" on public.skills for select to authenticated
  using (
    public.current_role() in ('instructor', 'student')
    and exists (
      select 1 from public.skill_sets ss join public.courses c on c.id = ss.course_id
      where ss.id = skills.skill_set and c.school_id = public.current_school_id()
    )
  );

-- ============================================================
-- 8) Shape B: admin + school + instructor write; student read-only-own.
--    lessons, lesson_participants, transactions, students.
-- ============================================================
create policy "admin full access" on public.lessons for all to authenticated
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "school+instructor write own" on public.lessons for all to authenticated
  using (public.current_role() in ('school', 'instructor') and school_id = public.current_school_id())
  with check (public.current_role() in ('school', 'instructor') and school_id = public.current_school_id());
create policy "student read own" on public.lessons for select to authenticated
  using (
    public.current_role() = 'student'
    and exists (
      select 1 from public.lesson_participants lp
      where lp.lesson_id = lessons.id and lp.student_id = public.current_student_id()
    )
  );

create policy "admin full access" on public.lesson_participants for all to authenticated
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "school+instructor write own" on public.lesson_participants for all to authenticated
  using (
    public.current_role() in ('school', 'instructor')
    and exists (select 1 from public.lessons l where l.id = lesson_participants.lesson_id and l.school_id = public.current_school_id())
  )
  with check (
    public.current_role() in ('school', 'instructor')
    and exists (select 1 from public.lessons l where l.id = lesson_participants.lesson_id and l.school_id = public.current_school_id())
  );
create policy "student read own" on public.lesson_participants for select to authenticated
  using (public.current_role() = 'student' and student_id = public.current_student_id());

create policy "admin full access" on public.transactions for all to authenticated
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "school+instructor write own" on public.transactions for all to authenticated
  using (public.current_role() in ('school', 'instructor') and school_id = public.current_school_id())
  with check (public.current_role() in ('school', 'instructor') and school_id = public.current_school_id());
create policy "student read own" on public.transactions for select to authenticated
  using (public.current_role() = 'student' and student_id = public.current_student_id());

create policy "admin full access" on public.students for all to authenticated
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "school+instructor write own" on public.students for all to authenticated
  using (public.current_role() in ('school', 'instructor') and school_id = public.current_school_id())
  with check (public.current_role() in ('school', 'instructor') and school_id = public.current_school_id());
create policy "student read own" on public.students for select to authenticated
  using (public.current_role() = 'student' and id = public.current_student_id());

-- skill_tracking: same Shape-B write group (editing tracked skills is part
-- of "editing students/registrations"), scoped indirectly via registrations.
create policy "admin full access" on public.skill_tracking for all to authenticated
  using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy "school+instructor write own" on public.skill_tracking for all to authenticated
  using (
    public.current_role() in ('school', 'instructor')
    and exists (select 1 from public.registrations r where r.id = skill_tracking.student_registration and r.school_id = public.current_school_id())
  )
  with check (
    public.current_role() in ('school', 'instructor')
    and exists (select 1 from public.registrations r where r.id = skill_tracking.student_registration and r.school_id = public.current_school_id())
  );
create policy "student read own" on public.skill_tracking for select to authenticated
  using (
    public.current_role() = 'student'
    and exists (select 1 from public.registrations r where r.id = skill_tracking.student_registration and r.student_id = public.current_student_id())
  );

-- ============================================================
-- 9) Global/shared, low-sensitivity tables: admin + school only.
--    Known accepted limitation: no per-school scoping of template rows
--    themselves (see plan doc) — revisit only if it causes real problems.
-- ============================================================
create policy "admin+school access" on public.templates for all to authenticated
  using (public.current_role() in ('admin', 'school')) with check (public.current_role() in ('admin', 'school'));

do $$
begin
  if to_regclass('public.lesson_template') is not null then
    execute 'create policy "admin+school access" on public.lesson_template for all to authenticated using (public.current_role() in (''admin'', ''school'')) with check (public.current_role() in (''admin'', ''school''))';
  end if;
  if to_regclass('public.template_groups') is not null then
    execute 'create policy "admin+school access" on public.template_groups for all to authenticated using (public.current_role() in (''admin'', ''school'')) with check (public.current_role() in (''admin'', ''school''))';
  end if;
end $$;

-- ============================================================
-- Verification queries to run after this script:
--   select count(*) from public.students where school_id is null;  -- expect 0
--   select id, email, role, school_id, student_id from public.profiles;
-- ============================================================
