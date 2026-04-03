# TG Casino Bot (JavaScript)

Telegram Casino Bot with roulette, betting, slots, transfers, and leaderboards.

## Installation

1. Clone repo
2. `cd tg-casino`
3. `npm install`

## Configure

- Set token in `config.js` as `TOKEN = '<YOUR_TELEGRAM_BOT_TOKEN>'` or set environment variable `TELEGRAM_BOT_TOKEN`.

## Run

`npm start`

## Commands

- `/start` - initialize and get coins
- `/balance` or `/bal` - check your coins
- `/top` - top in the chat (use in group)
- `/top all` - global top
- `/roulette <amount> <red|black|green|odd|even>`
- `/bet <amount> <high|low|odd|even>`
- `/slots <amount>`
- `/pay <@username|user_id> <amount>` - transfer coins
- `/help` - show help

## Rules

- Starting balance: 1000 coins per new user
- Minimum bet/transfer: 100
- Maximum bet/transfer: 999999
- Data persisted in `data/users.json`
