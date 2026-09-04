create table template_groups (
  id serial primary key,
  name text not null,
  created_at timestamptz not null default now()
);

insert into template_groups (name) values ('Weekday'), ('Weekend');

alter table lesson_template
  add constraint lesson_template_template_fkey
  foreign key (template) references template_groups(id);
