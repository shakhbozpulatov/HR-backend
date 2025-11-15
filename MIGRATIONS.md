# Database Migrations Guide

## Migration Commands

### Run Migrations
To apply all pending migrations to the database:
```bash
pnpm run migration:run
```

### Revert Last Migration
To undo the last migration:
```bash
pnpm run migration:revert
```

### Generate New Migration
To create a new migration file based on entity changes:
```bash
pnpm run migration:generate
```

This will create a new migration file in `src/database/migrations/` with a timestamp prefix.

## Migration Files Location

All migration files are located in:
- **Source**: `src/database/migrations/`
- **Compiled**: `dist/database/migrations/` (after build)

## Configuration

Migration configuration is in `src/config/database.config.ts`:
- Development: Uses TypeScript files from `src/database/migrations/*.ts`
- Production: Uses compiled JavaScript files from `dist/database/migrations/*.js`

## Important Notes

1. **Never use `synchronize: true` in production** - Always use migrations
2. **Always test migrations** in development before applying to production
3. **Backup your database** before running migrations in production
4. **Review generated migrations** before running them

## Troubleshooting

If migrations fail:
1. Check database connection settings in `.env`
2. Verify migration files are in the correct location
3. Check that all previous migrations have been applied
4. Review the error message for specific issues

