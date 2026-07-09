require('dotenv').config();
const { Telegraf } = require('telegraf');
const config = require('./config');
const logger = require('./services/logger');
const startHandler = require('./commands/start');
const callbackHandler = require('./handlers/callbackHandler');
const { withdrawCommand } = require('./commands/withdraw');
const {
  adminPanel, adminBan, adminUnban, adminAddBalance, adminRemoveBalance,
} = require('./commands/admin');

if (!config.bot.token || config.bot.token === 'your_bot_token_here') {
  logger.error('BOT_TOKEN is missing. Create a .env file with BOT_TOKEN=your_token');
  process.exit(1);
}

const bot = new Telegraf(config.bot.token, config.proxy ? { telegram: { agent: { proxy: config.proxy } } } : {});

bot.start((ctx) => startHandler(ctx, bot));

bot.command('admin', (ctx) => adminPanel(ctx, bot));

bot.command('withdraw', (ctx) => {
  const text = ctx.message.text;
  const args = text.split(/\s+/).slice(1);
  withdrawCommand(ctx, bot, args);
});

bot.command('ban', (ctx) => {
  const args = ctx.message.text.split(/\s+/).slice(1);
  adminBan(ctx, bot, args);
});

bot.command('unban', (ctx) => {
  const args = ctx.message.text.split(/\s+/).slice(1);
  adminUnban(ctx, bot, args);
});

bot.command('addbalance', (ctx) => {
  const args = ctx.message.text.split(/\s+/).slice(1);
  adminAddBalance(ctx, bot, args);
});

bot.command('removebalance', (ctx) => {
  const args = ctx.message.text.split(/\s+/).slice(1);
  adminRemoveBalance(ctx, bot, args);
});

bot.command('stats', (ctx) => ctx.reply('/stats')); // placeholder
bot.command('users', (ctx) => ctx.reply('/users'));
bot.command('withdraws', (ctx) => ctx.reply('/withdraws'));
bot.command('broadcast', (ctx) => ctx.reply('/broadcast'));
bot.command('export', (ctx) => ctx.reply('/export'));

bot.on('callback_query', (ctx) => callbackHandler(ctx, bot));

bot.catch((err) => {
  logger.error(`Bot error: ${err.message}`);
});

bot.launch().then(() => {
  logger.info('Bot started successfully');
}).catch((err) => {
  logger.error(`Failed to start: ${err.message}`);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
process.on('uncaughtException', (err) => logger.error(`Uncaught: ${err.message}`));
process.on('unhandledRejection', (reason) => logger.error(`Unhandled: ${reason}`));

module.exports = bot;
