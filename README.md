# Telegram Earning Bot

A production-ready Telegram earning bot built with Node.js. Users complete simple tasks (watch ads, visit websites, join channels) to earn virtual coins that can be withdrawn.

## Features

- User auto-registration on /start
- Modular earning system (Watch Ads, Visit Website, Join Channel, Daily Bonus)
- Daily bonus (24h cooldown)
- Referral system with unique links
- Withdrawal requests with admin approval
- Complete earning, withdrawal, and referral history
- User profile
- Admin panel with inline keyboard
- Broadcast messaging (text, photo, video, document)
- User management (ban/unban, add/remove balance)
- Rate limiting and anti-spam protection
- Command cooldowns
- Local JSON database (no cloud dependencies)
- Logging system (errors, warnings, user/admin actions)
- Multi-language ready

## Tech Stack

- Node.js (Latest LTS)
- node-telegram-bot-api
- dotenv
- uuid
- Local JSON database (fs/promises)

## Folder Structure

```
telegram-earning-bot/
├── src/
│   ├── commands/          # Command handlers (start, admin, withdraw)
│   ├── handlers/          # Callback query handler
│   ├── services/          # Business logic services
│   │   └── earn/          # Earning task services
│   ├── utils/             # Utility functions
│   ├── middlewares/       # Error handling middleware
│   ├── database/          # Database layer
│   ├── config/            # Configuration
│   ├── keyboards/         # Inline keyboard layouts
│   ├── messages/          # Language/translation files
│   ├── helpers/           # Helper functions
│   └── index.js           # Bot entry point
├── data/                  # JSON database files (auto-created)
├── logs/                  # Log files (auto-created)
├── .env.example           # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/telegram-earning-bot.git
   cd telegram-earning-bot
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Create a \`.env\` file from the example:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Edit \`.env\` and add your bot token:
   \`\`\`
   BOT_TOKEN=your_actual_bot_token_here
   \`\`\`

5. Configure admin IDs and other settings in \`src/config/index.js\`

## Usage

### Start the bot

\`\`\`bash
npm start
\`\`\`

Or for development:

\`\`\`bash
npm run dev
\`\`\`

## Configuration

Edit \`src/config/index.js\` to customize:

| Setting | Description | Default |
|---------|-------------|---------|
| bot.token | Bot token from .env | process.env.BOT_TOKEN |
| bot.name | Bot display name | Earn Eika |
| bot.currency | Currency symbol | EIKA |
| admins | Array of admin Telegram IDs | [123456789] |
| rewards.dailyBonus | Daily bonus reward | 100 |
| rewards.referralReward | Referral reward | 50 |
| rewards.watchAd | Watch ad reward | 10 |
| rewards.visitWebsite | Visit website reward | 15 |
| rewards.joinChannel | Join channel reward | 25 |
| withdraw.minAmount | Minimum withdraw amount | 500 |
| support.username | Support Telegram username | support |
| channels.required | Required channels for tasks | [] |

## Adding Commands

1. Create a new file in \`src/commands/\` (e.g., \`daily.js\`)
2. Export a handler function
3. Add the route in \`src/index.js\` using \`bot.onText()\`

## Adding Earning Methods

1. Create a new service in \`src/services/earn/\` (e.g., \`quiz.js\`)
2. Add the reward amount in \`src/config/index.js\` under \`rewards\`
3. Add a button in \`src/keyboards/index.js\`
4. Add the case in \`src/handlers/callbackHandler.js\`

## Admin Commands

| Command | Description |
|---------|-------------|
| /admin | Open admin panel |
| /stats | View bot statistics |
| /users | List all users |
| /broadcast | Send message to all users |
| /ban <userId> | Ban a user |
| /unban <userId> | Unban a user |
| /addbalance <userId> <amount> | Add balance to user |
| /removebalance <userId> <amount> | Remove balance from user |
| /withdraws | View pending withdrawals |
| /export | Export user data as JSON |

## User Commands

| Command | Description |
|---------|-------------|
| /start | Start the bot and register |
| /withdraw <amount> <method> <account> | Submit withdrawal request |

## Earning Tasks

- Watch Ad (30s cooldown)
- Visit Website (60s cooldown)
- Join Channel
- Daily Check-in (24h cooldown)

## Security

- Rate limiting on commands and callbacks
- Command cooldowns per user
- Input sanitization
- User ban system
- Admin-only admin commands
- Self-referral prevention
- Duplicate referral prevention
- Global error handling

## Adding New Languages

1. Create a new file in \`src/messages/\` (e.g., \`es.js\`)
2. Copy the structure from \`en.js\` and translate
3. Add the language to the index in \`src/messages/index.js\`

## Deployment

1. Set up a Node.js environment
2. Install dependencies (\`npm install\`)
3. Configure \`.env\` with production token
4. Configure admin IDs
5. Use a process manager like PM2:
   \`\`\`bash
   npm install -g pm2
   pm2 start src/index.js --name earning-bot
   \`\`\`

## Troubleshooting

**Bot doesn't start:**
- Check \`.env\` has a valid \`BOT_TOKEN\`
- Run \`npm install\` to ensure dependencies are installed
- Check logs in the \`logs/\` folder

**Users not registering:**
- Ensure the bot has permission to read messages
- Check if the bot was blocked by Telegram

**Withdrawals not working:**
- Check minimum withdraw amount in config
- Ensure user has sufficient balance
- Check \`data/withdrawals.json\` for entries

## License

MIT
