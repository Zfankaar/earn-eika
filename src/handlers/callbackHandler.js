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
const { adminStats, adminUsers, adminBroadcast, adminWithdraws, adminExport } = require('../commands/admin');
const { approveWithdrawAction, rejectWithdrawAction } = require('../commands/withdraw');

async function callbackHandler(ctx, bot) {
  const tid = ctx.from.id;
  const data = ctx.callbackQuery.data;

  if (limitCallback(tid)) return ctx.answerCbQuery('Too fast!', { show_alert: true });

  try {
    const user = await getUser(tid);
    if (!user) return ctx.answerCbQuery('Send /start first.', { show_alert: true });
    if (user.banned) return ctx.answerCbQuery('Account banned.', { show_alert: true });

    const edit = (text, extra) => ctx.editMessageText(text, { parse_mode: 'Markdown', chat_id: ctx.callbackQuery.message.chat.id, message_id: ctx.callbackQuery.message.message_id, ...extra });
    const backBtn = { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'home' }]] };

    switch (data) {
      case 'home':
        return edit(getMsg('homeMenu', user.language), { reply_markup: homeKeyboard() });

      case 'balance': {
        const p = (await getUserWithdrawals(tid)).filter(w => w.status === 'Pending');
        const bal = { balance: user.balance, todayEarnings: user.todayEarnings, totalEarnings: user.totalEarnings, pendingWithdraw: p.reduce((s, w) => s + w.amount, 0), totalWithdraw: user.totalWithdraw };
        return edit(getMsg('balance', user.language, bal), { reply_markup: backBtn });
      }

      case 'earn':
        return edit(getMsg('earnMenu', user.language), { reply_markup: earnKeyboard() });

      case 'earn_watch_ad': case 'earn_visit_site': case 'earn_join_channel': {
        const tasks = { earn_watch_ad: ['Watch Ad', watchAd], earn_visit_site: ['Visit Website', visitWebsite], earn_join_channel: ['Join Channel', joinChannel] };
        const [name, fn] = tasks[data];
        const r = await fn(tid);
        if (r.error) return ctx.answerCbQuery(r.error, { show_alert: true });
        await ctx.answerCbQuery(`Earned ${r.reward} EIKA!`, { show_alert: true });
        return edit(getMsg('taskEarn', user.language, name, r.reward), { reply_markup: earnKeyboard() });
      }

      case 'daily_bonus': {
        const r = await claimDailyBonus(tid);
        if (r.error) return ctx.answerCbQuery(r.error, { show_alert: true });
        await ctx.answerCbQuery(`Daily bonus: ${r.reward} EIKA!`, { show_alert: true });
        return edit(getMsg('dailyBonus', user.language, r.reward), { reply_markup: backBtn });
      }

      case 'referral': {
        const link = await getReferralLink(tid);
        const hist = await getReferralHistory(tid);
        return edit(getMsg('referral', user.language, { link: link || 'Error', count: hist.length, earnings: user.referralEarnings || 0 }), { reply_markup: backBtn });
      }

      case 'withdraw':
        return edit(getMsg('withdrawMenu', user.language, config.withdraw.minAmount), { reply_markup: backBtn });

      case 'history':
        return edit(getMsg('historyMenu', user.language), { reply_markup: historyKeyboard() });

      case 'history_earnings':
        return edit(getMsg('earningHistory', user.language, await getEarningHistory(tid)), { reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'history' }]] } });

      case 'history_withdrawals':
        return edit(getMsg('withdrawHistory', user.language, await getUserWithdrawals(tid)), { reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'history' }]] } });

      case 'history_referrals': {
        const refs = await getReferralHistory(tid);
        return edit(refs.length ? refs.map((r, i) => `${i + 1}. User \`${r.invitedId}\` - ${r.reward} EIKA`).join('\n') : 'No referrals yet.', { reply_markup: { inline_keyboard: [[{ text: '🔙 Back', callback_data: 'history' }]] } });
      }

      case 'profile':
        return edit(getMsg('profile', user.language, user), { reply_markup: backBtn });

      case 'channels':
        return edit(getMsg('channels', user.language) + (config.channels.required.length ? '\n\n' + config.channels.required.join('\n') : ''), { reply_markup: backBtn });

      case 'support':
        return edit(getMsg('support', user.language, config.support.username), { reply_markup: { inline_keyboard: [[{ text: '📞 Contact', url: `https://t.me/${config.support.username}` }], [{ text: '🔙 Back', callback_data: 'home' }]] } });

      case 'about':
        return edit(getMsg('about'), { reply_markup: backBtn });

      case 'admin_stats': return adminStats(ctx, bot);
      case 'admin_users': return adminUsers(ctx, bot);
      case 'admin_broadcast': return adminBroadcast(ctx, bot);
      case 'admin_withdraws': return adminWithdraws(ctx, bot);
      case 'admin_export': return adminExport(ctx, bot);

      default:
        if (data.startsWith('withdraw_approve_')) return approveWithdrawAction(ctx, bot);
        if (data.startsWith('withdraw_reject_')) return rejectWithdrawAction(ctx, bot);
        return ctx.answerCbQuery('Unknown action');
    }
  } catch (err) {
    logger.error(`Callback error: ${err.message}`);
    try { await ctx.answerCbQuery('Error', { show_alert: true }); } catch { }
  }
}

module.exports = callbackHandler;
