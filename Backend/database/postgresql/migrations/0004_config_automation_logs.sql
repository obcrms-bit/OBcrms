-- Trust Education Foundation SaaS
-- Migration 0004: config-driven engine, forms, automation, notifications, and audit

do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_status_enum') then
    create type notification_status_enum as enum ('unread', 'read', 'archived', 'failed');
  end if;
  if not exists (select 1 from pg_type where typname = 'notification_priority_enum') then
    create type notification_priority_enum as enum ('low', 'normal', 'high', 'urgent');
  end if;
end $$;

-- Generic templates for communication, documents, dashboard presets, and onboarding.
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid null references tenants(id) on delete restrict,
  template_type varchar(32) not null,
  code varchar(60) not null,
  name varchar(160) not null,
  subject_template text null,
  body_template text null,
  variables_jsonb jsonb not null default '[]'::jsonb,
  definition_jsonb jsonb not null default '{}'::jsonb,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_templates_scope_code
  on templates ((coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)), template_type, code)
  where deleted_at is null;

-- Configurable workflow definitions by module and scope.
create table if not exists workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  module_key varchar(60) not null,
  scope_country_code varchar(8) null,
  scope_university_id uuid null references universities(id) on delete set null,
  scope_program_id uuid null references programs(id) on delete set null,
  name varchar(160) not null,
  version_no integer not null default 1,
  stages_jsonb jsonb not null default '[]'::jsonb,
  transitions_jsonb jsonb not null default '[]'::jsonb,
  sla_rules_jsonb jsonb not null default '{}'::jsonb,
  automation_hooks_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_workflow_definitions_scope_version
  on workflow_definitions (
    tenant_id,
    module_key,
    coalesce(scope_country_code, ''),
    coalesce(scope_university_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(scope_program_id, '00000000-0000-0000-0000-000000000000'::uuid),
    version_no
  )
  where deleted_at is null;
create index if not exists idx_workflow_definitions_scope on workflow_definitions (tenant_id, module_key, scope_country_code, is_active);

alter table applications
  add constraint fk_applications_workflow_definition
  foreign key (workflow_definition_id) references workflow_definitions(id) on delete set null;

-- Configurable process and document checklists.
create table if not exists checklists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  checklist_type varchar(32) not null,
  scope_country_code varchar(8) null,
  scope_university_id uuid null references universities(id) on delete set null,
  scope_program_id uuid null references programs(id) on delete set null,
  scope_service_type varchar(24) null,
  name varchar(160) not null,
  version_no integer not null default 1,
  items_jsonb jsonb not null default '[]'::jsonb,
  rules_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_checklists_scope_version
  on checklists (
    tenant_id,
    checklist_type,
    coalesce(scope_country_code, ''),
    coalesce(scope_university_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(scope_program_id, '00000000-0000-0000-0000-000000000000'::uuid),
    version_no
  )
  where deleted_at is null;

-- Engine rules for automations.
create table if not exists automation_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  module_key varchar(60) not null,
  name varchar(160) not null,
  trigger_event varchar(80) not null,
  conditions_jsonb jsonb not null default '[]'::jsonb,
  actions_jsonb jsonb not null default '[]'::jsonb,
  priority integer not null default 100,
  is_system boolean not null default false,
  last_published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create index if not exists idx_automation_rules_event on automation_rules (tenant_id, module_key, trigger_event, is_active);

-- Append-only execution trail for automations.
create table if not exists automation_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  rule_id uuid not null references automation_rules(id) on delete restrict,
  module_key varchar(60) not null,
  target_entity_type varchar(40) not null,
  target_entity_id uuid not null,
  status varchar(24) not null,
  message text null,
  input_jsonb jsonb not null default '{}'::jsonb,
  output_jsonb jsonb not null default '{}'::jsonb,
  run_at timestamptz not null default now()
);

create index if not exists idx_automation_runs_rule on automation_runs (rule_id, run_at desc);
create index if not exists idx_automation_runs_status on automation_runs (tenant_id, status, run_at desc);

-- In-app and channel-tracked notification state.
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  user_id uuid not null references users(id) on delete restrict,
  notification_type varchar(40) not null,
  priority notification_priority_enum not null default 'normal',
  title varchar(180) not null,
  message text not null,
  channel varchar(24) not null default 'in_app',
  status notification_status_enum not null default 'unread',
  target_url text null,
  payload_jsonb jsonb not null default '{}'::jsonb,
  read_at timestamptz null,
  delivered_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create index if not exists idx_notifications_user_status on notifications (tenant_id, user_id, status, created_at desc);
create index if not exists idx_notifications_type on notifications (tenant_id, notification_type, created_at desc);

-- Delivery and interaction history for all communication channels.
create table if not exists communication_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  related_entity_type varchar(40) not null,
  related_entity_id uuid not null,
  channel varchar(24) not null,
  direction varchar(16) not null,
  template_id uuid null references templates(id) on delete set null,
  user_id uuid null references users(id) on delete set null,
  recipient_name varchar(160),
  recipient_contact varchar(180),
  subject varchar(240),
  body_excerpt text,
  provider_name varchar(60),
  provider_message_id varchar(120),
  delivery_status varchar(24) not null default 'queued',
  sent_at timestamptz null,
  metadata_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_communication_logs_entity on communication_logs (tenant_id, related_entity_type, related_entity_id, created_at desc);
create index if not exists idx_communication_logs_channel on communication_logs (tenant_id, channel, delivery_status, created_at desc);

-- Immutable security-grade audit trail.
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid null references tenants(id) on delete set null,
  branch_id uuid null references branches(id) on delete set null,
  actor_user_id uuid null references users(id) on delete set null,
  action_key varchar(80) not null,
  module_key varchar(60) not null,
  target_entity_type varchar(40) not null,
  target_entity_id uuid null,
  ip_address inet null,
  user_agent text null,
  before_jsonb jsonb not null default '{}'::jsonb,
  after_jsonb jsonb not null default '{}'::jsonb,
  metadata_jsonb jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_audit_logs_module on audit_logs (tenant_id, module_key, occurred_at desc);
create index if not exists idx_audit_logs_target on audit_logs (target_entity_type, target_entity_id, occurred_at desc);
create index if not exists idx_audit_logs_actor on audit_logs (actor_user_id, occurred_at desc);

-- Tenant-defined additional schema for core modules.
create table if not exists custom_fields (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  module_key varchar(60) not null,
  field_key varchar(80) not null,
  label varchar(120) not null,
  data_type varchar(24) not null,
  scope_jsonb jsonb not null default '{}'::jsonb,
  validation_jsonb jsonb not null default '{}'::jsonb,
  options_jsonb jsonb not null default '[]'::jsonb,
  default_value_jsonb jsonb not null default 'null'::jsonb,
  display_order integer not null default 1,
  is_required boolean not null default false,
  is_searchable boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_custom_fields_scope_key on custom_fields (tenant_id, module_key, field_key) where deleted_at is null;
create index if not exists idx_custom_fields_module_order on custom_fields (tenant_id, module_key, display_order);

-- Typed values for custom fields.
create table if not exists custom_field_values (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  custom_field_id uuid not null references custom_fields(id) on delete restrict,
  entity_type varchar(40) not null,
  entity_id uuid not null,
  value_text text null,
  value_number numeric(16,4) null,
  value_boolean boolean null,
  value_date date null,
  value_jsonb jsonb null,
  search_text varchar(240) null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create unique index if not exists uq_custom_field_values_entity on custom_field_values (custom_field_id, entity_type, entity_id) where deleted_at is null;
create index if not exists idx_custom_field_values_entity on custom_field_values (tenant_id, entity_type, entity_id);
create index if not exists idx_custom_field_values_search_text on custom_field_values (tenant_id, search_text) where search_text is not null and deleted_at is null;

-- Configured dynamic forms for public and internal use.
create table if not exists dynamic_forms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  form_type varchar(32) not null,
  name varchar(160) not null,
  slug varchar(140) not null,
  title varchar(180) not null,
  description text null,
  module_key varchar(60) not null,
  default_values_jsonb jsonb not null default '{}'::jsonb,
  submission_rules_jsonb jsonb not null default '{}'::jsonb,
  theme_jsonb jsonb not null default '{}'::jsonb,
  embed_meta_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_dynamic_forms_slug on dynamic_forms (tenant_id, slug) where deleted_at is null;
create index if not exists idx_dynamic_forms_type on dynamic_forms (tenant_id, form_type, is_active);

-- Ordered field configuration for the form builder.
create table if not exists dynamic_form_fields (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  form_id uuid not null references dynamic_forms(id) on delete restrict,
  field_key varchar(80) not null,
  label varchar(120) not null,
  field_type varchar(24) not null,
  source_type varchar(24) not null default 'core',
  source_ref varchar(120) null,
  placeholder varchar(180) null,
  help_text text null,
  options_jsonb jsonb not null default '[]'::jsonb,
  validation_jsonb jsonb not null default '{}'::jsonb,
  visibility_rules_jsonb jsonb not null default '{}'::jsonb,
  display_order integer not null default 1,
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_dynamic_form_fields_key on dynamic_form_fields (form_id, field_key) where deleted_at is null;
create index if not exists idx_dynamic_form_fields_order on dynamic_form_fields (form_id, display_order);

-- Append-only record of form submissions.
create table if not exists dynamic_form_submissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  form_id uuid not null references dynamic_forms(id) on delete restrict,
  submitted_by_user_id uuid null references users(id) on delete set null,
  target_entity_type varchar(40) null,
  target_entity_id uuid null,
  source_type varchar(40) not null,
  payload_jsonb jsonb not null default '{}'::jsonb,
  normalized_jsonb jsonb not null default '{}'::jsonb,
  ip_address inet null,
  user_agent text null,
  submitted_at timestamptz not null default now()
);

create index if not exists idx_dynamic_form_submissions_timeline on dynamic_form_submissions (form_id, submitted_at desc);
create index if not exists idx_dynamic_form_submissions_target on dynamic_form_submissions (tenant_id, target_entity_type, target_entity_id);

-- Role-aware dashboard layouts and widget rules.
create table if not exists dashboard_configs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  role_id uuid null references roles(id) on delete set null,
  module_key varchar(60) not null,
  name varchar(160) not null,
  layout_jsonb jsonb not null default '{}'::jsonb,
  widget_rules_jsonb jsonb not null default '{}'::jsonb,
  visibility_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create index if not exists idx_dashboard_configs_scope on dashboard_configs (tenant_id, branch_id, role_id, module_key);

-- Tenant and branch settings that do not justify dedicated tables.
create table if not exists system_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  setting_group varchar(60) not null,
  setting_key varchar(120) not null,
  setting_value_jsonb jsonb not null default '{}'::jsonb,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_system_settings_scope_key
  on system_settings (tenant_id, coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid), setting_group, setting_key)
  where deleted_at is null;

-- Integration provider configuration with secrets referenced externally.
create table if not exists integration_settings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  integration_type varchar(40) not null,
  provider_name varchar(80) not null,
  name varchar(160) not null,
  is_enabled boolean not null default true,
  config_jsonb jsonb not null default '{}'::jsonb,
  secret_ref_jsonb jsonb not null default '{}'::jsonb,
  health_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null references users(id) on delete set null,
  updated_by uuid null references users(id) on delete set null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_integration_settings_scope_name
  on integration_settings (
    tenant_id,
    coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid),
    integration_type,
    provider_name,
    name
  )
  where deleted_at is null;
