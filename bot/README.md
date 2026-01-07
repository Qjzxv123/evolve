# Prospecting Bot

A Node-based bot that searches small-business forums for relevant threads and sends tailored outreach emails.

## What it does
- Uses free Reddit search by default to find relevant threads; optional SerpAPI if you want Google results.
- Scrapes each thread for contact emails and short context.
- Sends a custom outreach email via SendGrid or SMTP; defaults to log-only dry-run so you can vet messages first.
- Tracks contacted threads in `bot/prospect-state.json` to avoid duplicates.

## Setup
1) Ensure Node 18+ (needs global `fetch`).
2) Add required environment variables (a `.env` file works fine):
   - `OUTREACH_FROM_EMAIL` – From address for emails (needed for any sending mode).
   - `OUTREACH_FROM_NAME` – Optional display name (default: `Outreach Bot`).
   - `OUTREACH_REPLY_TO` – Optional reply-to address.
   - `OUTREACH_MAX_EMAILS` – Optional cap per run (default: 5).
   - `OUTREACH_DRY_RUN` – `true` to preview without sending (default), `false` to send.
   - `OUTREACH_SEARCH_PROVIDER` – `reddit` (free, default) or `serpapi` (requires `SERPAPI_API_KEY`).
   - `OUTREACH_EMAIL_PROVIDER` – `log` (default, no send), `sendgrid` (needs `SENDGRID_API_KEY`), or `smtp` (see below).
   - SMTP vars (only if `OUTREACH_EMAIL_PROVIDER=smtp`): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, optional `SMTP_SECURE=true`.
   - SerpAPI var (only if `OUTREACH_SEARCH_PROVIDER=serpapi`): `SERPAPI_API_KEY`.
3) Customize keywords/sites if you want in `bot/prospect-bot.js` (`KEYWORDS`, `FORUM_SITES`).

## Run
```
node bot/prospect-bot.js
```

## Notes
- The bot writes contacted threads to `bot/prospect-state.json`; delete it if you want a clean slate.
- Reddit search is free but rate-limited; SerpAPI costs money but yields broader results.
- Scraping/emailing needs network access; keep `OUTREACH_DRY_RUN=true` until you are comfortable with the copy.
