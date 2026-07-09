const { findOrCreateUser, isBanned } = require('../helpers/userHelper');
const { processReferral } = require('../services/referralService');
const { homeKeyboard } = require('../keyboards');
const { getMsg } = require('../messages');
const { limitCommand } = require('../utils/rateLimiter');
const logger = require('../services/logger');

async function startHandler(msg, bot) {
  const telegramId = msg.from.id;
  const text = msg.text || '';

  if (limitCommand(telegramId)) return;

  try {
    const user = await findOrCreateUser(telegramId, msg.from);
    if (user.banned) {
      const config = require('../config');
      return bot.sendMessage(telegramId, getMsg('banned', user.language).replace('{support}', config.support.username));
    }

    const refMatch = text.match(/\/start ref_(.+)/);
    if (refMatch) {
      const refCode = refMatch[1];
      await processReferral(telegramId, refCode, bot);
    }

    const welcome = getMsg('start', user.language, user.firstName);
    await bot.sendMessage(telegramId, welcome, {
      parse_mode: 'Markdown',
      reply_markup: homeKeyboard(),
    });

    logger.user(telegramId, 'Started the bot');
  } catch (err) {
    logger.error(`Start handler error: ${err.message}`);
    bot.sendMessage(telegramId, getMsg('error', 'en'));
  }
}

module.exports = startHandler;
