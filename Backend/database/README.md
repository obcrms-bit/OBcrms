# Backend Storage Package

This directory contains the target storage architecture for the Trust Education Foundation SaaS platform.

Contents:
- `STORAGE_ARCHITECTURE.md`: production storage blueprint, lifecycle model, indexing rules, and example payloads
- `postgresql/migrations/*.sql`: migration-ready PostgreSQL DDL for the recommended target schema
- `prisma/schema.prisma`: representative Prisma models aligned with the PostgreSQL design
- `seeds/enterprise-config.seed.json`: seedable reference data for plans, permissions, workflows, templates, and dashboards

Important:
- The current runtime in this repository still uses MongoDB models.
- This package is the production migration target for a normalized, tenant-safe PostgreSQL architecture.
- Use these artifacts when implementing the next database modernization phase, not as an in-place replacement without migration planning.
