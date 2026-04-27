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
