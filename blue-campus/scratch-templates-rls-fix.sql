-- Allow the app (anon key) to read the templates table, matching the other tables it already reads.
create policy "Allow read access" on templates
  for select
  using (true);
