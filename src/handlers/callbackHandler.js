const { getUser } = require('../helpers/userHelper');
const { homeKeyboard, earnKeyboard, historyKeyboard } = require('../keyboards');
const { getMsg } = require('../messages');
const { getReferralLink, getReferralHistory } = require('../services/referralService');
const { getEarningHistory } = require('../services/earningService');
const { getUserWithdrawals } = require('../services/withdrawService');
const { claimDailyBonus } = require('../services/bonusService');
const { watchAd, visitWebsite, joinChannel } = require('../services/earn');
const { limitCallback } = require('../utils/rateLimiter');
const config = require('../config');
const logger = require('../services/logger');

const {
  adminStats, adminUsers, adminBroadcast, adminWithdraws, adminExport,
} = require('../commands/admin');
const { approveWithdrawAction, rejectWithdrawAction } = require('../commands/withdraw');

async function callbackHandler(query, bot) {
  const telegramId = query.from.id;
  const data = query.data;

  if (limitCallback(telegramId)) {
    return bot.answerCallbackQuery(query.id, { text: 'Too fast! Slow down.', show_alert: true });
  }

  try {
    const user = await getUser(telegramId);
    if (!user) {
      return bot.answerCallbackQuery(query.id, { text: 'Please send /start first.', show_alert: true });
    }
    if (user.banned) {
      return bot.answerCallbackQuery(query.id, { text: 'Account banned.', show_alert: true });
    }

    switch (data) {
      case 'home': {
        await bot.editMessageText(getMsg('homeMenu', user.language), {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: homeKeyboard(),
        });
        break;
      }

      case 'balance': {
        const todayEarnings = user.todayEarnings || 0;
        const pendingWithdraws = (await getUserWithdrawals(telegramId)).filter(w => w.status === 'Pending');
        const pendingAmount = pendingWithdraws.reduce((s, w) => s + w.amount, 0);
        const bal = {
          balance: user.balance || 0,
          todayEarnings,
          totalEarnings: user.totalEarnings || 0,
          pendingWithdraw: pendingAmount,
          totalWithdraw: user.totalWithdraw || 0,
        };
        await bot.editMessageText(getMsg('balance', user.language, bal), {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'home' }]] },
        });
        break;
      }

      case 'earn': {
        await bot.editMessageText(getMsg('earnMenu', user.language), {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: earnKeyboard(),
        });
        break;
      }

      case 'earn_watch_ad': {
        const result = await watchAd(telegramId);
        if (result.error) {
          await bot.answerCallbackQuery(query.id, { text: result.error, show_alert: true });
        } else {
          await bot.answerCallbackQuery(query.id, { text: `Earned ${result.reward} EIKA!`, show_alert: true });
          await bot.editMessageText(getMsg('taskEarn', user.language, 'Watch Ad', result.reward), {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: 'Markdown',
            reply_markup: earnKeyboard(),
          });
        }
        break;
      }

      case 'earn_visit_site': {
        const result = await visitWebsite(telegramId);
        if (result.error) {
          await bot.answerCallbackQuery(query.id, { text: result.error, show_alert: true });
        } else {
          await bot.answerCallbackQuery(query.id, { text: `Earned ${result.reward} EIKA!`, show_alert: true });
          await bot.editMessageText(getMsg('taskEarn', user.language, 'Visit Website', result.reward), {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: 'Markdown',
            reply_markup: earnKeyboard(),
          });
        }
        break;
      }

      case 'earn_join_channel': {
        const result = await joinChannel(telegramId);
        if (result.error) {
          await bot.answerCallbackQuery(query.id, { text: result.error, show_alert: true });
        } else {
          await bot.answerCallbackQuery(query.id, { text: `Earned ${result.reward} EIKA!`, show_alert: true });
          await bot.editMessageText(getMsg('taskEarn', user.language, 'Join Channel', result.reward), {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: 'Markdown',
            reply_markup: earnKeyboard(),
          });
        }
        break;
      }

      case 'daily_bonus': {
        const result = await claimDailyBonus(telegramId);
        if (result.error) {
          await bot.answerCallbackQuery(query.id, { text: result.error, show_alert: true });
        } else {
          await bot.answerCallbackQuery(query.id, { text: `Daily bonus: ${result.reward} EIKA!`, show_alert: true });
          await bot.editMessageText(getMsg('dailyBonus', user.language, result.reward), {
            chat_id: query.message.chat.id,
            message_id: query.message.message_id,
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'home' }]] },
          });
        }
        break;
      }

      case 'referral': {
        const link = await getReferralLink(telegramId);
        const history = await getReferralHistory(telegramId);
        const refData = {
          link: link || 'Error generating link',
          count: history.length,
          earnings: user.referralEarnings || 0,
        };
        await bot.editMessageText(getMsg('referral', user.language, refData), {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'home' }]] },
        });
        break;
      }

      case 'withdraw': {
        await bot.editMessageText(getMsg('withdrawMenu', user.language, config.withdraw.minAmount), {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'home' }]] },
        });
        break;
      }

      case 'history': {
        await bot.editMessageText(getMsg('historyMenu', user.language), {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: historyKeyboard(),
        });
        break;
      }

      case 'history_earnings': {
        const earnings = await getEarningHistory(telegramId);
        const text = getMsg('earningHistory', user.language, earnings);
        await bot.editMessageText(text, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'history' }]] },
        });
        break;
      }

      case 'history_withdrawals': {
        const withdraws = await getUserWithdrawals(telegramId);
        const text = getMsg('withdrawHistory', user.language, withdraws);
        await bot.editMessageText(text, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'history' }]] },
        });
        break;
      }

      case 'history_referrals': {
        const refs = await getReferralHistory(telegramId);
        const text = refs.length
          ? refs.map((r, i) => `${i + 1}. User \`${r.invitedId}\` - Earned ${r.reward} EIKA`).join('\n')
          : 'No referrals yet. Share your referral link to earn!';
        await bot.editMessageText(text, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'history' }]] },
        });
        break;
      }

      case 'profile': {
        await bot.editMessageText(getMsg('profile', user.language, user), {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'home' }]] },
        });
        break;
      }

      case 'channels': {
        let msg = getMsg('channels', user.language);
        if (config.channels.required.length) {
          msg += '\n\n' + config.channels.required.map((c, i) => `${i + 1}. ${c}`).join('\n');
        } else {
          msg += '\n\nNo channels required yet.';
        }
        await bot.editMessageText(msg, {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'home' }]] },
        });
        break;
      }

      case 'support': {
        await bot.editMessageText(getMsg('support', user.language, config.support.username), {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📞 Contact Support', url: `https://t.me/${config.support.username}` }],
              [{ text: '🔙 Back', callback_data: 'home' }],
            ],
          },
        });
        break;
      }

      case 'about': {
        await bot.editMessageText(getMsg('about', user.language), {
          chat_id: query.message.chat.id,
          message_id: query.message.message_id,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'home' }]] },
        });
        break;
      }

      case 'admin_stats': await adminStats(query, bot); break;
      case 'admin_users': await adminUsers(query, bot); break;
      case 'admin_broadcast': await adminBroadcast(query, bot); break;
      case 'admin_withdraws': await adminWithdraws(query, bot); break;
      case 'admin_export': await adminExport(query, bot); break;

      default: {
        if (data.startsWith('withdraw_approve_')) {
          await approveWithdrawAction(query, bot);
        } else if (data.startsWith('withdraw_reject_')) {
          await rejectWithdrawAction(query, bot);
        } else {
          await bot.answerCallbackQuery(query.id, { text: 'Unknown action' });
        }
      }
    }
  } catch (err) {
    logger.error(`Callback handler error: ${err.message}`);
    try {
      await bot.answerCallbackQuery(query.id, { text: 'Error occurred', show_alert: true });
    } catch { }
  }
}

module.exports = callbackHandler;
