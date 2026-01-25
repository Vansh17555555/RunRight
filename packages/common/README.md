# @runright/common

Shared source of truth for the RunRight monorepo.

## 📦 What's Inside?

- **Prisma Schema**: The master record of our Database (Postgres).
- **Database Client**: Pre-configured Prisma client for all apps.
- **Shared Types**: Job payloads, execution results, and status enums.
- **Environment Config**: Base `.env` structure.

## 🛠️ Commands

### Generate Client
Run this after changing the schema:
```bash
npm run generate
```

### Apply Migrations
Sync your local DB with the schema:
```bash
npm run migrate
```
