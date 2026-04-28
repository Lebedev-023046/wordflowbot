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
npm run db:sql
npm run prisma:migrate
npm run prisma:migrate:deploy
npm run prisma:migrate:status
```

Local scripts expect `WORDFLOWBOT_ENV_FILE` to point to your real env file.

If you use oh-my-zsh, add this to `~/.zshrc`:

```bash
export WORDFLOWBOT_ENV_FILE="$HOME/Documents/wordflowbot/.env"
```

Then reload your shell:

```bash
source ~/.zshrc
```

## Database Setup

- `DATABASE_URL` is the runtime bot connection.

Typical local workflow:

```bash
npm run db:up
npm run prisma:migrate
npm run bot
```

If you previously used the older multi-role Postgres setup locally, reset the Docker volume once before switching to the simplified one-user setup:

```bash
npm run db:down
docker volume rm wordflowbot_postgres_data
npm run db:up
```

That clears the old local database state and recreates Postgres with the current env values.

Manual database access:

```bash
npm run db:sql
```

## Production Deployment

For a single VPS deployment with Postgres in Docker on the same host:

1. Copy [.env.prod.example](/Users/dmitry-lebedev/Desktop/job-related/WordFlowBot/.env.prod.example) to the server, for example as `/opt/wordflowbot/.env`.
2. Fill in the real secrets and passwords.
3. Keep `DATABASE_URL` pointed at `postgres:5432`, not `localhost`.
4. Start the stack with:

```bash
docker compose --env-file /opt/wordflowbot/.env -f docker-compose.prod.yml up -d --build
```

Notes:

- The bot image is built from [Dockerfile](/Users/dmitry-lebedev/Desktop/job-related/WordFlowBot/Dockerfile).
- The bot container runs `prisma migrate deploy` before `node dist/app/index.js`.
- Postgres is not published publicly in [docker-compose.prod.yml](/Users/dmitry-lebedev/Desktop/job-related/WordFlowBot/docker-compose.prod.yml); it stays inside the Compose network.
- The local and production env templates use one Postgres user for both app runtime and Prisma migrations.
- The bot exposes an internal `/health` endpoint on `HEALTH_PORT` for Docker health checks. It is not published publicly.

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
- `ENRICHMENT_CONCURRENCY=3` limits how many items are sent to OpenAI at once.
- `DEBUG_BOT=true` enables verbose OpenAI and cache diagnostics.
- `LOG_USAGE=true` enables per-request token usage logs.
- `LOG_CACHE=true` enables cache hit/miss/store logs.
