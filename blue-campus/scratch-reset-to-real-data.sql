-- Wipes all sample/test data AND the schools themselves, leaving only your
-- own admin account, so you can start entering the real schools' real data.
--
-- Deliberately NOT touched: `templates`/`lesson_template`/`template_groups`
-- (generic scheduling shapes, not tied to any specific school — no need to
-- wipe these). Run scratch-fix-lesson-participants-recursion.sql first if
-- you haven't already; this script doesn't depend on it but assumes RLS is
-- already in its final state.

-- Safety net: detach any non-admin profile from a school/student row before
-- those rows are deleted below (should be a no-op if you already deleted
-- the 3 test accounts in Step 1, since only your admin profile should
-- remain, and it already has both set to null).
update public.profiles set school_id = null, student_id = null where role <> 'admin';

-- Delete children before parents, respecting foreign keys.
delete from public.skill_tracking;
delete from public.lesson_participants;
delete from public.transactions;
delete from public.skills;
delete from public.skill_sets;
delete from public.registrations;
delete from public.lessons;
delete from public.students;
delete from public.instructors;
delete from public.boats;
delete from public.courses;
delete from public.schools;

-- Verify: every count below should be 0 except profiles, which should be 1
-- (just your own admin account).
select
  (select count(*) from public.schools) as schools,
  (select count(*) from public.courses) as courses,
  (select count(*) from public.instructors) as instructors,
  (select count(*) from public.boats) as boats,
  (select count(*) from public.students) as students,
  (select count(*) from public.registrations) as registrations,
  (select count(*) from public.lessons) as lessons,
  (select count(*) from public.lesson_participants) as lesson_participants,
  (select count(*) from public.skill_sets) as skill_sets,
  (select count(*) from public.skills) as skills,
  (select count(*) from public.skill_tracking) as skill_tracking,
  (select count(*) from public.transactions) as transactions,
  (select count(*) from public.profiles) as profiles;
