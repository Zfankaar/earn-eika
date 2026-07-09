const config = require('../config');

function homeKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '💰 Balance', callback_data: 'balance' },
        { text: '🎯 Earn', callback_data: 'earn' },
      ],
      [
        { text: '🎁 Daily Bonus', callback_data: 'daily_bonus' },
        { text: '👥 Referral', callback_data: 'referral' },
      ],
      [
        { text: '💸 Withdraw', callback_data: 'withdraw' },
        { text: '📜 History', callback_data: 'history' },
      ],
      [
        { text: '👤 Profile', callback_data: 'profile' },
        { text: '📢 Channels', callback_data: 'channels' },
      ],
      [
        { text: '📞 Support', callback_data: 'support' },
        { text: 'ℹ About', callback_data: 'about' },
      ],
    ],
  };
}

function earnKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📺 Watch Ad', callback_data: 'earn_watch_ad' },
        { text: '🌐 Visit Website', callback_data: 'earn_visit_site' },
      ],
      [
        { text: '📢 Join Channel', callback_data: 'earn_join_channel' },
        { text: '✅ Daily Check-in', callback_data: 'daily_bonus' },
      ],
      [
        { text: '🔙 Back', callback_data: 'home' },
      ],
    ],
  };
}

function historyKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '💰 Earnings', callback_data: 'history_earnings' },
        { text: '💸 Withdrawals', callback_data: 'history_withdrawals' },
      ],
      [
        { text: '👥 Referrals', callback_data: 'history_referrals' },
      ],
      [
        { text: '🔙 Back', callback_data: 'home' },
      ],
    ],
  };
}

function adminKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📊 Stats', callback_data: 'admin_stats' },
        { text: '👥 Users', callback_data: 'admin_users' },
      ],
      [
        { text: '💸 Withdrawals', callback_data: 'admin_withdraws' },
        { text: '📢 Broadcast', callback_data: 'admin_broadcast' },
      ],
      [
        { text: '📁 Export', callback_data: 'admin_export' },
      ],
    ],
  };
}

function withdrawActionKeyboard(id) {
  return {
    inline_keyboard: [
      [
        { text: '✅ Approve', callback_data: `withdraw_approve_${id}` },
        { text: '❌ Reject', callback_data: `withdraw_reject_${id}` },
      ],
    ],
  };
}

module.exports = { homeKeyboard, earnKeyboard, historyKeyboard, adminKeyboard, withdrawActionKeyboard };
