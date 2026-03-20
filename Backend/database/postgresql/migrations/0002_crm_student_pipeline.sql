-- Trust Education Foundation SaaS
-- Migration 0002: CRM, follow-up, student lifecycle, and file metadata

do $$
begin
  if not exists (select 1 from pg_type where typname = 'service_type_enum') then
    create type service_type_enum as enum ('consultancy', 'test_prep');
  end if;
  if not exists (select 1 from pg_type where typname = 'entity_type_enum') then
    create type entity_type_enum as enum ('lead', 'client', 'student');
  end if;
  if not exists (select 1 from pg_type where typname = 'lead_status_enum') then
    create type lead_status_enum as enum ('new', 'open', 'qualified', 'lost', 'converted', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'lead_temperature_enum') then
    create type lead_temperature_enum as enum ('hot', 'warm', 'cold');
  end if;
  if not exists (select 1 from pg_type where typname = 'follow_up_type_enum') then
    create type follow_up_type_enum as enum ('call', 'whatsapp', 'email', 'in_person', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'follow_up_status_enum') then
    create type follow_up_status_enum as enum ('pending', 'due_today', 'overdue', 'completed', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'student_status_enum') then
    create type student_status_enum as enum ('active', 'inactive', 'alumni', 'dropped');
  end if;
  if not exists (select 1 from pg_type where typname = 'file_access_level_enum') then
    create type file_access_level_enum as enum ('private', 'signed', 'public');
  end if;
  if not exists (select 1 from pg_type where typname = 'document_status_enum') then
    create type document_status_enum as enum ('pending', 'received', 'verified', 'rejected', 'expired');
  end if;
end $$;

-- Tenant-managed lead pipeline stages.
create table if not exists lead_stages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  service_type service_type_enum not null,
  country_code varchar(8) null,
  code varchar(50) not null,
  label varchar(120) not null,
  stage_order integer not null,
  color_hex varchar(16) null,
  is_default boolean not null default false,
  is_terminal boolean not null default false,
  sla_hours integer null,
  settings_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_lead_stages_scope_code
  on lead_stages (tenant_id, coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid), service_type, coalesce(country_code, ''), code)
  where deleted_at is null;
create index if not exists idx_lead_stages_scope_order on lead_stages (tenant_id, service_type, country_code, stage_order);

-- Tenant lead tag dictionary.
create table if not exists lead_tags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  name varchar(80) not null,
  color_hex varchar(16),
  category varchar(60),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_lead_tags_tenant_name on lead_tags (tenant_id, lower(name)) where deleted_at is null;

-- Agent master separate from the users table.
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  primary_user_id uuid null references users(id) on delete set null,
  agent_code varchar(40) not null,
  name varchar(180) not null,
  email citext,
  phone varchar(32),
  country_code varchar(8),
  status varchar(24) not null default 'prospective',
  commission_profile_jsonb jsonb not null default '{}'::jsonb,
  metadata_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_agents_tenant_code on agents (tenant_id, agent_code) where deleted_at is null;
create index if not exists idx_agents_tenant_status on agents (tenant_id, status, branch_id);

-- Referral and external business partner master.
create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  partner_code varchar(40),
  name varchar(180) not null,
  category_key varchar(60),
  contact_person varchar(120),
  email citext,
  phone varchar(32),
  country_code varchar(8),
  contract_meta_jsonb jsonb not null default '{}'::jsonb,
  status varchar(24) not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_partners_tenant_code on partners (tenant_id, partner_code) where partner_code is not null and deleted_at is null;
create index if not exists idx_partners_tenant_category on partners (tenant_id, category_key, status);

-- Core lead record for inquiry management before conversion.
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid not null references branches(id) on delete restrict,
  created_by uuid not null references users(id) on delete restrict,
  updated_by uuid null references users(id) on delete set null,
  owner_user_id uuid null references users(id) on delete set null,
  assigned_to uuid null references users(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  partner_id uuid null references partners(id) on delete set null,
  lead_stage_id uuid null references lead_stages(id) on delete set null,
  service_type service_type_enum not null,
  entity_type entity_type_enum not null default 'lead',
  source_type varchar(40) not null default 'manual_entry',
  source_meta_jsonb jsonb not null default '{}'::jsonb,
  lead_score integer not null default 0,
  lead_temperature lead_temperature_enum not null default 'cold',
  status lead_status_enum not null default 'new',
  pipeline_stage varchar(80),
  preferred_countries jsonb not null default '[]'::jsonb,
  first_name varchar(80),
  last_name varchar(80),
  full_name varchar(160) not null,
  email citext,
  phone varchar(32),
  mobile varchar(32),
  date_of_birth date,
  gender varchar(24),
  address_line_1 varchar(180),
  address_line_2 varchar(180),
  city varchar(80),
  state_name varchar(80),
  postal_code varchar(24),
  country_code varchar(8),
  guardian_name varchar(120),
  guardian_contact varchar(32),
  marital_status varchar(24),
  interested_for varchar(80),
  course_level varchar(80),
  preferred_location varchar(120),
  interested_course varchar(180),
  stream varchar(120),
  branch_name_snapshot varchar(180),
  campaign_name varchar(120),
  source_name varchar(120),
  how_did_you_know_us varchar(120),
  applied_any_country_before boolean not null default false,
  preparation_class varchar(120),
  overall_score numeric(6,2),
  work_experience_months integer,
  duplicate_key varchar(160),
  ownership_locked boolean not null default false,
  ownership_locked_by uuid null references users(id) on delete set null,
  ownership_locked_at timestamptz null,
  ownership_lock_reason text null,
  converted_student_id uuid null,
  last_contact_at timestamptz null,
  next_follow_up_at timestamptz null,
  overdue_follow_up_count integer not null default 0,
  first_response_due_at timestamptz null,
  first_response_at timestamptz null,
  archived_reason text null,
  custom_snapshot_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create index if not exists idx_leads_tenant_branch_assignee on leads (tenant_id, branch_id, assigned_to, status);
create index if not exists idx_leads_stage_pipeline on leads (tenant_id, lead_stage_id, pipeline_stage);
create index if not exists idx_leads_source_campaign on leads (tenant_id, source_type, campaign_name);
create index if not exists gin_leads_preferred_countries on leads using gin (preferred_countries);
create unique index if not exists uq_leads_tenant_email_active on leads (tenant_id, lower(email)) where email is not null and deleted_at is null;
create unique index if not exists uq_leads_tenant_mobile_active on leads (tenant_id, mobile) where mobile is not null and deleted_at is null;

-- Repeatable education rows captured at lead stage.
create table if not exists lead_qualifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  lead_id uuid not null references leads(id) on delete restrict,
  country_code varchar(8),
  institution_name varchar(180),
  degree_name varchar(120),
  course_name varchar(180),
  grade_type varchar(40),
  grade_point numeric(8,2),
  percentage_value numeric(8,2),
  university_title varchar(180),
  level_name varchar(80),
  passed_year integer,
  start_date date,
  end_date date,
  notes text,
  sort_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists idx_lead_qualifications_lead_order on lead_qualifications (lead_id, sort_order);

-- Append-only note trail for counsellor and internal notes.
create table if not exists lead_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid not null references branches(id) on delete restrict,
  lead_id uuid not null references leads(id) on delete restrict,
  author_user_id uuid not null references users(id) on delete restrict,
  note_type varchar(24) not null default 'general',
  visibility_scope varchar(24) not null default 'branch',
  content text not null,
  metadata_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_notes_timeline on lead_notes (lead_id, created_at desc);

-- Append-only timeline of lead changes and events.
create table if not exists lead_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid not null references branches(id) on delete restrict,
  lead_id uuid not null references leads(id) on delete restrict,
  actor_user_id uuid null references users(id) on delete set null,
  activity_type varchar(40) not null,
  summary text not null,
  before_jsonb jsonb not null default '{}'::jsonb,
  after_jsonb jsonb not null default '{}'::jsonb,
  metadata_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_lead_activities_timeline on lead_activities (lead_id, created_at desc);
create index if not exists idx_lead_activities_type on lead_activities (tenant_id, activity_type, created_at desc);

-- Many-to-many map between leads and tags.
create table if not exists lead_tag_map (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  lead_id uuid not null references leads(id) on delete restrict,
  tag_id uuid not null references lead_tags(id) on delete restrict,
  attached_by uuid null references users(id) on delete set null,
  attached_at timestamptz not null default now()
);

create unique index if not exists uq_lead_tag_map on lead_tag_map (lead_id, tag_id);

-- Structured task and reminder engine for CRM follow-ups.
create table if not exists follow_ups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid not null references branches(id) on delete restrict,
  lead_id uuid not null references leads(id) on delete restrict,
  assigned_user_id uuid not null references users(id) on delete restrict,
  created_by uuid not null references users(id) on delete restrict,
  follow_up_type follow_up_type_enum not null default 'call',
  outcome_type varchar(32) null,
  status follow_up_status_enum not null default 'pending',
  priority varchar(16) not null default 'normal',
  due_at timestamptz not null,
  completed_at timestamptz null,
  next_follow_up_at timestamptz null,
  notes text not null,
  completion_notes text null,
  completion_meta_jsonb jsonb not null default '{}'::jsonb,
  reminder_state_jsonb jsonb not null default '{}'::jsonb,
  escalated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create index if not exists idx_follow_ups_assignee_queue on follow_ups (tenant_id, assigned_user_id, status, due_at);
create index if not exists idx_follow_ups_branch_due on follow_ups (tenant_id, branch_id, due_at);
create index if not exists idx_follow_ups_lead_due on follow_ups (lead_id, status, due_at);

-- Converted person record. UI label depends on service_type and entity_type.
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid not null references branches(id) on delete restrict,
  source_lead_id uuid null references leads(id) on delete set null,
  owner_user_id uuid null references users(id) on delete set null,
  assigned_counsellor_id uuid null references users(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  partner_id uuid null references partners(id) on delete set null,
  service_type service_type_enum not null,
  entity_type entity_type_enum not null default 'student',
  status student_status_enum not null default 'active',
  student_code varchar(40) not null,
  first_name varchar(80),
  last_name varchar(80),
  full_name varchar(160) not null,
  email citext,
  phone varchar(32),
  mobile varchar(32),
  date_of_birth date,
  gender varchar(24),
  address_line_1 varchar(180),
  address_line_2 varchar(180),
  city varchar(80),
  state_name varchar(80),
  postal_code varchar(24),
  country_code varchar(8),
  current_country_code varchar(8),
  target_country_code varchar(8),
  custom_snapshot_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_students_tenant_student_code on students (tenant_id, student_code) where deleted_at is null;
create index if not exists idx_students_assignment on students (tenant_id, branch_id, assigned_counsellor_id, status);

alter table leads
  add constraint fk_leads_converted_student
  foreign key (converted_student_id) references students(id) on delete set null;

-- Academic history and test scores for the converted student.
create table if not exists student_academic_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  record_type varchar(40) not null,
  institution_name varchar(180),
  country_code varchar(8),
  program_name varchar(180),
  grade_type varchar(40),
  score numeric(8,2),
  max_score numeric(8,2),
  start_date date,
  end_date date,
  passed_year integer,
  metadata_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists idx_student_academic_records_scope on student_academic_records (student_id, record_type, end_date);

-- Metadata for binary files stored in object storage.
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  storage_provider varchar(40) not null,
  bucket_name varchar(120) not null,
  object_key varchar(240) not null,
  cdn_url text null,
  original_filename varchar(240) not null,
  stored_filename varchar(240) not null,
  mime_type varchar(120) not null,
  size_bytes bigint not null,
  checksum_sha256 varchar(128),
  access_level file_access_level_enum not null default 'private',
  category varchar(60),
  related_entity_type varchar(40),
  related_entity_id uuid null,
  uploaded_by uuid null references users(id) on delete set null,
  metadata_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_files_bucket_object on files (bucket_name, object_key);
create index if not exists idx_files_related_entity on files (tenant_id, related_entity_type, related_entity_id);
create index if not exists idx_files_category on files (tenant_id, category, created_at desc);

alter table users
  add constraint fk_users_avatar_file
  foreign key (avatar_file_id) references files(id) on delete set null;

-- Typed document linkage for students with verification state.
create table if not exists student_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  student_id uuid not null references students(id) on delete restrict,
  file_id uuid not null references files(id) on delete restrict,
  document_type varchar(60) not null,
  document_status document_status_enum not null default 'pending',
  verified_by uuid null references users(id) on delete set null,
  verified_at timestamptz null,
  expires_at date null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists idx_student_documents_status on student_documents (student_id, document_type, document_status);
