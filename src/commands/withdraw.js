const { isAdmin, getUser } = require('../helpers/userHelper');
const { createWithdrawal, getPendingWithdrawals, approveWithdrawal, rejectWithdrawal } = require('../services/withdrawService');
const { withdrawActionKeyboard } = require('../keyboards');
const { getMsg } = require('../messages');
const { isValidAmount, sanitize, isValidMethod, isValidAccount } = require('../utils/validation');
const { limitCommand } = require('../utils/rateLimiter');
const config = require('../config');
const logger = require('../services/logger');

async function withdrawCommand(msg, bot, args) {
  const telegramId = msg.from.id;

  if (limitCommand(telegramId)) return;

  try {
    const user = await getUser(telegramId);
    if (!user) return bot.sendMessage(telegramId, getMsg('notRegistered', 'en'));
    if (user.banned) return bot.sendMessage(telegramId, getMsg('banned', 'en').replace('{support}', config.support.username));

    if (!args || args.length < 3) {
      return bot.sendMessage(telegramId, getMsg('withdrawMenu', 'en', config.withdraw.minAmount), { parse_mode: 'Markdown' });
    }

    const amount = sanitize(args[0]);
    const method = sanitize(args.slice(1, -1).join(' '));
    const account = sanitize(args[args.length - 1]);

    if (!isValidAmount(amount, config.withdraw.minAmount)) {
      return bot.sendMessage(telegramId, getMsg('withdrawError', 'en', `Minimum withdraw is ${config.withdraw.minAmount} EIKA`), { parse_mode: 'Markdown' });
    }

    if (!isValidMethod(method)) {
      return bot.sendMessage(telegramId, getMsg('withdrawError', 'en', 'Invalid payment method.'), { parse_mode: 'Markdown' });
    }

    if (!isValidAccount(account)) {
      return bot.sendMessage(telegramId, getMsg('withdrawError', 'en', 'Invalid account details.'), { parse_mode: 'Markdown' });
    }

    const result = await createWithdrawal(telegramId, Number(amount), method, account);
    if (result.error) {
      return bot.sendMessage(telegramId, getMsg('withdrawError', 'en', result.error), { parse_mode: 'Markdown' });
    }

    await bot.sendMessage(telegramId, getMsg('withdrawSuccess', 'en', amount), { parse_mode: 'Markdown' });

    for (const adminId of config.admins) {
      try {
        await bot.sendMessage(
          adminId,
          `💸 New withdrawal request:\nUser: \`${telegramId}\`\nAmount: ${amount} EIKA\nMethod: ${method}\nAccount: ${account}`,
          { parse_mode: 'Markdown', reply_markup: withdrawActionKeyboard(result.withdrawal.id) }
        );
      } catch { }
    }
  } catch (err) {
    logger.error(`Withdraw command error: ${err.message}`);
    bot.sendMessage(telegramId, getMsg('error', 'en'));
  }
}

async function approveWithdrawAction(callbackQuery, bot) {
  const telegramId = callbackQuery.from.id;
  if (!(await isAdmin(telegramId))) {
    return bot.answerCallbackQuery(callbackQuery.id, { text: 'Not authorized', show_alert: true });
  }

  const id = callbackQuery.data.replace('withdraw_approve_', '');
  const w = await approveWithdrawal(id);
  if (w) {
    await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
    });
    await bot.sendMessage(callbackQuery.message.chat.id, `✅ Withdrawal \`${id}\` approved.`, { parse_mode: 'Markdown' });
    try {
      await bot.sendMessage(w.userId, `✅ Your withdrawal of \`${w.amount}\` EIKA has been approved!`);
    } catch { }
  }
  await bot.answerCallbackQuery(callbackQuery.id);
}

async function rejectWithdrawAction(callbackQuery, bot) {
  const telegramId = callbackQuery.from.id;
  if (!(await isAdmin(telegramId))) {
    return bot.answerCallbackQuery(callbackQuery.id, { text: 'Not authorized', show_alert: true });
  }

  const id = callbackQuery.data.replace('withdraw_reject_', '');
  const w = await rejectWithdrawal(id);
  if (w) {
    await bot.editMessageReplyMarkup({ inline_keyboard: [] }, {
      chat_id: callbackQuery.message.chat.id,
      message_id: callbackQuery.message.message_id,
    });
    await bot.sendMessage(callbackQuery.message.chat.id, `❌ Withdrawal \`${id}\` rejected.`, { parse_mode: 'Markdown' });
    try {
      await bot.sendMessage(w.userId, `❌ Your withdrawal of \`${w.amount}\` EIKA has been rejected. Please contact support.`);
    } catch { }
  }
  await bot.answerCallbackQuery(callbackQuery.id);
}

module.exports = { withdrawCommand, approveWithdrawAction, rejectWithdrawAction };
