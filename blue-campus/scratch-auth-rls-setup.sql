-- Run this whole file once in the Supabase SQL editor.
-- It's safe to re-run if something fails partway through.

-- 1) Drop every existing policy on each app table, regardless of name.
--    (boats/instructors were found to already have a leftover anon-only
--    policy from earlier ad-hoc fixes, blocking logged-in staff — this
--    clears any such surprises on every table before we set the real ones.)
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
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = tbl
    loop
      execute format('drop policy %I on public.%I', pol.policyname, tbl);
    end loop;
  end loop;
end $$;

-- 2) Enable RLS on every app table.
alter table public.schools enable row level security;
alter table public.courses enable row level security;
alter table public.instructors enable row level security;
alter table public.boats enable row level security;
alter table public.students enable row level security;
alter table public.registrations enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_participants enable row level security;
alter table public.skill_sets enable row level security;
alter table public.skills enable row level security;
alter table public.skill_tracking enable row level security;
alter table public.transactions enable row level security;
alter table public.templates enable row level security;
alter table public.lesson_template enable row level security;
alter table public.template_groups enable row level security;

-- 3) One blanket policy per table: any logged-in user can do anything.
--    (Phase 1 = single "staff" tier, matches today's behavior exactly,
--    just gated behind login.)
create policy "staff full access" on public.schools for all to authenticated using (true) with check (true);
create policy "staff full access" on public.courses for all to authenticated using (true) with check (true);
create policy "staff full access" on public.instructors for all to authenticated using (true) with check (true);
create policy "staff full access" on public.boats for all to authenticated using (true) with check (true);
create policy "staff full access" on public.students for all to authenticated using (true) with check (true);
create policy "staff full access" on public.registrations for all to authenticated using (true) with check (true);
create policy "staff full access" on public.lessons for all to authenticated using (true) with check (true);
create policy "staff full access" on public.lesson_participants for all to authenticated using (true) with check (true);
create policy "staff full access" on public.skill_sets for all to authenticated using (true) with check (true);
create policy "staff full access" on public.skills for all to authenticated using (true) with check (true);
create policy "staff full access" on public.skill_tracking for all to authenticated using (true) with check (true);
create policy "staff full access" on public.transactions for all to authenticated using (true) with check (true);
create policy "staff full access" on public.templates for all to authenticated using (true) with check (true);
create policy "staff full access" on public.lesson_template for all to authenticated using (true) with check (true);
create policy "staff full access" on public.template_groups for all to authenticated using (true) with check (true);

-- 4) Light groundwork for a future student role — not used by the app yet.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'staff' check (role in ('staff', 'student')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role) values (new.id, new.email, 'staff');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5) Backfill a profile row for any staff account(s) you already created
--    manually before this trigger existed.
insert into public.profiles (id, email, role)
select id, email, 'staff' from auth.users
on conflict (id) do nothing;
