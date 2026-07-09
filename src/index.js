require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const logger = require('./services/logger');
const startHandler = require('./commands/start');
const callbackHandler = require('./handlers/callbackHandler');
const { withdrawCommand } = require('./commands/withdraw');
const {
  adminPanel, adminBan, adminUnban, adminAddBalance, adminRemoveBalance, handleBroadcast,
  adminStatsCmd, adminUsersCmd, adminWithdrawsCmd, adminBroadcastCmd, adminExportCmd,
} = require('./commands/admin');

if (!config.bot.token || config.bot.token === 'your_bot_token_here') {
  logger.error('BOT_TOKEN is missing. Create a .env file with BOT_TOKEN=your_token');
  process.exit(1);
}

const botOptions = { polling: true };
if (config.proxy) {
  botOptions.request = { proxy: config.proxy };
  logger.info(`Using proxy: ${config.proxy}`);
}
const bot = new TelegramBot(config.bot.token, botOptions);

logger.info('Bot started successfully');

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

bot.onText(/\/start(.+)?/, (msg) => startHandler(msg, bot));

bot.onText(/\/admin/, (msg) => adminPanel(msg, bot));

bot.onText(/\/withdraw (.+)/, (msg, match) => {
  const args = match[1].split(/\s+/);
  withdrawCommand(msg, bot, args);
});

bot.onText(/\/withdraw$/, (msg) => {
  withdrawCommand(msg, bot, []);
});

bot.onText(/\/ban (.+)/, (msg, match) => {
  adminBan(msg, bot, match[1].split(/\s+/));
});

bot.onText(/\/unban (.+)/, (msg, match) => {
  adminUnban(msg, bot, match[1].split(/\s+/));
});

bot.onText(/\/addbalance (.+)/, (msg, match) => {
  adminAddBalance(msg, bot, match[1].split(/\s+/));
});

bot.onText(/\/removebalance (.+)/, (msg, match) => {
  adminRemoveBalance(msg, bot, match[1].split(/\s+/));
});

bot.onText(/\/stats/, (msg) => {
  adminStatsCmd(msg, bot);
});

bot.onText(/\/users/, (msg) => {
  adminUsersCmd(msg, bot);
});

bot.onText(/\/withdraws/, (msg) => {
  adminWithdrawsCmd(msg, bot);
});

bot.onText(/\/broadcast/, (msg) => {
  adminBroadcastCmd(msg, bot);
});

bot.onText(/\/export/, (msg) => {
  adminExportCmd(msg, bot);
});

bot.on('callback_query', (query) => callbackHandler(query, bot));

bot.on('message', (msg) => {
  if (msg.from.is_bot) return;
  if (msg.text && msg.text.startsWith('/')) return;
  const admins = config.admins;
  if (admins.includes(msg.from.id) && msg.reply_to_message && msg.reply_to_message.text === '📢 Broadcast') {
    handleBroadcast(msg, bot);
  }
});

bot.on('polling_error', (err) => {
  if (err.code === 'EFATAL') {
    logger.error(`Polling EFATAL error: ${err.message}. Retrying...`);
  } else {
    logger.error(`Polling error: ${err.message}`);
  }
});

module.exports = bot;
