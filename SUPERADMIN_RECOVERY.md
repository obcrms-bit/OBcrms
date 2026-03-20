# Super Admin Recovery

Use this only when you need to create or recover a production super admin without wiping tenant data.

## What This Does

The backend now includes a safe one-off bootstrap script:

```bash
cd Backend
npm run bootstrap:super-admin
```

It will:

- create a super admin if the email does not exist
- reuse the existing tenant if the email already belongs to a user
- optionally reset the password only when you explicitly allow it
- never delete tenant, branch, lead, student, or billing data

## Required Environment Variables

Set these temporarily in Render Shell or in a one-off local environment:

```bash
SUPERADMIN_EMAIL=owner@trusteducation.com
SUPERADMIN_PASSWORD=replace_with_a_strong_password
SUPERADMIN_NAME=Trust Education Owner
SUPERADMIN_COMPANY_NAME=Trust Education Foundation
SUPERADMIN_COMPANY_EMAIL=owner@trusteducation.com
SUPERADMIN_COUNTRY=Nepal
SUPERADMIN_TIMEZONE=Asia/Kathmandu
SUPERADMIN_RESET_PASSWORD=true
SUPERADMIN_ALLOW_ROLE_UPGRADE=true
```

Notes:

- `SUPERADMIN_RESET_PASSWORD=true` is required if you want to change the password of an existing account.
- `SUPERADMIN_ALLOW_ROLE_UPGRADE=true` is required only if the email already belongs to a non-super-admin user and you want to elevate that user.
- If the email does not exist yet, the script creates the account and tenant safely.

## Render One-Off Recovery

1. Open your Render backend service.
2. Open the Shell for the live service.
3. Export the temporary variables:

```bash
export SUPERADMIN_EMAIL=owner@trusteducation.com
export SUPERADMIN_PASSWORD='use-a-strong-password-here'
export SUPERADMIN_NAME='Trust Education Owner'
export SUPERADMIN_COMPANY_NAME='Trust Education Foundation'
export SUPERADMIN_COMPANY_EMAIL='owner@trusteducation.com'
export SUPERADMIN_COUNTRY='Nepal'
export SUPERADMIN_TIMEZONE='Asia/Kathmandu'
export SUPERADMIN_RESET_PASSWORD='true'
export SUPERADMIN_ALLOW_ROLE_UPGRADE='true'
```

4. Run:

```bash
cd /opt/render/project/src/Backend
npm run bootstrap:super-admin
```

5. Remove the temporary shell variables after the recovery is complete.

## Local Recovery Against Production Mongo

Only do this if your local machine is already configured with the production `MONGO_URI`.

```bash
cd Backend
$env:SUPERADMIN_EMAIL='owner@trusteducation.com'
$env:SUPERADMIN_PASSWORD='use-a-strong-password-here'
$env:SUPERADMIN_NAME='Trust Education Owner'
$env:SUPERADMIN_COMPANY_NAME='Trust Education Foundation'
$env:SUPERADMIN_COMPANY_EMAIL='owner@trusteducation.com'
$env:SUPERADMIN_COUNTRY='Nepal'
$env:SUPERADMIN_TIMEZONE='Asia/Kathmandu'
$env:SUPERADMIN_RESET_PASSWORD='true'
$env:SUPERADMIN_ALLOW_ROLE_UPGRADE='true'
npm run bootstrap:super-admin
```

## Important Safety Rules

- Do not run `npm run seed` on production. The seed script clears data first.
- Do not leave `SUPERADMIN_PASSWORD` set in Render environment variables permanently.
- Use the bootstrap script only as a one-off recovery or first-time setup command.
