const { isAdmin, getUser } = require('../helpers/userHelper');
const { createWithdrawal, approveWithdrawal, rejectWithdrawal } = require('../services/withdrawService');
const { withdrawActionKeyboard } = require('../keyboards');
const { getMsg } = require('../messages');
const { isValidAmount, sanitize, isValidMethod, isValidAccount } = require('../utils/validation');
const { limitCommand } = require('../utils/rateLimiter');
const config = require('../config');
const logger = require('../services/logger');

async function withdrawCommand(ctx, bot, args) {
  const telegramId = ctx.from.id;
  if (limitCommand(telegramId)) return;

  try {
    const user = await getUser(telegramId);
    if (!user) return ctx.reply(getMsg('notRegistered', 'en'));
    if (user.banned) return ctx.reply(getMsg('banned', 'en').replace('{support}', config.support.username));

    if (!args || args.length < 3) {
      return ctx.reply(getMsg('withdrawMenu', 'en', config.withdraw.minAmount), { parse_mode: 'Markdown' });
    }

    const amount = sanitize(args[0]);
    const method = sanitize(args.slice(1, -1).join(' '));
    const account = sanitize(args[args.length - 1]);

    if (!isValidAmount(amount, config.withdraw.minAmount)) {
      return ctx.reply(getMsg('withdrawError', 'en', `Minimum withdraw is ${config.withdraw.minAmount} EIKA`), { parse_mode: 'Markdown' });
    }
    if (!isValidMethod(method)) {
      return ctx.reply(getMsg('withdrawError', 'en', 'Invalid payment method.'), { parse_mode: 'Markdown' });
    }
    if (!isValidAccount(account)) {
      return ctx.reply(getMsg('withdrawError', 'en', 'Invalid account details.'), { parse_mode: 'Markdown' });
    }

    const result = await createWithdrawal(telegramId, Number(amount), method, account);
    if (result.error) {
      return ctx.reply(getMsg('withdrawError', 'en', result.error), { parse_mode: 'Markdown' });
    }

    await ctx.reply(getMsg('withdrawSuccess', 'en', amount), { parse_mode: 'Markdown' });

    for (const adminId of config.admins) {
      try {
        await bot.telegram.sendMessage(adminId,
          `💸 New withdrawal:\nUser: \`${telegramId}\`\nAmount: ${amount} EIKA\nMethod: ${method}\nAccount: ${account}`,
          { parse_mode: 'Markdown', reply_markup: withdrawActionKeyboard(result.withdrawal.id) }
        );
      } catch { }
    }
  } catch (err) {
    logger.error(`Withdraw error: ${err.message}`);
    ctx.reply(getMsg('error', 'en'));
  }
}

async function approveWithdrawAction(ctx, bot) {
  const telegramId = ctx.from.id;
  if (!(await isAdmin(telegramId))) return ctx.answerCbQuery('Not authorized', { show_alert: true });
  const id = ctx.callbackQuery.data.replace('withdraw_approve_', '');
  const w = await approveWithdrawal(id);
  if (w) {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.reply(`✅ Withdrawal \`${id}\` approved.`, { parse_mode: 'Markdown' });
    try { await bot.telegram.sendMessage(w.userId, `✅ Your withdrawal of \`${w.amount}\` EIKA approved!`, { parse_mode: 'Markdown' }); } catch { }
  }
  await ctx.answerCbQuery();
}

async function rejectWithdrawAction(ctx, bot) {
  const telegramId = ctx.from.id;
  if (!(await isAdmin(telegramId))) return ctx.answerCbQuery('Not authorized', { show_alert: true });
  const id = ctx.callbackQuery.data.replace('withdraw_reject_', '');
  const w = await rejectWithdrawal(id);
  if (w) {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.reply(`❌ Withdrawal \`${id}\` rejected.`, { parse_mode: 'Markdown' });
    try { await bot.telegram.sendMessage(w.userId, `❌ Your withdrawal of \`${w.amount}\` EIKA rejected. Contact support.`, { parse_mode: 'Markdown' }); } catch { }
  }
  await ctx.answerCbQuery();
}

module.exports = { withdrawCommand, approveWithdrawAction, rejectWithdrawAction };
