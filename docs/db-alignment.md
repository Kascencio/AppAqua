# Database Schema Alignment Guide

## Overview

This document describes the database schema alignment process for **AppAqua**, ensuring synchronization between the MySQL 5.7 production database and the Prisma schema definition.

## Current Status (V4)

The project has been updated to include the V4 database schema which includes:

### New Tables (V4)
- `organizacion` - Main organization entity (replacing/complementing empresa)
- `organizacion_sucursal` - Organization branches
- `catalogo_especies` - Species catalog for biological tracking
- `especies_instaladas` - Species installed in facilities
- `especie_tracking` - Historical tracking of species data

### Enhanced Tables
- `empresa` - Extended with additional fields (RFC, regimen_fiscal, etc.)
- `empresa_sucursal` - Enhanced with more location and business data
- `catalogo_sensores` - Improved with measurement types and ranges
- `alertas` - Updated structure with proper alert levels

## Schema Synchronization Process

### 1. Initial Migration (From Legacy to V4)

```bash
# Generate Prisma client
npx prisma generate

# Apply the V4 migration
npx prisma migrate deploy

# Verify alignment
npm run verify:db-alignment
```

### 2. Daily Verification (CI/CD)

The verification script (`scripts/verify-db-alignment.ts`) should be run in CI to detect schema drift:

```bash
npm run verify:db-alignment
```

This script:
- Connects to the database
- Compares actual DB schema with Prisma schema
- Checks for missing tables or models
- Verifies V4 tables are present
- Reports migration status

### 3. Handling Schema Drift

If drift is detected:

#### Option A: Update Prisma from Database (Safe)
```bash
# Pull current DB schema into Prisma
npx prisma db pull

# Generate new Prisma client
npx prisma generate

# Review changes and commit
git add prisma/schema.prisma
git commit -m "sync: update Prisma schema from production DB"
```

#### Option B: Apply Prisma Changes to Database (Careful)
```bash
# Create migration from Prisma changes
npx prisma migrate dev --name sync_with_prisma

# Review the generated SQL before applying
# Apply to production
npx prisma migrate deploy
```

## MySQL 5.7 Compatibility Notes

### Supported Features
- ✅ JSON columns (limited support)
- ✅ DECIMAL with precision
- ✅ DATETIME(6) for microseconds
- ✅ Foreign key constraints
- ✅ Triggers (for aggregation)

### Limitations
- ❌ No CTEs (Common Table Expressions)
- ❌ No Window functions
- ❌ Limited JSON functions
- ❌ No generated columns

### Best Practices
1. Use `VARCHAR` instead of `TEXT` when possible
2. Keep JSON usage minimal and simple
3. Use explicit `DECIMAL(10,2)` for currency/measurements
4. Add proper indexes for query performance
5. Use triggers carefully (documented in `bd.sql`)

## Production Deployment Steps

### Pre-deployment
1. Backup current database
2. Test migration on staging environment
3. Verify all existing data remains accessible

### Deployment
1. Put application in maintenance mode
2. Apply database migrations
3. Run alignment verification
4. Start application
5. Verify critical functionality

### Rollback Plan
1. Stop application
2. Restore database backup
3. Revert application code
4. Verify system functionality

## Monitoring & Alerts

- Set up database monitoring for:
  - Connection pool exhaustion
  - Long-running queries (>5s)
  - Lock timeouts
  - Replication lag (if applicable)

## Files in This Migration

- `bd.sql` - Complete V4 schema with triggers and views
- `prisma/schema.prisma` - Updated Prisma models
- `prisma/migrations/20241012000001_init_v4_schema/` - Initial V4 migration
- `scripts/verify-db-alignment.ts` - Verification script

## Troubleshooting

### Common Issues

1. **Prisma Client not found**
   ```bash
   npm run db:generate
   ```

2. **Migration conflicts**
   ```bash
   npx prisma migrate resolve --applied <migration_name>
   ```

3. **Connection timeout**
   - Check DATABASE_URL format
   - Verify VPS firewall settings
   - Test connection with mysql client

4. **Character set issues**
   - Ensure database uses `utf8mb4_unicode_ci`
   - Check application charset configuration

### Support Contacts

- Database: [DBA team contact]
- Infrastructure: [DevOps team contact]
- Application: [Development team contact]

---

Last updated: October 12, 2024
Version: V4.0