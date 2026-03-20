-- Trust Education Foundation SaaS
-- Migration 0001: core tenancy, subscription, identity, and access control

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'tenant_status_enum') then
    create type tenant_status_enum as enum ('trial', 'active', 'suspended', 'archived');
  end if;
  if not exists (select 1 from pg_type where typname = 'subscription_status_enum') then
    create type subscription_status_enum as enum ('trial', 'active', 'past_due', 'suspended', 'cancelled');
  end if;
  if not exists (select 1 from pg_type where typname = 'branch_type_enum') then
    create type branch_type_enum as enum ('head_office', 'campus', 'satellite', 'partner_desk');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_status_enum') then
    create type user_status_enum as enum ('invited', 'active', 'suspended', 'locked');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_type_enum') then
    create type user_type_enum as enum ('staff', 'agent', 'partner', 'super_admin', 'service_account');
  end if;
  if not exists (select 1 from pg_type where typname = 'access_scope_enum') then
    create type access_scope_enum as enum ('none', 'own', 'own_created', 'assigned_to_me', 'own_branch', 'team', 'tenant', 'head_office_only');
  end if;
end $$;

-- Root consultancy record and multi-tenant boundary.
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  tenant_code varchar(32) not null,
  legal_name varchar(180) not null,
  display_name varchar(180) not null,
  slug varchar(120) not null,
  registration_number varchar(80),
  primary_email citext,
  primary_phone varchar(32),
  country_code varchar(8),
  timezone varchar(64) not null default 'UTC',
  currency_code varchar(8) not null default 'USD',
  status tenant_status_enum not null default 'trial',
  subscription_status subscription_status_enum not null default 'trial',
  settings_jsonb jsonb not null default '{}'::jsonb,
  branding_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null,
  updated_by uuid null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_tenants_tenant_code on tenants (tenant_code) where deleted_at is null;
create unique index if not exists uq_tenants_slug on tenants (slug) where deleted_at is null;
create index if not exists idx_tenants_status on tenants (status, is_active);

-- System and tenant billing plans for SaaS packaging.
create table if not exists billing_plan_configs (
  id uuid primary key default gen_random_uuid(),
  code varchar(40) not null,
  name varchar(120) not null,
  description text,
  user_limit integer not null default 5,
  branch_limit integer not null default 1,
  storage_limit_mb integer not null default 1024,
  feature_flags_jsonb jsonb not null default '[]'::jsonb,
  pricing_jsonb jsonb not null default '{}'::jsonb,
  is_system boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_billing_plan_configs_code on billing_plan_configs (code) where deleted_at is null;

-- Active subscription and plan enforcement state per tenant.
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  billing_plan_config_id uuid not null references billing_plan_configs(id) on delete restrict,
  status subscription_status_enum not null default 'trial',
  billing_cycle varchar(20) not null default 'monthly',
  next_billing_at timestamptz null,
  feature_overrides_jsonb jsonb not null default '[]'::jsonb,
  provider_name varchar(40) null,
  provider_customer_id varchar(120) null,
  provider_subscription_id varchar(120) null,
  usage_snapshot_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null,
  updated_by uuid null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_subscriptions_active_tenant on subscriptions (tenant_id) where deleted_at is null;
create index if not exists idx_subscriptions_status on subscriptions (status, next_billing_at);

-- Branch and campus segmentation inside a tenant.
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_code varchar(32) not null,
  name varchar(180) not null,
  branch_type branch_type_enum not null default 'campus',
  manager_user_id uuid null,
  email citext,
  phone varchar(32),
  country_code varchar(8),
  state_name varchar(80),
  city varchar(80),
  address_line_1 varchar(180),
  address_line_2 varchar(180),
  postal_code varchar(24),
  inherit_branding boolean not null default true,
  branding_jsonb jsonb not null default '{}'::jsonb,
  settings_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null,
  updated_by uuid null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_branches_tenant_branch_code on branches (tenant_id, branch_code) where deleted_at is null;
create index if not exists idx_branches_tenant_manager on branches (tenant_id, manager_user_id);
create index if not exists idx_branches_tenant_city on branches (tenant_id, city);

-- Authenticated identities for staff, agents, partners, and support users.
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  employee_code varchar(40) null,
  full_name varchar(160) not null,
  email citext not null,
  password_hash text not null,
  phone varchar(32),
  avatar_file_id uuid null,
  status user_status_enum not null default 'invited',
  user_type user_type_enum not null default 'staff',
  countries jsonb not null default '[]'::jsonb,
  manager_user_id uuid null references users(id) on delete set null,
  last_login_at timestamptz null,
  preferences_jsonb jsonb not null default '{}'::jsonb,
  auth_meta_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null,
  updated_by uuid null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_users_tenant_email on users (tenant_id, email) where deleted_at is null;
create unique index if not exists uq_users_tenant_employee_code on users (tenant_id, employee_code) where employee_code is not null and deleted_at is null;
create index if not exists idx_users_tenant_branch_status on users (tenant_id, branch_id, status);
create index if not exists idx_users_tenant_manager on users (tenant_id, manager_user_id);

alter table branches
  add constraint fk_branches_manager_user
  foreign key (manager_user_id) references users(id) on delete set null;

-- Role master with support for tenant roles and platform-seeded defaults.
create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid null references tenants(id) on delete restrict,
  code varchar(60) not null,
  name varchar(120) not null,
  description text,
  is_system boolean not null default false,
  scope_policy_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null,
  updated_by uuid null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_roles_scope_code on roles ((coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid)), code) where deleted_at is null;

-- Canonical permission registry for every module and action.
create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  module_key varchar(60) not null,
  action_key varchar(60) not null,
  permission_key varchar(140) not null,
  description text,
  is_sensitive boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_permissions_permission_key on permissions (permission_key);
create index if not exists idx_permissions_module_action on permissions (module_key, action_key);

-- Role permission grants with scope and field-level policy.
create table if not exists role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references roles(id) on delete restrict,
  permission_id uuid not null references permissions(id) on delete restrict,
  is_allowed boolean not null default true,
  access_scope access_scope_enum not null default 'own',
  field_policy_jsonb jsonb not null default '{}'::jsonb,
  constraint_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_role_permissions_role_permission on role_permissions (role_id, permission_id);

-- User to role mapping with optional scope overrides.
create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  user_id uuid not null references users(id) on delete restrict,
  role_id uuid not null references roles(id) on delete restrict,
  branch_id uuid null references branches(id) on delete restrict,
  scope_type access_scope_enum not null default 'own',
  scope_rules_jsonb jsonb not null default '{}'::jsonb,
  assigned_at timestamptz not null default now(),
  assigned_by uuid null references users(id) on delete set null,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create unique index if not exists uq_user_roles_assignment
  on user_roles (user_id, role_id, coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where deleted_at is null;
create index if not exists idx_user_roles_tenant_user on user_roles (tenant_id, user_id);

-- Optional access packs that extend role-based permissions.
create table if not exists permission_bundles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  code varchar(60) not null,
  name varchar(120) not null,
  description text,
  rules_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid null,
  updated_by uuid null,
  is_active boolean not null default true,
  deleted_at timestamptz null
);

create unique index if not exists uq_permission_bundles_tenant_code on permission_bundles (tenant_id, code) where deleted_at is null;

create table if not exists permission_bundle_permissions (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references permission_bundles(id) on delete restrict,
  permission_id uuid not null references permissions(id) on delete restrict,
  access_scope access_scope_enum not null default 'own',
  field_policy_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_bundle_permissions on permission_bundle_permissions (bundle_id, permission_id);

create table if not exists user_permission_bundles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  user_id uuid not null references users(id) on delete restrict,
  bundle_id uuid not null references permission_bundles(id) on delete restrict,
  assigned_by uuid null references users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create unique index if not exists uq_user_permission_bundles_active on user_permission_bundles (user_id, bundle_id) where deleted_at is null;
