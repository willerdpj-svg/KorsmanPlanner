-- Korsman Town Planning Project Management Tool
-- Initial database schema

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  title text, -- e.g. "Pr. Pln"
  role text not null default 'planner' check (role in ('admin', 'planner', 'viewer')),
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- MUNICIPALITIES
-- ============================================================
create table municipalities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text unique not null,
  province text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- APPLICATION TYPES
-- ============================================================
create table application_types (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  description text,
  sort_order int not null default 0
);

-- ============================================================
-- CLIENTS
-- ============================================================
create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone_landline text,
  phone_cell text,
  email text,
  postal_address text,
  physical_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PROJECTS (central table)
-- ============================================================
create table projects (
  id uuid primary key default uuid_generate_v4(),
  file_number text unique not null,
  portal_reference text,
  scheme_number text,
  sp_number text,
  application_type_id uuid references application_types(id),
  municipality_id uuid references municipalities(id),
  client_id uuid references clients(id),
  legal_description text,
  physical_address text,
  present_zoning text,
  zoning_applied_for text,
  current_step int not null default 1 check (current_step between 1 and 7),
  status text not null default 'active' check (status in ('active', 'approved', 'cancelled', 'not_approved', 'on_hold')),
  legal_status text,

  -- Quotation
  quotation_number text,
  quotation_date date,
  quotation_amount numeric(12,2),
  date_accepting date,

  -- Application process dates
  application_submission_date date,
  proof_of_ads_date date,
  bondholder_consent_requested date,
  bondholder_consent_received date,
  bondholder_consent_submitted date,
  objections boolean default false,
  objections_comment text,
  hearing_date date,
  approval_date date,

  -- Bulk services
  bulk_services_amount numeric(12,2),
  bulk_services_payment_date date,
  bulk_services_submitted_to_council date,

  -- Final stages
  proof_of_payment_fines text,
  final_maps_submitted date,
  final_maps_approved date,
  rrc_date date,
  proclamation_date date,
  consent_70_70_received date,
  consent_type text,
  sanral_comments text,

  -- Progress
  sr_progress text,
  client_progress_sent date,

  -- Assignment
  assigned_planner_id uuid references profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- DEPARTMENT COMMENTS
-- ============================================================
create table department_comments (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  department text not null check (department in (
    'electricity', 'water_sewer', 'roads_stormwater',
    'environmental', 'building_control', 'town_planning'
  )),
  status text not null default 'pending' check (status in ('pending', 'requested', 'received')),
  requested_date date,
  received_date date,
  comments text,
  unique (project_id, department)
);

-- ============================================================
-- PROJECT NOTES
-- ============================================================
create table project_notes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  author_id uuid references profiles(id),
  content text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INVOICES
-- ============================================================
create table invoices (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  invoice_number text,
  amount numeric(12,2) not null default 0,
  date_issued date,
  amount_paid numeric(12,2) not null default 0,
  payment_notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
create table payments (
  id uuid primary key default uuid_generate_v4(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  amount numeric(12,2) not null,
  payment_date date,
  reference text,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PROGRESS REPORTS
-- ============================================================
create table progress_reports (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  report_number int not null,
  generated_by uuid references profiles(id),
  narrative text,
  pdf_storage_path text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_projects_client on projects(client_id);
create index idx_projects_status on projects(status);
create index idx_projects_step on projects(current_step);
create index idx_projects_municipality on projects(municipality_id);
create index idx_projects_type on projects(application_type_id);
create index idx_department_comments_project on department_comments(project_id);
create index idx_project_notes_project on project_notes(project_id, created_at desc);
create index idx_invoices_project on invoices(project_id);
create index idx_payments_invoice on payments(invoice_id);
create index idx_progress_reports_project on progress_reports(project_id);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create trigger clients_updated_at
  before update on clients
  for each row execute function update_updated_at();

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ============================================================
-- TRIGGER: recalculate invoice amount_paid from payments
-- ============================================================
create or replace function recalculate_invoice_paid()
returns trigger as $$
begin
  update invoices
  set amount_paid = coalesce((
    select sum(amount) from payments where invoice_id = coalesce(new.invoice_id, old.invoice_id)
  ), 0)
  where id = coalesce(new.invoice_id, old.invoice_id);
  return null;
end;
$$ language plpgsql;

create trigger payments_recalculate
  after insert or update or delete on payments
  for each row execute function recalculate_invoice_paid();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table municipalities enable row level security;
alter table application_types enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table department_comments enable row level security;
alter table project_notes enable row level security;
alter table invoices enable row level security;
alter table payments enable row level security;
alter table progress_reports enable row level security;

-- All authenticated users get full access (internal staff tool)
create policy "Authenticated read" on profiles for select using (auth.uid() is not null);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Admin insert profiles" on profiles for insert with check (auth.uid() is not null);

create policy "Authenticated full access" on municipalities for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Authenticated full access" on application_types for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Authenticated full access" on clients for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Authenticated full access" on projects for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Authenticated full access" on department_comments for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Authenticated full access" on project_notes for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Authenticated full access" on invoices for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Authenticated full access" on payments for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Authenticated full access" on progress_reports for all using (auth.uid() is not null) with check (auth.uid() is not null);
