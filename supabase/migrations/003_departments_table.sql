-- Create departments reference table (replaces hardcoded enum)
create table if not exists departments (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Seed with existing departments
insert into departments (key, label, sort_order) values
  ('town_planning', 'Town Planning', 1),
  ('electricity', 'Electricity', 2),
  ('water_sewer', 'Water & Sewer', 3),
  ('roads_stormwater', 'Roads & Storm Water', 4),
  ('environmental', 'Environmental Affairs', 5),
  ('building_control', 'Building Control', 6)
on conflict (key) do nothing;

-- RLS
alter table departments enable row level security;

create policy "Authenticated users can read departments"
  on departments for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert departments"
  on departments for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete departments"
  on departments for delete
  using (auth.role() = 'authenticated');
