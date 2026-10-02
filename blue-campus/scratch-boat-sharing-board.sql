-- Shows other schools' bookings of shared boats on the lessons board.
-- Run once in the Supabase SQL editor (safe to re-run). Requires
-- scratch-boat-sharing.sql to have been run already.
--
-- Returns ONLY: date, time, boat, and which school booked it — never the
-- course, instructor, or students — for boats the caller's school owns or has
-- been given access to, and only for the last 14 days onwards.

create or replace function public.other_school_boat_bookings(p_school_id integer default null)
returns table (
  busy_lesson_id bigint,
  busy_date text,
  busy_start text,
  busy_end text,
  busy_boat_id bigint,
  busy_boat_name text,
  busy_school_name text
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_role text := public.current_role();
  v_target integer;
begin
  if v_role = 'admin' then
    v_target := p_school_id;
  elsif v_role in ('school', 'instructor') then
    v_target := public.current_school_id();
  else
    return;
  end if;

  if v_target is null then
    return;
  end if;

  return query
    select
      l.id::bigint,
      l.date::text,
      l.start_time::text,
      l.end_time::text,
      b.id::bigint,
      b.name::text,
      s.name::text
    from public.lessons l
    join public.boats b on b.id = l.boat_id
    left join public.schools s on s.id = l.school_id
    where l.school_id is distinct from v_target
      and coalesce(l.status, '') <> 'Cancelled'
      and l.date::text >= to_char(current_date - 14, 'YYYY-MM-DD')
      and (
        b.school_id = v_target
        or exists (
          select 1 from public.boat_shares sh
          where sh.boat_id = b.id and sh.school_id = v_target
        )
      );
end;
$$;
