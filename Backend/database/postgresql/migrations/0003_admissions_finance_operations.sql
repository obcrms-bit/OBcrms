-- Trust Education Foundation SaaS
-- Migration 0003: university catalog, admissions, visa, finance, and commissions

do $$
begin
  if not exists (select 1 from pg_type where typname = 'application_status_enum') then
    create type application_status_enum as enum ('draft', 'in_progress', 'submitted', 'offered', 'enrolled', 'rejected', 'closed');
  end if;
  if not exists (select 1 from pg_type where typname = 'visa_status_enum') then
    create type visa_status_enum as enum ('not_started', 'preparing', 'submitted', 'interview', 'approved', 'refused', 'closed');
  end if;
  if not exists (select 1 from pg_type where typname = 'invoice_status_enum') then
    create type invoice_status_enum as enum ('draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'payment_status_enum') then
    create type payment_status_enum as enum ('pending', 'succeeded', 'failed', 'reversed', 'refunded');
  end if;
  if not exists (select 1 from pg_type where typname = 'commission_status_enum') then
    create type commission_status_enum as enum ('pending', 'approved', 'paid', 'cancelled', 'disputed');
  end if;
end $$;

-- University master catalog managed per tenant.
create table if not exists universities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  name varchar(180) not null,
  country_code varchar(8) not null,
  city varchar(80),
  website_url text,
  ranking_text varchar(80),
  metadata_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_universities_tenant_name_country on universities (tenant_id, lower(name), country_code) where deleted_at is null;
create index if not exists idx_universities_country on universities (tenant_id, country_code, is_active);

-- Program and course catalog linked to a university.
create table if not exists programs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  university_id uuid not null references universities(id) on delete restrict,
  name varchar(180) not null,
  country_code varchar(8) not null,
  discipline varchar(120),
  level_name varchar(80),
  duration_months integer,
  intake_options jsonb not null default '[]'::jsonb,
  tuition_fee numeric(12,2),
  currency_code varchar(8),
  ielts_requirement numeric(4,1),
  pte_requirement numeric(5,1),
  toefl_requirement numeric(5,1),
  scholarship_info_jsonb jsonb not null default '{}'::jsonb,
  metadata_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_programs_scope_name on programs (tenant_id, university_id, lower(name), coalesce(level_name, '')) where deleted_at is null;
create index if not exists idx_programs_catalog_search on programs (tenant_id, country_code, level_name, tuition_fee);

-- Country or scope-specific application stages.
create table if not exists application_stages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  country_code varchar(8) not null,
  code varchar(50) not null,
  label varchar(120) not null,
  stage_order integer not null,
  is_terminal boolean not null default false,
  color_hex varchar(16),
  settings_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_application_stages_country_code on application_stages (tenant_id, country_code, code) where deleted_at is null;
create index if not exists idx_application_stages_scope_order on application_stages (tenant_id, country_code, stage_order);

-- Main admissions application record.
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid not null references branches(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  lead_id uuid null references leads(id) on delete set null,
  university_id uuid not null references universities(id) on delete restrict,
  program_id uuid not null references programs(id) on delete restrict,
  partner_id uuid null references partners(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  assigned_officer_id uuid null references users(id) on delete set null,
  country_code varchar(8) not null,
  workflow_definition_id uuid null,
  current_stage_id uuid null references application_stages(id) on delete set null,
  status application_status_enum not null default 'draft',
  intake_label varchar(80),
  academic_year varchar(20),
  priority varchar(16) not null default 'normal',
  application_fee numeric(12,2),
  currency_code varchar(8),
  timeline_snapshot_jsonb jsonb not null default '{}'::jsonb,
  document_state_jsonb jsonb not null default '{}'::jsonb,
  decision_meta_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create index if not exists idx_applications_assignment on applications (tenant_id, branch_id, assigned_officer_id, status);
create index if not exists idx_applications_country_stage on applications (tenant_id, country_code, current_stage_id);
create index if not exists idx_applications_student_program on applications (student_id, program_id);

-- Immutable application stage transition history.
create table if not exists application_stage_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  application_id uuid not null references applications(id) on delete restrict,
  from_stage_id uuid null references application_stages(id) on delete set null,
  to_stage_id uuid not null references application_stages(id) on delete restrict,
  changed_by uuid null references users(id) on delete set null,
  changed_at timestamptz not null default now(),
  reason text,
  metadata_jsonb jsonb not null default '{}'::jsonb
);

create index if not exists idx_application_stage_history_timeline on application_stage_history (application_id, changed_at desc);
create index if not exists idx_application_stage_history_stage on application_stage_history (tenant_id, to_stage_id, changed_at desc);

-- Visa processing linked to application and student.
create table if not exists visa_cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid not null references branches(id) on delete restrict,
  application_id uuid not null references applications(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  assigned_officer_id uuid null references users(id) on delete set null,
  country_code varchar(8) not null,
  status visa_status_enum not null default 'not_started',
  priority varchar(16) not null default 'normal',
  submission_date date null,
  decision_date date null,
  decision_result varchar(24) null,
  checklist_state_jsonb jsonb not null default '{}'::jsonb,
  meta_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_visa_cases_application on visa_cases (application_id) where deleted_at is null;
create index if not exists idx_visa_cases_country_status on visa_cases (tenant_id, country_code, status);

-- Invoice header for service, application, visa, and tuition-related billing.
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid not null references branches(id) on delete restrict,
  student_id uuid null references students(id) on delete set null,
  application_id uuid null references applications(id) on delete set null,
  invoice_number varchar(40) not null,
  invoice_type varchar(32) not null,
  status invoice_status_enum not null default 'draft',
  issue_date date not null,
  due_date date not null,
  currency_code varchar(8) not null,
  subtotal_amount numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  balance_amount numeric(12,2) not null default 0,
  notes text,
  meta_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_invoices_tenant_number on invoices (tenant_id, invoice_number) where deleted_at is null;
create index if not exists idx_invoices_status_due on invoices (tenant_id, status, due_date);
create index if not exists idx_invoices_student_issue_date on invoices (student_id, issue_date desc);

-- Normalized invoice lines for fee reporting and tax calculations.
create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  invoice_id uuid not null references invoices(id) on delete restrict,
  fee_type_key varchar(60) not null,
  description varchar(240) not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  meta_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists idx_invoice_items_invoice on invoice_items (invoice_id);
create index if not exists idx_invoice_items_fee_type on invoice_items (tenant_id, fee_type_key);

-- Incoming payment receipts and settlement state.
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid not null references branches(id) on delete restrict,
  invoice_id uuid not null references invoices(id) on delete restrict,
  student_id uuid null references students(id) on delete set null,
  payment_reference varchar(60),
  provider_name varchar(60) not null,
  status payment_status_enum not null default 'pending',
  paid_at timestamptz null,
  amount numeric(12,2) not null,
  currency_code varchar(8) not null,
  method_meta_jsonb jsonb not null default '{}'::jsonb,
  received_by uuid null references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_payments_reference on payments (tenant_id, payment_reference) where payment_reference is not null and deleted_at is null;
create index if not exists idx_payments_invoice_paid_at on payments (invoice_id, paid_at desc);
create index if not exists idx_payments_status_paid_at on payments (tenant_id, status, paid_at desc);

-- Commission accrual and payout tracking for agents and partners.
create table if not exists commissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  agent_id uuid null references agents(id) on delete set null,
  partner_id uuid null references partners(id) on delete set null,
  student_id uuid null references students(id) on delete set null,
  application_id uuid null references applications(id) on delete set null,
  invoice_id uuid null references invoices(id) on delete set null,
  commission_type varchar(32) not null default 'flat',
  status commission_status_enum not null default 'pending',
  amount numeric(12,2) not null,
  currency_code varchar(8) not null,
  approved_by uuid null references users(id) on delete set null,
  approved_at timestamptz null,
  paid_at timestamptz null,
  notes text null,
  meta_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create index if not exists idx_commissions_status on commissions (tenant_id, status, approved_at desc);
create index if not exists idx_commissions_agent on commissions (agent_id, status);
create index if not exists idx_commissions_partner on commissions (partner_id, status);
