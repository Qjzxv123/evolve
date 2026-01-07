# Prospecting Bot

A Node-based bot that searches small-business forums for relevant threads and sends tailored outreach emails.

## What it does
- Uses SerpAPI to search small business forums with curated keywords.
- Scrapes each thread for contact emails and short context.
- Sends a custom outreach email via SendGrid (defaults to dry-run preview so you can vet messages first).
- Tracks contacted threads in `bot/prospect-state.json` to avoid duplicates.

## Setup
1) Ensure Node 18+ (needs global `fetch`).
2) Add required environment variables (a `.env` file works fine):
   - `SERPAPI_API_KEY` – SerpAPI key for Google searches.
   - `SENDGRID_API_KEY` – SendGrid API key (only needed when not in dry-run).
   - `OUTREACH_FROM_EMAIL` – From address for emails.
   - `OUTREACH_FROM_NAME` – Optional display name (default: `Outreach Bot`).
   - `OUTREACH_REPLY_TO` – Optional reply-to address.
   - `OUTREACH_MAX_EMAILS` – Optional cap per run (default: 5).
   - `OUTREACH_DRY_RUN` – `true` to preview without sending (default), `false` to send.
3) Customize keywords/sites if you want in `bot/prospect-bot.js` (`KEYWORDS`, `FORUM_SITES`).

## Run
```
node bot/prospect-bot.js
```

## Notes
- The bot writes contacted threads to `bot/prospect-state.json`; delete it if you want a clean slate.
- Scraping/emailing needs network access; keep `OUTREACH_DRY_RUN=true` until you are comfortable with the copy.
