# WordFlowBot

WordFlowBot is a Telegram bot for capturing English words and phrases during a learning session, enriching them with AI, and exporting the results as a ReWord-compatible CSV.

## Goal

Replace this workflow:

`brain -> notes -> ChatGPT -> filtering -> formatting -> ReWord`

with this:

`brain -> Telegram bot -> CSV -> ReWord`

## MVP

- Start a session
- Add words, phrases, or bulk input
- Save input immediately
- Enrich items asynchronously with:
  - Russian translation
  - Simple English example
  - Russian translation of the example
- End the session
- Export a UTF-8 CSV for ReWord

## Scripts

```bash
npm run dev
npm run bot
npm run build
npm run preview
npm run db:up
npm run db:down
npm run db:logs
npm run db:sql:admin
npm run db:sql:migrator
npm run db:sql:app
npm run prisma:migrate
npm run prisma:migrate:deploy
npm run prisma:migrate:status
```

## Database Roles

- `DATABASE_URL` is the runtime bot connection and uses `wordflowbot_app`.
- `MIGRATION_DATABASE_URL` is for Prisma migrations and uses `wordflowbot_migrator`.
- `wordflowbot_admin` is only for manual database administration.

Typical local workflow:

```bash
npm run db:up
npm run prisma:migrate
npm run bot
```

Manual database access:

```bash
npm run db:sql:admin
npm run db:sql:migrator
npm run db:sql:app
```

## Telegram Bot Setup

1. Open Telegram and talk to `@BotFather`.
2. Run `/newbot` and finish the bot creation flow.
3. Copy the token BotFather gives you.
4. Create `.env` from `.env.example`.
5. Put your real token into `BOT_TOKEN=...`.
6. Start the bot with:

```bash
npm run bot
```

For the current MVP, the bot replies with the same text message it receives.

## Cost Controls

- `OPENAI_SERVICE_TIER=flex` uses lower-cost asynchronous processing.
- `ENRICHMENT_CACHE_FILE=.data/enrichment-cache.json` enables persistent reuse of previously enriched entries across sessions.
- `DEBUG_BOT=true` enables verbose OpenAI and cache diagnostics.
- `LOG_USAGE=true` enables per-request token usage logs.
- `LOG_CACHE=true` enables cache hit/miss/store logs.
