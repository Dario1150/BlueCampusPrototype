-- Fixes: "infinite recursion detected in policy for relation lesson_participants"
--
-- Cause: lesson_participants' write policy checked lessons.school_id via a
-- direct subquery into lessons, while lessons' student-read policy checked
-- lesson_participants via a direct subquery back into lesson_participants.
-- Any query joining both tables (e.g. selecting a lesson with its
-- participants embedded) makes Postgres detect this as a policy cycle.
--
-- Fix: route both cross-table checks through security definer functions,
-- which don't re-trigger the referenced table's own RLS evaluation.

create or replace function public.lesson_school_id(p_lesson_id bigint)
returns integer language sql stable security definer set search_path = ''
as $$
  select school_id from public.lessons where id = p_lesson_id;
$$;

create or replace function public.is_lesson_participant(p_lesson_id bigint, p_student_id integer)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.lesson_participants
    where lesson_id = p_lesson_id and student_id = p_student_id
  );
$$;

drop policy if exists "student read own" on public.lessons;
create policy "student read own" on public.lessons for select to authenticated
  using (
    public.current_role() = 'student'
    and public.is_lesson_participant(lessons.id, public.current_student_id())
  );

drop policy if exists "school+instructor write own" on public.lesson_participants;
create policy "school+instructor write own" on public.lesson_participants for all to authenticated
  using (
    public.current_role() in ('school', 'instructor')
    and public.lesson_school_id(lesson_participants.lesson_id) = public.current_school_id()
  )
  with check (
    public.current_role() in ('school', 'instructor')
    and public.lesson_school_id(lesson_participants.lesson_id) = public.current_school_id()
  );
