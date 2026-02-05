# Uptime Monitor Bot

Telegram bot to monitor website uptime/status. Built with NestJS + grammY + TypeORM/Postgres.

## Features

- Add HTTPS websites via conversation
- View list with real-time status (🟢 up / 🔴 down / ⏳ pending)
- On-demand "Check Now" or "Check All"
- Detailed downtime reasons (status code / network error)
- Delete websites
- Webhook support (production-ready)

## Tech Stack

- NestJS (framework)
- grammY + @grammyjs/menu + @grammyjs/conversations (Telegram API)
- TypeORM + PostgreSQL
- Axios (HTTP checks)

## Setup

1. Clone repo
2. `npm install`
3. Copy `.env.example` → `.env` and fill:
   - TELEGRAM_BOT_TOKEN (from @BotFather)
   - DB_* vars for Postgres
   - (optional) TELEGRAM_WEBHOOK_URL + PATH for webhook mode
4. `npm run start:dev` (polling) or deploy to Koyeb/Render/etc.

## Customization

- Change status emojis: edit `getStatusEmoji()` in menus/utils
- Adjust timeout/response handling: `monitor.service.ts`
- Add periodic checks: future cron module (not in v1)
- Env vars explanation in .env.example

## Architecture

- `bot/` — Telegram logic, menus, conversations
- `domain/` — Entities (User, Website)
- `user-website/` — Relation management
- `monitor/` — Uptime checking logic

## Contributing

- Fork & PR
- Use feature branches
- Add tests for services if possible
- Update README for new features

MIT License — feel free to fork/adapt!
