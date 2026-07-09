const { findOrCreateUser } = require('../helpers/userHelper');
const { processReferral } = require('../services/referralService');
const { homeKeyboard } = require('../keyboards');
const { getMsg } = require('../messages');
const { limitCommand } = require('../utils/rateLimiter');
const logger = require('../services/logger');

async function startHandler(ctx, bot) {
  const telegramId = ctx.from.id;
  const text = ctx.message.text || '';

  if (limitCommand(telegramId)) return;

  try {
    const user = await findOrCreateUser(telegramId, ctx.from);
    if (user.banned) {
      const config = require('../config');
      return ctx.reply(getMsg('banned', user.language).replace('{support}', config.support.username));
    }

    const refMatch = text.match(/\/start ref_(.+)/);
    if (refMatch) {
      const refCode = refMatch[1];
      await processReferral(telegramId, refCode, bot.telegram);
    }

    const welcome = getMsg('start', user.language, user.firstName);
    await ctx.reply(welcome, {
      parse_mode: 'Markdown',
      reply_markup: homeKeyboard(),
    });

    logger.user(telegramId, 'Started the bot');
  } catch (err) {
    logger.error(`Start handler error: ${err.message}`);
    ctx.reply(getMsg('error', 'en'));
  }
}

module.exports = startHandler;
