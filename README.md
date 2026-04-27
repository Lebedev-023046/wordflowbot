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
npm run build
npm run preview
```
