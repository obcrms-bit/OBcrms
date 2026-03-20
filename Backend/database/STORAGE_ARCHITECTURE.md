# Trust Education Foundation SaaS Storage Architecture

## 1. Storage Architecture Overview

### Design goals
- Multi-tenant isolation with every business row scoped by `tenant_id`
- Multi-branch segregation with `branch_id` on branch-owned records
- Config-driven administration so most operational changes are data changes, not code changes
- Strong reporting support for CRM, admissions, finance, and operations
- Secure auditability for approvals, ownership changes, billing, and automation
- Practical flexibility: normalized transactional tables plus selective `JSONB` for admin-managed rules and layouts

### Core storage principles
- PostgreSQL is the system of record for master data, transactional records, and reporting-sensitive workflows.
- `JSONB` is allowed only where configuration changes frequently and column-level reporting is not the primary need.
- Object storage keeps binary files; PostgreSQL stores file metadata, ownership, and linkage.
- Redis is used for short-lived caching, rate limiting, session/lock coordination, and queue support.
- Append-only history tables preserve who changed what, when, and why.
- Soft delete is used for user-facing operational tables; logs and stage history are append-only.

### Naming and key strategy
- `snake_case` for all table and column names
- `uuid` primary keys via `gen_random_uuid()`
- Common columns where relevant:
  - `id`
  - `tenant_id`
  - `branch_id`
  - `created_at`
  - `updated_at`
  - `created_by`
  - `updated_by`
  - `is_active`
  - `deleted_at`

### Current-to-target alignment
- Current Mongo `Company` maps to target `tenants`
- Current Mongo `Branch`, `User`, `Lead`, `Applicant`, `Invoice`, `Notification`, `AutomationRule`, `Subscription`, `PublicLeadForm`, and `QRCode` map cleanly into the target PostgreSQL domains below
- The target design keeps the current product vocabulary while improving integrity, queryability, and tenant safety

## 2. Entity Classification (Master / Transaction / Config / Logs)

### Master data
- `tenants`
- `branches`
- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `permission_bundles`
- `permission_bundle_permissions`
- `user_permission_bundles`
- `lead_stages`
- `lead_tags`
- `universities`
- `programs`
- `agents`
- `partners`
- `application_stages`
- `billing_plan_configs`

### Transaction data
- `leads`
- `lead_qualifications`
- `follow_ups`
- `students`
- `student_academic_records`
- `student_documents`
- `applications`
- `visa_cases`
- `invoices`
- `invoice_items`
- `payments`
- `commissions`
- `notifications`
- `dynamic_form_submissions`

### Config data
- `templates`
- `automation_rules`
- `custom_fields`
- `dynamic_forms`
- `dynamic_form_fields`
- `workflow_definitions`
- `dashboard_configs`
- `system_settings`
- `integration_settings`
- `checklists`

### Logs / history / append-only
- `lead_activities`
- `lead_notes`
- `lead_tag_map`
- `application_stage_history`
- `communication_logs`
- `audit_logs`
- `automation_runs`

## 3. Full Table-by-Table Schema With Columns and Purpose

### 3.1 Tenant, branch, identity, and access

#### `tenants` (master, soft delete)
Purpose: root consultancy record and top-level tenant boundary.

Columns:
- `id uuid pk`
- `tenant_code varchar(32)` unique, human-safe tenant identifier
- `legal_name varchar(180)` searchable
- `display_name varchar(180)` searchable
- `slug varchar(120)` unique for routing and public URLs
- `registration_number varchar(80)`
- `primary_email citext`
- `primary_phone varchar(32)`
- `country_code varchar(8)`
- `timezone varchar(64)`
- `currency_code varchar(8)`
- `status varchar(24)` suggested enum: `trial | active | suspended | archived`
- `subscription_status varchar(24)`
- `settings_jsonb jsonb` for tenant-wide non-relational preferences
- `branding_jsonb jsonb` for lightweight global branding defaults
- `created_at`, `updated_at`, `created_by`, `updated_by`, `is_active`, `deleted_at`

Indexes and constraints:
- unique: `tenant_code`, `slug`
- index: `(status, is_active)`
- searchable: `legal_name`, `display_name`, `slug`

#### `branches` (master, soft delete)
Purpose: branch/campus segmentation, branch ownership, and branch-specific defaults.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_code varchar(32)` unique per tenant
- `name varchar(180)` searchable
- `branch_type varchar(24)` suggested enum: `head_office | campus | satellite | partner_desk`
- `manager_user_id uuid fk -> users.id null`
- `email citext`
- `phone varchar(32)`
- `country_code varchar(8)`
- `state_name varchar(80)`
- `city varchar(80)`
- `address_line_1 varchar(180)`
- `address_line_2 varchar(180)`
- `postal_code varchar(24)`
- `inherit_branding boolean`
- `branding_jsonb jsonb`
- `settings_jsonb jsonb`
- `created_at`, `updated_at`, `created_by`, `updated_by`, `is_active`, `deleted_at`

Indexes and constraints:
- unique: `(tenant_id, branch_code)` where `deleted_at is null`
- index: `(tenant_id, manager_user_id)`
- searchable: `name`, `branch_code`, `city`

#### `users` (master, soft delete)
Purpose: authenticated identities for staff, agents, partner users, and support users.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `employee_code varchar(40)` unique per tenant
- `full_name varchar(160)` searchable
- `email citext` unique per tenant
- `password_hash text`
- `phone varchar(32)`
- `avatar_file_id uuid fk -> files.id null`
- `status varchar(24)` suggested enum: `invited | active | suspended | locked`
- `user_type varchar(24)` suggested enum: `staff | agent | partner | super_admin | service_account`
- `countries jsonb` array of specialization countries for counsellors
- `manager_user_id uuid fk -> users.id null`
- `last_login_at timestamptz`
- `preferences_jsonb jsonb`
- `auth_meta_jsonb jsonb`
- `created_at`, `updated_at`, `created_by`, `updated_by`, `is_active`, `deleted_at`

Indexes and constraints:
- unique: `(tenant_id, email)` where `deleted_at is null`
- unique: `(tenant_id, employee_code)` where not null and `deleted_at is null`
- index: `(tenant_id, branch_id, status)`
- index: `(tenant_id, manager_user_id)`
- searchable: `full_name`, `email`, `employee_code`

#### `roles` (master, soft delete)
Purpose: tenant roles plus system-seeded default roles.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id null` null means platform seed role
- `code varchar(60)`
- `name varchar(120)`
- `description text`
- `is_system boolean`
- `scope_policy_jsonb jsonb` default access policies by module
- `created_at`, `updated_at`, `created_by`, `updated_by`, `is_active`, `deleted_at`

Indexes:
- unique: `(coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), code)` where `deleted_at is null`
- searchable: `name`, `code`

#### `permissions` (master, append-only seeds with rare updates)
Purpose: canonical action catalog such as `leads.view`, `applications.create`, `billing.manage`.

Columns:
- `id uuid pk`
- `module_key varchar(60)`
- `action_key varchar(60)`
- `permission_key varchar(140)` unique
- `description text`
- `is_sensitive boolean`
- `created_at`, `updated_at`

Indexes:
- unique: `permission_key`
- index: `(module_key, action_key)`

#### `user_roles` (transaction, soft delete)
Purpose: many-to-many user-role assignment with optional scoped overrides.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `user_id uuid fk -> users.id`
- `role_id uuid fk -> roles.id`
- `branch_id uuid fk -> branches.id null`
- `scope_type varchar(32)` suggested enum: `own | own_created | assigned_to_me | own_branch | team | tenant`
- `scope_rules_jsonb jsonb`
- `assigned_at timestamptz`
- `assigned_by uuid fk -> users.id`
- `expires_at timestamptz null`
- `created_at`, `updated_at`, `deleted_at`

Indexes:
- unique: `(user_id, role_id, coalesce(branch_id, '00000000-0000-0000-0000-000000000000'::uuid))` where `deleted_at is null`
- index: `(tenant_id, user_id)`

#### `role_permissions` (master/config)
Purpose: permissions granted to a role with scope and field policy.

Columns:
- `id uuid pk`
- `role_id uuid fk -> roles.id`
- `permission_id uuid fk -> permissions.id`
- `is_allowed boolean`
- `access_scope varchar(32)` suggested enum: `none | own | own_created | assigned_to_me | own_branch | team | tenant | head_office_only`
- `field_policy_jsonb jsonb`
- `constraint_jsonb jsonb`
- `created_at`, `updated_at`

Indexes:
- unique: `(role_id, permission_id)`

#### `permission_bundles`, `permission_bundle_permissions`, `user_permission_bundles` (config/master)
Purpose: optional extra access packs without replacing the primary role.

Columns:
- `permission_bundles`: `id`, `tenant_id`, `code`, `name`, `description`, `rules_jsonb`, timestamps, active flags
- `permission_bundle_permissions`: `id`, `bundle_id`, `permission_id`, `access_scope`, `field_policy_jsonb`
- `user_permission_bundles`: `id`, `tenant_id`, `user_id`, `bundle_id`, `assigned_by`, `expires_at`, timestamps

Indexes:
- unique: `(tenant_id, code)` for bundles
- unique: `(bundle_id, permission_id)` for bundle permission map

### 3.2 CRM core

#### `lead_stages` (master/config, soft delete)
Purpose: tenant-managed lead pipeline stages and display order.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `service_type varchar(24)` suggested enum: `consultancy | test_prep`
- `country_code varchar(8) null`
- `code varchar(50)`
- `label varchar(120)`
- `stage_order integer`
- `color_hex varchar(16)`
- `is_default boolean`
- `is_terminal boolean`
- `sla_hours integer null`
- `settings_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- unique: `(tenant_id, coalesce(branch_id, zero_uuid), service_type, coalesce(country_code, ''), code)` where `deleted_at is null`
- index: `(tenant_id, service_type, country_code, stage_order)`

#### `lead_tags` (master/config, soft delete)
Purpose: tenant-configured lead tags such as VIP, Scholarship, Hot Prospect.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `name varchar(80)`
- `color_hex varchar(16)`
- `category varchar(60)`
- `description text`
- timestamps, active, soft delete

Indexes:
- unique: `(tenant_id, lower(name))` where `deleted_at is null`

#### `leads` (transaction, soft delete)
Purpose: inquiry and pre-conversion CRM record.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id`
- `created_by uuid fk -> users.id`
- `updated_by uuid fk -> users.id null`
- `owner_user_id uuid fk -> users.id null`
- `assigned_to uuid fk -> users.id null`
- `agent_id uuid fk -> agents.id null`
- `partner_id uuid fk -> partners.id null`
- `lead_stage_id uuid fk -> lead_stages.id null`
- `service_type varchar(24)` enum: `consultancy | test_prep`
- `entity_type varchar(24)` enum: `lead | client | student`
- `source_type varchar(40)` enum: `manual_entry | website_form | qr_form | import | agent_portal | referral`
- `source_meta_jsonb jsonb`
- `lead_score integer`
- `lead_temperature varchar(16)` enum: `hot | warm | cold`
- `status varchar(24)` enum: `new | open | qualified | lost | converted | archived`
- `pipeline_stage varchar(80)`
- `preferred_countries jsonb`
- `first_name varchar(80)`
- `last_name varchar(80)`
- `full_name varchar(160)` searchable
- `email citext`
- `phone varchar(32)`
- `mobile varchar(32)`
- `date_of_birth date`
- `gender varchar(24)`
- `address_line_1 varchar(180)`
- `address_line_2 varchar(180)`
- `city varchar(80)`
- `state_name varchar(80)`
- `postal_code varchar(24)`
- `country_code varchar(8)`
- `guardian_name varchar(120)`
- `guardian_contact varchar(32)`
- `marital_status varchar(24)`
- `interested_for varchar(80)`
- `course_level varchar(80)`
- `preferred_location varchar(120)`
- `interested_course varchar(180)`
- `stream varchar(120)`
- `branch_name_snapshot varchar(180)`
- `campaign_name varchar(120)`
- `source_name varchar(120)`
- `how_did_you_know_us varchar(120)`
- `applied_any_country_before boolean`
- `preparation_class varchar(120)`
- `overall_score numeric(6,2)`
- `work_experience_months integer`
- `duplicate_key varchar(160)` deterministic normalized key for duplicate detection
- `ownership_locked boolean`
- `ownership_locked_by uuid fk -> users.id null`
- `ownership_locked_at timestamptz null`
- `ownership_lock_reason text`
- `converted_student_id uuid null`
- `last_contact_at timestamptz null`
- `next_follow_up_at timestamptz null`
- `overdue_follow_up_count integer`
- `first_response_due_at timestamptz null`
- `first_response_at timestamptz null`
- `archived_reason text null`
- `custom_snapshot_jsonb jsonb` optional denormalized quick-read block
- `created_at`, `updated_at`, `is_active`, `deleted_at`

Indexes:
- unique partial suggested: `(tenant_id, lower(email))` where email not null and `deleted_at is null`
- unique partial suggested: `(tenant_id, mobile)` where mobile not null and `deleted_at is null`
- index: `(tenant_id, branch_id, assigned_to, status)`
- index: `(tenant_id, lead_stage_id, pipeline_stage)`
- index: `(tenant_id, source_type, campaign_name)`
- index: GIN on `preferred_countries`
- searchable: `full_name`, `email`, `phone`, `mobile`, `duplicate_key`

#### `lead_qualifications` (transaction, soft delete)
Purpose: dynamic education rows attached to a lead.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `lead_id uuid fk -> leads.id`
- `country_code varchar(8)`
- `institution_name varchar(180)`
- `degree_name varchar(120)`
- `course_name varchar(180)`
- `grade_type varchar(40)`
- `grade_point numeric(8,2) null`
- `percentage_value numeric(8,2) null`
- `university_title varchar(180)`
- `level_name varchar(80)`
- `passed_year integer null`
- `start_date date null`
- `end_date date null`
- `notes text null`
- `sort_order integer`
- timestamps, soft delete

Indexes:
- index: `(lead_id, sort_order)`

#### `lead_notes` (append-only)
Purpose: immutable note trail with note visibility controls.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id`
- `lead_id uuid fk -> leads.id`
- `author_user_id uuid fk -> users.id`
- `note_type varchar(24)` enum: `general | counselling | internal | finance | system`
- `visibility_scope varchar(24)` enum: `owner | branch | tenant | admin_only`
- `content text`
- `metadata_jsonb jsonb`
- `created_at`

Indexes:
- index: `(lead_id, created_at desc)`
- index: `(tenant_id, note_type)`

#### `lead_activities` (append-only)
Purpose: system and user activity timeline for leads.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id`
- `lead_id uuid fk -> leads.id`
- `actor_user_id uuid fk -> users.id null`
- `activity_type varchar(40)` examples: `created`, `assigned`, `stage_changed`, `follow_up_completed`, `converted`
- `summary text`
- `before_jsonb jsonb`
- `after_jsonb jsonb`
- `metadata_jsonb jsonb`
- `created_at`

Indexes:
- index: `(lead_id, created_at desc)`
- index: `(tenant_id, activity_type, created_at desc)`

#### `lead_tag_map` (append-only map)
Purpose: records tagging changes over time.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `lead_id uuid fk -> leads.id`
- `tag_id uuid fk -> lead_tags.id`
- `attached_by uuid fk -> users.id`
- `attached_at timestamptz`

Indexes:
- unique: `(lead_id, tag_id)`

#### `follow_ups` (transaction, soft delete)
Purpose: structured task, reminder, and follow-up workflow.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id`
- `lead_id uuid fk -> leads.id`
- `assigned_user_id uuid fk -> users.id`
- `created_by uuid fk -> users.id`
- `follow_up_type varchar(24)` enum: `call | whatsapp | email | in_person | other`
- `outcome_type varchar(32) null`
- `status varchar(24)` enum: `pending | due_today | overdue | completed | cancelled`
- `priority varchar(16)` enum: `low | normal | high | urgent`
- `due_at timestamptz`
- `completed_at timestamptz null`
- `next_follow_up_at timestamptz null`
- `notes text`
- `completion_notes text null`
- `completion_meta_jsonb jsonb`
- `reminder_state_jsonb jsonb`
- `escalated_at timestamptz null`
- timestamps, active, soft delete

Indexes:
- index: `(tenant_id, assigned_user_id, status, due_at)`
- index: `(tenant_id, branch_id, due_at)`
- index: `(lead_id, status, due_at)`

### 3.3 Student and academic lifecycle

#### `students` (transaction, soft delete)
Purpose: converted person record used for both Clients and Students while preserving business naming via `entity_type`.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id`
- `source_lead_id uuid fk -> leads.id unique null`
- `owner_user_id uuid fk -> users.id null`
- `assigned_counsellor_id uuid fk -> users.id null`
- `agent_id uuid fk -> agents.id null`
- `partner_id uuid fk -> partners.id null`
- `service_type varchar(24)` enum: `consultancy | test_prep`
- `entity_type varchar(24)` enum: `client | student`
- `status varchar(24)` enum: `active | inactive | alumni | dropped`
- `student_code varchar(40)` unique per tenant
- personal/contact columns mirroring lead for durable operational access
- `current_country_code varchar(8) null`
- `target_country_code varchar(8) null`
- `custom_snapshot_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- unique: `(tenant_id, student_code)` where `deleted_at is null`
- index: `(tenant_id, branch_id, assigned_counsellor_id, status)`

#### `student_academic_records` (transaction, soft delete)
Purpose: structured academic history for the converted student/client.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `student_id uuid fk -> students.id`
- `record_type varchar(40)` examples: `secondary`, `bachelor`, `masters`, `language_test`
- `institution_name varchar(180)`
- `country_code varchar(8)`
- `program_name varchar(180)`
- `grade_type varchar(40)`
- `score numeric(8,2) null`
- `max_score numeric(8,2) null`
- `start_date date null`
- `end_date date null`
- `passed_year integer null`
- `metadata_jsonb jsonb`
- timestamps, soft delete

Indexes:
- index: `(student_id, record_type, end_date)`

#### `files` (transaction/metadata, soft delete)
Purpose: object storage metadata for all uploaded documents and media.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `storage_provider varchar(40)` examples: `s3`, `cloudflare_r2`, `minio`
- `bucket_name varchar(120)`
- `object_key varchar(240)` unique per bucket
- `cdn_url text null`
- `original_filename varchar(240)`
- `stored_filename varchar(240)`
- `mime_type varchar(120)`
- `size_bytes bigint`
- `checksum_sha256 varchar(128)`
- `access_level varchar(24)` enum: `private | signed | public`
- `category varchar(60)`
- `related_entity_type varchar(40)`
- `related_entity_id uuid null`
- `uploaded_by uuid fk -> users.id`
- `metadata_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- unique: `(bucket_name, object_key)`
- index: `(tenant_id, related_entity_type, related_entity_id)`
- index: `(tenant_id, category, created_at desc)`

#### `student_documents` (transaction, soft delete)
Purpose: typed link between a student and uploaded file with verification state.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `student_id uuid fk -> students.id`
- `file_id uuid fk -> files.id`
- `document_type varchar(60)`
- `document_status varchar(24)` enum: `pending`, `received`, `verified`, `rejected`, `expired`
- `verified_by uuid fk -> users.id null`
- `verified_at timestamptz null`
- `expires_at date null`
- `notes text null`
- timestamps, soft delete

Indexes:
- index: `(student_id, document_type, document_status)`

### 3.4 University, program, partner, and referral channels

#### `universities` (master, soft delete)
Purpose: university catalog managed by tenant.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `name varchar(180)` searchable
- `country_code varchar(8)` searchable
- `city varchar(80)`
- `website_url text`
- `ranking_text varchar(80)`
- `metadata_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- unique: `(tenant_id, lower(name), country_code)` where `deleted_at is null`
- index: `(tenant_id, country_code, is_active)`

#### `programs` (master, soft delete)
Purpose: course/program catalog linked to a university.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `university_id uuid fk -> universities.id`
- `name varchar(180)` searchable
- `country_code varchar(8)`
- `discipline varchar(120)`
- `level_name varchar(80)`
- `duration_months integer`
- `intake_options jsonb`
- `tuition_fee numeric(12,2) null`
- `currency_code varchar(8)`
- `ielts_requirement numeric(4,1) null`
- `pte_requirement numeric(5,1) null`
- `toefl_requirement numeric(5,1) null`
- `scholarship_info_jsonb jsonb`
- `metadata_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- unique: `(tenant_id, university_id, lower(name), coalesce(level_name, ''))` where `deleted_at is null`
- index: `(tenant_id, country_code, level_name, tuition_fee)`

#### `agents` (master, soft delete)
Purpose: recruiter/agent master entity, separate from the authenticated `users` table.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `primary_user_id uuid fk -> users.id null`
- `agent_code varchar(40)` unique per tenant
- `name varchar(180)` searchable
- `email citext`
- `phone varchar(32)`
- `country_code varchar(8)`
- `status varchar(24)` enum: `prospective | active | inactive | blacklisted`
- `commission_profile_jsonb jsonb`
- `metadata_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- unique: `(tenant_id, agent_code)` where `deleted_at is null`
- index: `(tenant_id, status, branch_id)`

#### `partners` (master, soft delete)
Purpose: external education or business partners such as training centers and referral partners.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `partner_code varchar(40)`
- `name varchar(180)` searchable
- `category_key varchar(60)`
- `contact_person varchar(120)`
- `email citext`
- `phone varchar(32)`
- `country_code varchar(8)`
- `contract_meta_jsonb jsonb`
- `status varchar(24)` enum: `active | inactive | suspended`
- timestamps, active, soft delete

Indexes:
- unique: `(tenant_id, partner_code)` where `deleted_at is null`
- index: `(tenant_id, category_key, status)`

### 3.5 Applications, visas, checklists

#### `application_stages` (master/config, soft delete)
Purpose: country/program-specific application stage catalog.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `country_code varchar(8)`
- `code varchar(50)`
- `label varchar(120)`
- `stage_order integer`
- `is_terminal boolean`
- `color_hex varchar(16)`
- `settings_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- unique: `(tenant_id, country_code, code)` where `deleted_at is null`
- index: `(tenant_id, country_code, stage_order)`

#### `applications` (transaction, soft delete)
Purpose: admissions application record linked to student/client and program.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id`
- `student_id uuid fk -> students.id`
- `lead_id uuid fk -> leads.id null`
- `university_id uuid fk -> universities.id`
- `program_id uuid fk -> programs.id`
- `partner_id uuid fk -> partners.id null`
- `agent_id uuid fk -> agents.id null`
- `assigned_officer_id uuid fk -> users.id null`
- `country_code varchar(8)`
- `workflow_definition_id uuid fk -> workflow_definitions.id null`
- `current_stage_id uuid fk -> application_stages.id null`
- `status varchar(24)` enum: `draft | in_progress | submitted | offered | enrolled | rejected | closed`
- `intake_label varchar(80)`
- `academic_year varchar(20)`
- `priority varchar(16)`
- `application_fee numeric(12,2) null`
- `currency_code varchar(8)`
- `timeline_snapshot_jsonb jsonb`
- `document_state_jsonb jsonb`
- `decision_meta_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- index: `(tenant_id, branch_id, assigned_officer_id, status)`
- index: `(tenant_id, country_code, current_stage_id)`
- index: `(student_id, program_id)`

#### `application_stage_history` (append-only)
Purpose: immutable application stage movement and SLA/audit trail.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `application_id uuid fk -> applications.id`
- `from_stage_id uuid fk -> application_stages.id null`
- `to_stage_id uuid fk -> application_stages.id`
- `changed_by uuid fk -> users.id`
- `changed_at timestamptz`
- `reason text null`
- `metadata_jsonb jsonb`

Indexes:
- index: `(application_id, changed_at desc)`
- index: `(tenant_id, to_stage_id, changed_at desc)`

#### `visa_cases` (transaction, soft delete)
Purpose: visa processing record linked to an application.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id`
- `application_id uuid fk -> applications.id`
- `student_id uuid fk -> students.id`
- `assigned_officer_id uuid fk -> users.id null`
- `country_code varchar(8)`
- `status varchar(24)` enum: `not_started | preparing | submitted | interview | approved | refused | closed`
- `priority varchar(16)`
- `submission_date date null`
- `decision_date date null`
- `decision_result varchar(24)` enum: `approved | refused | pending | withdrawn`
- `checklist_state_jsonb jsonb`
- `meta_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- unique: `(application_id)` where `deleted_at is null`
- index: `(tenant_id, country_code, status)`

#### `checklists` (config/master, soft delete)
Purpose: admin-managed document or process requirements by scope.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `checklist_type varchar(32)` enum: `application`, `visa`, `student_onboarding`, `invoice_supporting_docs`
- `scope_country_code varchar(8) null`
- `scope_university_id uuid fk -> universities.id null`
- `scope_program_id uuid fk -> programs.id null`
- `scope_service_type varchar(24) null`
- `name varchar(160)`
- `version_no integer`
- `items_jsonb jsonb`
- `rules_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- index: `(tenant_id, checklist_type, scope_country_code)`
- unique: `(tenant_id, checklist_type, coalesce(scope_country_code, ''), coalesce(scope_university_id, zero_uuid), coalesce(scope_program_id, zero_uuid), version_no)` where `deleted_at is null`

### 3.6 Finance and commissions

#### `invoices` (transaction, soft delete)
Purpose: invoice header for student/client/application billing.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id`
- `student_id uuid fk -> students.id null`
- `application_id uuid fk -> applications.id null`
- `invoice_number varchar(40)` unique per tenant
- `invoice_type varchar(32)` enum: `service`, `application_fee`, `visa_fee`, `tuition_deposit`, `misc`
- `status varchar(24)` enum: `draft | issued | partially_paid | paid | overdue | cancelled | refunded`
- `issue_date date`
- `due_date date`
- `currency_code varchar(8)`
- `subtotal_amount numeric(12,2)`
- `discount_amount numeric(12,2)`
- `tax_amount numeric(12,2)`
- `total_amount numeric(12,2)`
- `balance_amount numeric(12,2)`
- `notes text null`
- `meta_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- unique: `(tenant_id, invoice_number)` where `deleted_at is null`
- index: `(tenant_id, status, due_date)`
- index: `(student_id, issue_date desc)`

#### `invoice_items` (transaction, soft delete)
Purpose: normalized invoice lines for fee analysis and reporting.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `invoice_id uuid fk -> invoices.id`
- `fee_type_key varchar(60)`
- `description varchar(240)`
- `quantity numeric(10,2)`
- `unit_price numeric(12,2)`
- `discount_amount numeric(12,2)`
- `tax_amount numeric(12,2)`
- `line_total numeric(12,2)`
- `meta_jsonb jsonb`
- timestamps, soft delete

Indexes:
- index: `(invoice_id)`
- index: `(tenant_id, fee_type_key)`

#### `payments` (transaction, soft delete)
Purpose: payment receipts and settlements.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id`
- `invoice_id uuid fk -> invoices.id`
- `student_id uuid fk -> students.id null`
- `payment_reference varchar(60)`
- `provider_name varchar(60)` examples: `cash`, `bank`, `stripe`, `fonepay`
- `status varchar(24)` enum: `pending | succeeded | failed | reversed | refunded`
- `paid_at timestamptz null`
- `amount numeric(12,2)`
- `currency_code varchar(8)`
- `method_meta_jsonb jsonb`
- `received_by uuid fk -> users.id null`
- timestamps, active, soft delete

Indexes:
- unique: `(tenant_id, payment_reference)` where payment_reference is not null and `deleted_at is null`
- index: `(invoice_id, paid_at desc)`
- index: `(tenant_id, status, paid_at desc)`

#### `commissions` (transaction, soft delete)
Purpose: commission accrual and payout tracking for agents or partners.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `agent_id uuid fk -> agents.id null`
- `partner_id uuid fk -> partners.id null`
- `student_id uuid fk -> students.id null`
- `application_id uuid fk -> applications.id null`
- `invoice_id uuid fk -> invoices.id null`
- `commission_type varchar(32)` enum: `flat`, `percentage`, `bonus`
- `status varchar(24)` enum: `pending | approved | paid | cancelled | disputed`
- `amount numeric(12,2)`
- `currency_code varchar(8)`
- `approved_by uuid fk -> users.id null`
- `approved_at timestamptz null`
- `paid_at timestamptz null`
- `notes text null`
- `meta_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- index: `(tenant_id, status, approved_at desc)`
- index: `(agent_id, status)`
- index: `(partner_id, status)`

### 3.7 Templates, automation, communication, notifications

#### `communication_logs` (append-only)
Purpose: delivery and interaction history for email, SMS, WhatsApp, calls, and meetings.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `related_entity_type varchar(40)` examples: `lead`, `student`, `application`, `invoice`
- `related_entity_id uuid`
- `channel varchar(24)` enum: `email | sms | whatsapp | call | meeting | internal_message`
- `direction varchar(16)` enum: `outbound | inbound`
- `template_id uuid fk -> templates.id null`
- `user_id uuid fk -> users.id null`
- `recipient_name varchar(160)`
- `recipient_contact varchar(180)`
- `subject varchar(240) null`
- `body_excerpt text null`
- `provider_name varchar(60) null`
- `provider_message_id varchar(120) null`
- `delivery_status varchar(24)` enum: `queued | sent | delivered | failed | opened | replied`
- `sent_at timestamptz null`
- `metadata_jsonb jsonb`
- `created_at`

Indexes:
- index: `(tenant_id, related_entity_type, related_entity_id, created_at desc)`
- index: `(tenant_id, channel, delivery_status, created_at desc)`

#### `templates` (config/master, soft delete)
Purpose: reusable communication, document, workflow, and onboarding templates.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id null`
- `template_type varchar(32)` enum: `email`, `sms`, `whatsapp`, `document`, `workflow`, `dashboard`, `onboarding`
- `code varchar(60)`
- `name varchar(160)`
- `subject_template text null`
- `body_template text null`
- `variables_jsonb jsonb`
- `definition_jsonb jsonb`
- `is_system boolean`
- timestamps, active, soft delete

Indexes:
- unique: `(coalesce(tenant_id, zero_uuid), template_type, code)` where `deleted_at is null`

#### `automation_rules` (config, soft delete)
Purpose: admin-managed workflow automations.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `module_key varchar(60)`
- `name varchar(160)`
- `trigger_event varchar(80)`
- `conditions_jsonb jsonb`
- `actions_jsonb jsonb`
- `priority integer`
- `is_system boolean`
- `last_published_at timestamptz null`
- timestamps, active, soft delete

Indexes:
- index: `(tenant_id, module_key, trigger_event, is_active)`

#### `automation_runs` (append-only)
Purpose: execution log for automation observability.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `rule_id uuid fk -> automation_rules.id`
- `module_key varchar(60)`
- `target_entity_type varchar(40)`
- `target_entity_id uuid`
- `status varchar(24)` enum: `queued | running | succeeded | failed | skipped`
- `message text null`
- `input_jsonb jsonb`
- `output_jsonb jsonb`
- `run_at timestamptz`

Indexes:
- index: `(rule_id, run_at desc)`
- index: `(tenant_id, status, run_at desc)`

#### `notifications` (transaction, soft delete/archivable)
Purpose: in-app and delivery-tracked notifications.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `user_id uuid fk -> users.id`
- `notification_type varchar(40)` examples: `follow_up_overdue`, `payment_due`, `approval_pending`
- `priority varchar(16)` enum: `low | normal | high | urgent`
- `title varchar(180)`
- `message text`
- `channel varchar(24)` enum: `in_app | email | sms | whatsapp`
- `status varchar(24)` enum: `unread | read | archived | failed`
- `target_url text null`
- `payload_jsonb jsonb`
- `read_at timestamptz null`
- `delivered_at timestamptz null`
- timestamps, soft delete

Indexes:
- index: `(tenant_id, user_id, status, created_at desc)`
- index: `(tenant_id, notification_type, created_at desc)`

### 3.8 Audit, custom fields, forms, workflow, dashboards, settings

#### `audit_logs` (append-only)
Purpose: immutable, security-grade trace for sensitive actions.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id null`
- `branch_id uuid fk -> branches.id null`
- `actor_user_id uuid fk -> users.id null`
- `action_key varchar(80)` examples: `lead.assign`, `billing.plan_change`, `role.permission_update`
- `module_key varchar(60)`
- `target_entity_type varchar(40)`
- `target_entity_id uuid null`
- `ip_address inet null`
- `user_agent text null`
- `before_jsonb jsonb`
- `after_jsonb jsonb`
- `metadata_jsonb jsonb`
- `occurred_at timestamptz`

Indexes:
- index: `(tenant_id, module_key, occurred_at desc)`
- index: `(target_entity_type, target_entity_id, occurred_at desc)`
- index: `(actor_user_id, occurred_at desc)`

#### `custom_fields` (config, soft delete)
Purpose: admin-created extra fields per module.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `module_key varchar(60)` examples: `lead`, `student`, `application`
- `field_key varchar(80)`
- `label varchar(120)`
- `data_type varchar(24)` enum: `text`, `textarea`, `number`, `date`, `boolean`, `single_select`, `multi_select`, `json`
- `scope_jsonb jsonb`
- `validation_jsonb jsonb`
- `options_jsonb jsonb`
- `default_value_jsonb jsonb`
- `display_order integer`
- `is_required boolean`
- `is_searchable boolean`
- timestamps, active, soft delete

Indexes:
- unique: `(tenant_id, module_key, field_key)` where `deleted_at is null`
- index: `(tenant_id, module_key, display_order)`

#### `custom_field_values` (transaction, soft delete)
Purpose: typed storage for custom field data without making core records too generic.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `custom_field_id uuid fk -> custom_fields.id`
- `entity_type varchar(40)`
- `entity_id uuid`
- `value_text text null`
- `value_number numeric(16,4) null`
- `value_boolean boolean null`
- `value_date date null`
- `value_jsonb jsonb null`
- `search_text varchar(240) null`
- timestamps, soft delete

Indexes:
- unique: `(custom_field_id, entity_type, entity_id)` where `deleted_at is null`
- index: `(tenant_id, entity_type, entity_id)`
- index: `(tenant_id, search_text)` for selected fields only

#### `dynamic_forms` (config, soft delete)
Purpose: public or internal forms generated from admin settings.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `form_type varchar(32)` enum: `lead_capture`, `student_intake`, `application_intake`, `website_widget`, `qr_form`
- `name varchar(160)`
- `slug varchar(140)` unique per tenant
- `title varchar(180)`
- `description text null`
- `module_key varchar(60)`
- `default_values_jsonb jsonb`
- `submission_rules_jsonb jsonb`
- `theme_jsonb jsonb`
- `embed_meta_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- unique: `(tenant_id, slug)` where `deleted_at is null`
- index: `(tenant_id, form_type, is_active)`

#### `dynamic_form_fields` (config, soft delete)
Purpose: ordered field definitions for a form builder.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `form_id uuid fk -> dynamic_forms.id`
- `field_key varchar(80)`
- `label varchar(120)`
- `field_type varchar(24)`
- `source_type varchar(24)` enum: `core`, `custom`, `computed`
- `source_ref varchar(120)`
- `placeholder varchar(180)`
- `help_text text`
- `options_jsonb jsonb`
- `validation_jsonb jsonb`
- `visibility_rules_jsonb jsonb`
- `display_order integer`
- `is_required boolean`
- timestamps, active, soft delete

Indexes:
- unique: `(form_id, field_key)` where `deleted_at is null`
- index: `(form_id, display_order)`

#### `dynamic_form_submissions` (transaction, append-only)
Purpose: raw payload and resolved entity linkage for submitted forms.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `form_id uuid fk -> dynamic_forms.id`
- `submitted_by_user_id uuid fk -> users.id null`
- `target_entity_type varchar(40) null`
- `target_entity_id uuid null`
- `source_type varchar(40)`
- `payload_jsonb jsonb`
- `normalized_jsonb jsonb`
- `ip_address inet null`
- `user_agent text null`
- `submitted_at timestamptz`

Indexes:
- index: `(form_id, submitted_at desc)`
- index: `(tenant_id, target_entity_type, target_entity_id)`

#### `workflow_definitions` (config, soft delete)
Purpose: configurable workflow definitions by module, country, university, or program.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `module_key varchar(60)` examples: `lead`, `application`, `visa`
- `scope_country_code varchar(8) null`
- `scope_university_id uuid fk -> universities.id null`
- `scope_program_id uuid fk -> programs.id null`
- `name varchar(160)`
- `version_no integer`
- `stages_jsonb jsonb`
- `transitions_jsonb jsonb`
- `sla_rules_jsonb jsonb`
- `automation_hooks_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- index: `(tenant_id, module_key, scope_country_code, is_active)`
- unique: `(tenant_id, module_key, coalesce(scope_country_code, ''), coalesce(scope_university_id, zero_uuid), coalesce(scope_program_id, zero_uuid), version_no)` where `deleted_at is null`

#### `dashboard_configs` (config, soft delete)
Purpose: role-aware dashboard layouts and widget settings.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `role_id uuid fk -> roles.id null`
- `module_key varchar(60)` examples: `overview`, `crm`, `finance`
- `name varchar(160)`
- `layout_jsonb jsonb`
- `widget_rules_jsonb jsonb`
- `visibility_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- index: `(tenant_id, branch_id, role_id, module_key)`

#### `system_settings` (config, soft delete/rare delete)
Purpose: tenant-level key/value configuration for lists and policies that do not justify dedicated tables.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `setting_group varchar(60)` examples: `finance`, `crm`, `partner_categories`, `intake_options`
- `setting_key varchar(120)`
- `setting_value_jsonb jsonb`
- `description text`
- timestamps, active, soft delete

Indexes:
- unique: `(tenant_id, coalesce(branch_id, zero_uuid), setting_group, setting_key)` where `deleted_at is null`

#### `integration_settings` (config, soft delete)
Purpose: provider credentials and behavior for email, payments, website widgets, storage, calendars, and webhooks.

Columns:
- `id uuid pk`
- `tenant_id uuid fk -> tenants.id`
- `branch_id uuid fk -> branches.id null`
- `integration_type varchar(40)` examples: `smtp`, `stripe`, `storage`, `whatsapp`, `website_widget`, `webhook`
- `provider_name varchar(80)`
- `name varchar(160)`
- `is_enabled boolean`
- `config_jsonb jsonb`
- `secret_ref_jsonb jsonb`
- `health_jsonb jsonb`
- timestamps, active, soft delete

Indexes:
- unique: `(tenant_id, coalesce(branch_id, zero_uuid), integration_type, provider_name, name)` where `deleted_at is null`

## 4. Relationship Map

### Core hierarchy
- `tenants 1 -> many branches`
- `tenants 1 -> many users`
- `tenants 1 -> many roles`
- `roles many -> many permissions` via `role_permissions`
- `users many -> many roles` via `user_roles`
- `users many -> many permission_bundles` via `user_permission_bundles`

### CRM flow
- `lead_stages 1 -> many leads`
- `leads 1 -> many lead_notes`
- `leads 1 -> many lead_activities`
- `leads 1 -> many follow_ups`
- `leads many -> many lead_tags` via `lead_tag_map`
- `leads 1 -> many lead_qualifications`
- `leads 0/1 -> 1 students` when converted

### Student and admissions flow
- `students 1 -> many student_academic_records`
- `students 1 -> many student_documents`
- `students 1 -> many applications`
- `applications many -> 1 universities`
- `applications many -> 1 programs`
- `applications 1 -> many application_stage_history`
- `applications 1 -> 0/1 visa_cases`

### Finance flow
- `students/applications 1 -> many invoices`
- `invoices 1 -> many invoice_items`
- `invoices 1 -> many payments`
- `applications/invoices/agents/partners -> commissions`

### Config and operations flow
- `workflow_definitions` govern `lead_stages`, `application_stages`, `checklists`, and automation behavior
- `dynamic_forms -> dynamic_form_fields -> dynamic_form_submissions`
- `templates` are referenced by `communication_logs`, `automation_rules`, and notifications
- `files` can be linked to `students`, `applications`, `visa_cases`, and other entities through `related_entity_type` and `related_entity_id`

### Data lifecycle logic
1. Inquiry becomes a `lead`
2. A `lead` gets notes, activities, tags, qualifications, and follow-ups
3. A qualified lead converts into a `student` record, preserving `source_lead_id`
4. A `student` creates one or more `applications`
5. Each `application` moves through `application_stages` and `application_stage_history`
6. A `visa_case` is created when application and country policy require it
7. `invoices` and `payments` attach to `student` and/or `application`
8. `commissions` attach to `agent`, `partner`, `application`, and invoice/payment milestones
9. `communication_logs`, `notifications`, and `audit_logs` preserve the operational trail throughout

## 5. Status / History Tracking Model

### Operational status columns
- `leads.status`, `leads.pipeline_stage`, `lead_stage_id`
- `follow_ups.status`, `outcome_type`, `due_at`, `completed_at`
- `students.status`
- `applications.status`, `current_stage_id`
- `visa_cases.status`
- `invoices.status`
- `payments.status`
- `commissions.status`
- `notifications.status`

### History strategy
- Append-only tables:
  - `lead_notes`
  - `lead_activities`
  - `application_stage_history`
  - `communication_logs`
  - `audit_logs`
  - `automation_runs`
  - `dynamic_form_submissions`
- Mutable tables keep only current state; history tables preserve state transitions
- For sensitive transitions, write both:
  - business history row, and
  - `audit_logs` row

### Approval and lifecycle model
- Transfer approvals, ownership overrides, commission approvals, billing plan changes, and permission changes must always write `audit_logs`
- Application stage change writes to:
  - `applications.current_stage_id`
  - `application_stage_history`
  - `audit_logs`
- Follow-up completion writes to:
  - `follow_ups`
  - `lead_activities`
  - optionally `notifications` and `automation_runs`

### Archival strategy
- Soft-delete user-facing operational rows first
- Archive closed applications, paid invoices, and old notifications to partitioned history tables or cold storage after policy thresholds
- Never hard-delete audit or communication logs; use retention partitions if volume grows

## 6. Custom Field and Dynamic Form Strategy

### Custom fields
- `custom_fields` defines the schema
- `custom_field_values` stores the actual values
- Keep custom fields tenant-scoped and module-scoped
- Use typed columns in `custom_field_values` so reporting remains practical
- Use `JSONB` only when the field type itself is JSON or multi-select

### Dynamic forms
- `dynamic_forms` stores form metadata, scope, submission rules, theme, and defaults
- `dynamic_form_fields` stores the ordered field list and validation rules
- `dynamic_form_submissions` stores raw and normalized submissions
- Public forms, QR forms, branch intake forms, and website widgets all use the same form engine

### No-code editable items
- lead stages
- application stages
- visa and document checklists
- invoice fee type lists through `system_settings`
- communication templates through `templates`
- automation rules through `automation_rules`
- custom fields through `custom_fields`
- tags through `lead_tags`
- partner categories through `system_settings`
- dashboard widgets through `dashboard_configs`
- branch settings through `branches.settings_jsonb`
- intake options through `system_settings`
- document requirements by country/university/program through `checklists` and `workflow_definitions`
- role policies through `roles`, `role_permissions`, and `permission_bundles`

## 7. File Storage Strategy

### Binary storage
- Store actual files in S3-compatible object storage
- Never store binary blobs in PostgreSQL except rare small generated assets if absolutely required

### Metadata model
- `files` stores location, checksum, size, access mode, entity linkage, and metadata
- Use signed URLs for private file access
- Use `student_documents` for typed student-document management
- Application and visa documents can use `files.related_entity_type/id` directly or later add typed join tables if volume requires specialized workflow

### File lifecycle
- Upload file to object storage first
- Create `files` metadata row only after upload succeeds
- Link to business entity
- Write `audit_logs`
- On delete, mark metadata row soft-deleted and queue object deletion after retention grace period

## 8. Audit and Notification Strategy

### Audit logs
- `audit_logs` is append-only and immutable
- Capture:
  - actor
  - tenant
  - branch
  - action key
  - target entity
  - before/after snapshot
  - metadata such as reason, request origin, approval chain

### Notifications
- `notifications` stores delivery intent and in-app state
- Email/SMS/WhatsApp delivery events are mirrored in `communication_logs`
- Recommended pattern:
  - create notification row
  - enqueue delivery job
  - update delivery state
  - append communication log entry

## 9. Indexing Strategy

### Mandatory composite indexes
- Every transactional table should index `tenant_id` first
- Branch-owned data should index `(tenant_id, branch_id, ...)`
- User-work queues should index `(tenant_id, assigned_user_id, status, due_at)`
- Timeline tables should index `(entity_id, created_at desc)`

### Suggested advanced indexes
- GIN on:
  - `leads.preferred_countries`
  - config `JSONB` fields that need rule lookup
  - `workflow_definitions.stages_jsonb` only if runtime queries require it
- Partial unique indexes:
  - active email/mobile duplicates on `leads`
  - active invoice number
  - active role codes
- Full text or trigram:
  - `leads.full_name`
  - `students.full_name`
  - `universities.name`
  - `programs.name`

### Partitioning plan
- Future partition candidates:
  - `audit_logs` by month
  - `communication_logs` by month
  - `notifications` by month or tenant cohort
  - `dynamic_form_submissions` by month

## 10. Security and Tenant Isolation Rules

### Non-negotiable rules
- Every protected query must include `tenant_id = currentTenantId`
- Branch users must also be limited by `branch_id` unless policy explicitly grants wider scope
- Soft-deleted rows must be excluded by default
- Sensitive config rows such as `integration_settings.secret_ref_jsonb` are never returned raw to the client

### Row access strategy
- Tenant scope comes from JWT and trusted backend middleware only
- Branch scope is resolved from role policy plus branch ownership
- Super-admin support should use explicit impersonation tokens and still keep audit traces

### Foreign key and cascade strategy
- Use `ON DELETE RESTRICT` for master/transaction relationships to prevent accidental data loss
- Use `ON DELETE SET NULL` only where actor or assignee records may be removed but history must survive
- Use soft delete for user-visible records; do not physically cascade-delete business history

## 11. Recommended Database Stack

### Primary database
- PostgreSQL 16+
- Recommended extensions:
  - `pgcrypto` for UUID generation
  - `citext` for case-insensitive email/text keys
  - `pg_trgm` for name and course search

### Flexible storage
- `JSONB` for:
  - workflow definitions
  - automation conditions/actions
  - dashboard widget layouts
  - form field config
  - integration provider config
  - lightweight tenant/branch settings

### Cache and queue
- Redis for:
  - login/session throttling
  - short-lived permission cache
  - rate limiting for public forms
  - job queue coordination

### Background jobs
- Use a queue such as BullMQ / Faktory / PgBoss for:
  - reminders
  - notification delivery
  - automation execution
  - file post-processing
  - invoice overdue checks
  - report materialization

### Object storage
- S3, Cloudflare R2, MinIO, or other S3-compatible storage
- Store only metadata and access control in PostgreSQL

### Optional search layer later
- Add OpenSearch or Meilisearch when:
  - course catalog grows large
  - CRM search requires fuzzy + filtered cross-entity discovery
  - dashboard/reporting queries need read replicas or denormalized projections

## 12. Suggested Folder Structure for Backend Models / Schemas / Migrations

```text
Backend/
  database/
    STORAGE_ARCHITECTURE.md
    postgresql/
      migrations/
        0001_core_tenancy_access.sql
        0002_crm_student_pipeline.sql
        0003_admissions_finance_operations.sql
        0004_config_automation_logs.sql
    prisma/
      schema.prisma
    seeds/
      enterprise-config.seed.json
  src/
    modules/
      tenancy/
      access/
      crm/
      students/
      admissions/
      visas/
      finance/
      automation/
      notifications/
      forms/
      integrations/
      reports/
    jobs/
    shared/
      db/
      auth/
      auditing/
      storage/
```

## 13. Example PostgreSQL Schema Snippets

```sql
create table tenants (
  id uuid primary key default gen_random_uuid(),
  tenant_code varchar(32) not null,
  legal_name varchar(180) not null,
  display_name varchar(180) not null,
  slug varchar(120) not null,
  status varchar(24) not null default 'trial',
  settings_jsonb jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create unique index uq_tenants_slug on tenants (slug) where deleted_at is null;
```

```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  branch_id uuid not null references branches(id) on delete restrict,
  assigned_to uuid null references users(id) on delete set null,
  service_type varchar(24) not null,
  entity_type varchar(24) not null default 'lead',
  status varchar(24) not null default 'new',
  full_name varchar(160) not null,
  email citext null,
  mobile varchar(32) null,
  preferred_countries jsonb not null default '[]'::jsonb,
  lead_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index idx_leads_tenant_branch_status on leads (tenant_id, branch_id, status);
create unique index uq_leads_email_active on leads (tenant_id, lower(email)) where email is not null and deleted_at is null;
```

```sql
create table automation_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete restrict,
  module_key varchar(60) not null,
  trigger_event varchar(80) not null,
  name varchar(160) not null,
  conditions_jsonb jsonb not null default '[]'::jsonb,
  actions_jsonb jsonb not null default '[]'::jsonb,
  priority integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);
```

## 14. Example Prisma Models

The complete example lives in [schema.prisma](./prisma/schema.prisma). Representative models:

```prisma
model Tenant {
  id          String   @id @default(uuid()) @db.Uuid
  tenantCode  String   @unique @map("tenant_code")
  legalName   String   @map("legal_name")
  displayName String   @map("display_name")
  slug        String   @unique
  status      String   @default("trial")
  settings    Json     @default("{}") @map("settings_jsonb")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  branches    Branch[]
  users       User[]
  leads       Lead[]

  @@map("tenants")
}
```

```prisma
model Lead {
  id             String   @id @default(uuid()) @db.Uuid
  tenantId       String   @db.Uuid @map("tenant_id")
  branchId       String   @db.Uuid @map("branch_id")
  assignedTo     String?  @db.Uuid @map("assigned_to")
  serviceType    String   @map("service_type")
  entityType     String   @default("lead") @map("entity_type")
  status         String   @default("new")
  fullName       String   @map("full_name")
  email          String?  @db.Citext
  mobile         String?
  preferredCountries Json @default("[]") @map("preferred_countries")
  leadScore      Int      @default(0) @map("lead_score")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  deletedAt      DateTime? @map("deleted_at")

  tenant         Tenant   @relation(fields: [tenantId], references: [id])
  branch         Branch   @relation(fields: [branchId], references: [id])
  followUps      FollowUp[]

  @@index([tenantId, branchId, status])
  @@map("leads")
}
```

## 15. Example API Payload Structures for Key Modules

### Lead record
```json
{
  "tenantId": "3bb8eb9c-92e7-4428-9ced-e93c26f24a83",
  "branchId": "0d1424d6-96b9-4703-bb04-36db8c9f6c97",
  "serviceType": "consultancy",
  "entityType": "lead",
  "assignedTo": "5bc2290b-c5a7-486e-9580-4d62e5bd8de8",
  "leadStageId": "b3182192-9e6f-4e6d-a529-d842eb9af6f5",
  "fullName": "Aarav Sharma",
  "email": "aarav@example.com",
  "mobile": "+9779800000000",
  "preferredCountries": ["AU", "UK"],
  "leadScore": 72,
  "status": "open",
  "sourceType": "website_form",
  "sourceMeta": {
    "campaign": "march-intake",
    "landingPage": "/study-in-australia"
  }
}
```

### Student record
```json
{
  "tenantId": "3bb8eb9c-92e7-4428-9ced-e93c26f24a83",
  "branchId": "0d1424d6-96b9-4703-bb04-36db8c9f6c97",
  "sourceLeadId": "ab8c34cd-f214-4802-b992-74be5f8f5f46",
  "serviceType": "consultancy",
  "entityType": "client",
  "studentCode": "TEF-CL-000145",
  "status": "active",
  "fullName": "Aarav Sharma",
  "targetCountryCode": "AU"
}
```

### Application record
```json
{
  "tenantId": "3bb8eb9c-92e7-4428-9ced-e93c26f24a83",
  "branchId": "0d1424d6-96b9-4703-bb04-36db8c9f6c97",
  "studentId": "57cb1cb2-1d73-4e2d-a61f-0af0b65060b8",
  "universityId": "354397d6-55ca-4727-a6a3-8459ccbf9ea4",
  "programId": "9e77ad8c-c307-4ac1-8d72-a6272095eb25",
  "countryCode": "AU",
  "status": "in_progress",
  "intakeLabel": "2026 July",
  "workflowDefinitionId": "cbb2f355-b923-4937-ae91-af62698d6485"
}
```

### Invoice record
```json
{
  "tenantId": "3bb8eb9c-92e7-4428-9ced-e93c26f24a83",
  "branchId": "0d1424d6-96b9-4703-bb04-36db8c9f6c97",
  "studentId": "57cb1cb2-1d73-4e2d-a61f-0af0b65060b8",
  "applicationId": "6fc1f762-4959-42a0-8a3f-795065ab4a8e",
  "invoiceNumber": "INV-2026-00041",
  "status": "issued",
  "currencyCode": "USD",
  "totalAmount": 450.0,
  "balanceAmount": 450.0
}
```

### Automation rule record
```json
{
  "tenantId": "3bb8eb9c-92e7-4428-9ced-e93c26f24a83",
  "moduleKey": "lead",
  "triggerEvent": "lead.created",
  "name": "Auto assign AU counsellor",
  "conditionsJson": [
    { "field": "preferredCountries", "operator": "contains", "value": "AU" }
  ],
  "actionsJson": [
    { "type": "assign_by_workload", "role": "counsellor", "country": "AU" },
    { "type": "create_follow_up", "offsetHours": 4 }
  ]
}
```

### Custom field record
```json
{
  "tenantId": "3bb8eb9c-92e7-4428-9ced-e93c26f24a83",
  "moduleKey": "lead",
  "fieldKey": "guardian_occupation",
  "label": "Guardian Occupation",
  "dataType": "text",
  "isRequired": false,
  "isSearchable": true,
  "displayOrder": 18
}
```

## 16. Final Recommended Production Approach

### Recommended final schema
- Use the PostgreSQL schema in `postgresql/migrations`
- Keep transactional tables normalized
- Use config tables and targeted `JSONB` for editable operations
- Use append-only history tables for audits and stage transitions

### Recommended ORM structure
- Prisma or TypeORM can both support this design
- Recommended practical split:
  - Prisma for schema management and type-safe CRUD
  - raw SQL/materialized views for complex reporting

### Recommended migration plan
1. Create PostgreSQL core tenancy, identity, and access tables
2. Dual-write new operational modules to PostgreSQL while Mongo remains authoritative
3. Backfill CRM, student, and application records in batches
4. Cut read paths module-by-module after validation
5. Move reporting and finance fully to PostgreSQL
6. Archive Mongo collections after parity and audit sign-off

### Scaling best practices
- Add read replicas for reporting-heavy workloads
- Partition `audit_logs`, `communication_logs`, and `notifications`
- Move search-heavy catalog and CRM discovery to OpenSearch/Meilisearch later
- Use background workers for reminders, automations, invoices, and document processing
- Add data retention and archival policies early
- Generate analytics views or materialized views for dashboard widgets instead of making OLTP tables carry reporting logic alone
