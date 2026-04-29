# WordFlowBot

WordFlowBot is a Telegram bot for collecting English words and phrases during a learning session, enriching them with AI, and exporting the results as a ReWord-compatible CSV.

## ✨ What This Bot Does

WordFlowBot replaces this workflow:

`brain -> notes -> ChatGPT -> filtering -> formatting -> ReWord`

with this:

`brain -> Telegram bot -> CSV -> ReWord`

### 🎯 Main Idea

You open Telegram, start a session, send words or phrases as they come to mind, and let the bot handle the rest:

- it stores entries immediately
- it enriches them asynchronously with AI
- it keeps your session organized
- it exports the final result as CSV

### ✅ MVP Features

- Start a session
- Add words, phrases, or bulk input
- Save input immediately
- Enrich items asynchronously with:
  - Russian translation
  - Simple English example
  - Russian translation of the example
- End the session
- Export a UTF-8 CSV for ReWord

## 🤖 Telegram Bot Usage

### Bot Setup

1. Open Telegram and talk to `@BotFather`.
2. Run `/newbot` and finish the bot creation flow.
3. Copy the token BotFather gives you.
4. Create `.env` from `.env.example`.
5. Put your real token into `BOT_TOKEN=...`.
6. Start the bot with:

```bash
npm run bot
```

### Typical User Flow

1. Start a session.
2. Send words, phrases, or a block of text.
3. Let the bot enrich entries in the background.
4. Show or export the current session if needed.
5. Finish the session.
6. Start a new session when you want to collect new words.

### Session Model

- Each session is isolated.
- `Show words` and `Export CSV` work only for the current active session.
- Starting a new session starts with an empty list.

## 🛠 Technical Setup

### Stack

- `Node.js`
- `TypeScript`
- `Telegraf`
- `Prisma`
- `PostgreSQL`
- `Docker Compose`
- `OpenAI API`

### Environment Variables

Core runtime variables:

- `BOT_TOKEN`
- `OPENAI_API_KEY`
- `DATABASE_URL`

Useful optional variables:

- `OPENAI_MODEL`
- `OPENAI_SERVICE_TIER`
- `ENRICHMENT_CONCURRENCY`
- `HEALTH_PORT`
- `DEBUG_BOT`
- `LOG_USAGE`
- `LOG_CACHE`

## 💻 Local Development

### Scripts

```bash
npm run dev
npm run bot
npm run build
npm run preview
npm run db:up
npm run db:down
npm run db:restart
npm run db:logs
npm run db:ps
npm run db:sql
npm run prisma:generate
npm run prisma:migrate
npm run prisma:migrate:deploy
npm run prisma:migrate:status
```

### Local Env File

Local scripts expect `WORDFLOWBOT_ENV_FILE` to point to your real env file.

Example:

```bash
export WORDFLOWBOT_ENV_FILE="$HOME/Documents/wordflowbot/.env"
```

Then reload your shell:

```bash
source ~/.zshrc
```

### Typical Local Workflow

```bash
npm run db:up
npm run prisma:migrate
npm run bot
```

### Local Database Notes

- `DATABASE_URL` is the runtime bot connection.
- Local `.env.example` uses `localhost:5432` for Postgres.

If you previously used the older local Postgres setup and want a clean reset:

```bash
npm run db:down
docker volume rm wordflowbot_postgres_data
npm run db:up
```

Manual database access:

```bash
npm run db:sql
```

## 🚀 Production Deployment

For a single VPS deployment with Postgres in Docker on the same host:

1. Copy [.env.prod.example](/Users/dmitry-lebedev/Desktop/job-related/WordFlowBot/.env.prod.example) to the server as `/opt/wordflowbot/.env`.
2. Fill in real secrets and passwords.
3. Keep `DATABASE_URL` pointed at `postgres:5432`, not `localhost`.
4. Start the stack:

```bash
docker compose --env-file /opt/wordflowbot/.env -f docker-compose.prod.yml up -d --build
```

### Production Notes

- The bot image is built from [Dockerfile](/Users/dmitry-lebedev/Desktop/job-related/WordFlowBot/Dockerfile).
- The bot container runs `prisma migrate deploy` before `node dist/app/index.js`.
- Postgres is not exposed publicly in [docker-compose.prod.yml](/Users/dmitry-lebedev/Desktop/job-related/WordFlowBot/docker-compose.prod.yml).
- Local and production env templates use one Postgres user for both runtime and Prisma migrations.
- The bot exposes an internal `/health` endpoint on `HEALTH_PORT` for Docker health checks.

## 🐳 Production Operations

If you use the npm production scripts from [package.json](/Users/dmitry-lebedev/Desktop/job-related/WordFlowBot/package.json), set this once on the server:

```bash
export WORDFLOWBOT_PROD_ENV_FILE=/opt/wordflowbot/.env
```

### NPM Shortcuts

```bash
npm run prod:up
npm run prod:down
npm run prod:restart
npm run prod:ps
npm run prod:logs
```

### Raw Docker Commands

```bash
docker compose --env-file /opt/wordflowbot/.env -f docker-compose.prod.yml up -d --build
docker compose --env-file /opt/wordflowbot/.env -f docker-compose.prod.yml down
docker compose --env-file /opt/wordflowbot/.env -f docker-compose.prod.yml stop
docker compose --env-file /opt/wordflowbot/.env -f docker-compose.prod.yml start
docker compose --env-file /opt/wordflowbot/.env -f docker-compose.prod.yml restart bot
docker compose --env-file /opt/wordflowbot/.env -f docker-compose.prod.yml ps
docker compose --env-file /opt/wordflowbot/.env -f docker-compose.prod.yml logs -f bot
docker compose --env-file /opt/wordflowbot/.env -f docker-compose.prod.yml logs -f postgres
docker compose --env-file /opt/wordflowbot/.env -f docker-compose.prod.yml exec postgres sh -lc 'PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

### Typical VPS Update Flow

```bash
cd /opt/wordflowbot
git pull
npm run prod:up
```

### Operational Notes

- `stop` and `start` pause and resume containers without removing them.
- `down` removes containers and the Compose network, but keeps the named Postgres volume.
- `up -d --build` rebuilds the bot image and starts the stack in the background.
- `logs -f bot` should be your first check when the bot does not answer in Telegram.

## 💸 Cost Controls

Recommended defaults for controlled usage:

- `OPENAI_SERVICE_TIER=flex`
- `ENRICHMENT_CONCURRENCY=1` or `2` on small VPS instances
- `DEBUG_BOT=false`
- `LOG_USAGE=false`
- `LOG_CACHE=false`

What they do:

- `OPENAI_SERVICE_TIER=flex` lowers enrichment cost.
- `ENRICHMENT_CONCURRENCY` limits how many entries are sent to OpenAI at once.
- `DEBUG_BOT=true` enables verbose diagnostics.
- `LOG_USAGE=true` logs token usage.
- `LOG_CACHE=true` logs cache hit/miss/store events.
