# Frontend QA Validation Guide

## Scope Covered
This guide validates the live Next.js SaaS frontend against the deployed backend and the current product architecture.

Validated areas:
- authentication
- dashboard summary
- leads list
- follow-up summary
- applications list
- notifications
- super admin overview

## Test Data Fixtures
Realistic QA fixtures live in [src/data/qa-scenarios.json](./src/data/qa-scenarios.json).

They include:
- consultancy lead scenario
- test-prep student scenario
- follow-up completion outcomes
- application stage progression examples

These fixtures are for QA and staging validation only. They are not wired into production UI rendering.

## Automated Smoke Check
Run from the `Frontend` directory:

```bash
$env:QA_API_URL='https://obcrms-backend.onrender.com/api'
$env:QA_EMAIL='owner@trusteducation.com'
$env:QA_PASSWORD='StrongPassword123!'
npm run qa:smoke
```

Optional mutation check for non-production environments:

```bash
$env:QA_ENABLE_MUTATION='true'
npm run qa:smoke
```

Default behavior is read-only.

## Manual Validation Checklist

### Authentication
- Login succeeds with a valid admin or super admin account
- Invalid credentials show an inline error, not a network error
- Session persists after refresh

### Dashboard
- KPI cards load API-backed values
- Due today, overdue, and upcoming follow-up blocks render correctly
- Empty states appear when the queue is empty

### Leads
- Filters submit correctly
- Table rows display real API values
- Empty state appears when the query returns no leads
- Create lead form enforces required fields

### Follow-ups
- Queue loads from API
- Reminder status renders without layout breaks
- Completing a follow-up requires notes
- Next follow-up date is required when outcome demands it

### Applications
- Application list loads from API
- Stage selector uses workflow-aware options
- Update action persists correctly

### Super Admin
- Overview KPIs load
- Tenants filter by status
- Impersonation starts from the overview action

## Known Assumptions
- QA smoke tests require valid backend credentials
- Mutation checks should only run against a safe staging or test environment
- Binary uploads and third-party integrations still require environment-specific infrastructure to fully validate
