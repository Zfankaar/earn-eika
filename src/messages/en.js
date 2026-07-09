module.exports = {
  start: (name) => `Welcome ${name}!\n\nStart earning rewards by completing simple tasks. Use the menu below to get started.`,

  homeMenu: '🏠 *Home Menu*\n\nChoose an option below:',

  balance: (bal) => `💰 *Your Balance*\n\nCurrent Balance: \`${bal.balance}\` EIKA\nToday's Earnings: \`${bal.todayEarnings}\` EIKA\nLifetime Earnings: \`${bal.totalEarnings}\` EIKA\nPending Withdraw: \`${bal.pendingWithdraw}\` EIKA\nSuccessful Withdraw: \`${bal.totalWithdraw}\` EIKA`,

  earnMenu: '🎯 *Earn Coins*\n\nChoose a task below to earn:',

  dailyBonus: (amount) => `🎁 *Daily Bonus*\n\nYou claimed \`${amount}\` EIKA as your daily bonus!\nCome back tomorrow for another bonus.`,

  dailyBonusAlready: '🎁 *Daily Bonus*\n\nYou already claimed your daily bonus today.\nCome back in `{time}` hours.',

  referral: (data) => `👥 *Referral System*\n\nYour Referral Link:\n\`${data.link}\`\n\nInvited: \`${data.count}\` users\nEarnings: \`${data.earnings}\` EIKA`,

  referralNew: (amount) => `🎉 You earned \`${amount}\` EIKA from a referral!`,

  selfReferral: '❌ You cannot refer yourself.',

  duplicateReferral: '❌ This user has already been referred by someone.',

  withdrawMenu: (min) => `💸 *Withdraw*\n\nMinimum Withdraw: \`${min}\` EIKA\n\nSend your withdrawal details in this format:\n\n\`/withdraw <amount> <method> <account>\`\n\nExample: \`/withdraw 500 UPI user@upi\`\n\nAvailable methods: UPI, Paytm, Google Pay, Bank Transfer`,

  withdrawSuccess: (amount) => `✅ Withdrawal request of \`${amount}\` EIKA submitted successfully! It will be processed soon.`,

  withdrawError: (msg) => `❌ *Withdraw Error*\n\n${msg}`,

  historyMenu: '📜 *History*\n\nSelect a history type:',

  earningHistory: (list) => list.length ? list.map((e, i) => `${i + 1}. ${e.task} - ${e.amount} EIKA (${new Date(e.date).toLocaleDateString()})`).join('\n') : 'No earning history yet.',

  withdrawHistory: (list) => list.length ? list.map((w, i) => `${i + 1}. ${w.amount} EIKA - ${w.method} - ${w.status} (${new Date(w.date).toLocaleDateString()})`).join('\n') : 'No withdrawal history yet.',

  profile: (u) => `👤 *Profile*\n\nID: \`${u.id}\`\nUsername: @${u.username || 'N/A'}\nName: ${u.firstName} ${u.lastName || ''}\nLanguage: ${u.language}\nJoined: ${new Date(u.joinDate).toLocaleDateString()}\nLast Active: ${new Date(u.lastActive).toLocaleDateString()}\nBalance: \`${u.balance}\` EIKA\nTotal Earned: \`${u.totalEarnings}\` EIKA\nTotal Withdrawn: \`${u.totalWithdraw}\` EIKA\nReferrals: \`${u.referralCount}\`\nTasks Done: \`${u.tasksCompleted}\``,

  channels: '📢 *Required Channels*\n\nJoin the following channels to earn:',

  support: (username) => `📞 *Support*\n\nContact: @${username}\n\nFor any issues or queries, please reach out to our support team.`,

  about: `ℹ️ *About*\n\nEarn Eika Bot\n\nComplete simple tasks and earn EIKA coins. Withdraw your earnings easily.\n\nDeveloped with ❤️`,

  adminPanel: '🔧 *Admin Panel*\n\nWelcome to the admin control panel.',

  adminStats: (s) => `📊 *Bot Statistics*\n\nTotal Users: \`${s.totalUsers}\`\nActive Today: \`${s.activeToday}\`\nTotal Earnings: \`${s.totalEarnings}\` EIKA\nTotal Withdrawals: \`${s.totalWithdrawals}\`\nPending Withdrawals: \`${s.pendingWithdrawals}\``,

  adminUsers: (users) => `👥 *Users* (${users.length})\n\n${users.slice(0, 50).map(u => `• ${u.firstName} (@${u.username || 'N/A'}) - ${u.balance} EIKA`).join('\n')}`,

  adminBroadcast: '📢 *Broadcast*\n\nSend a message (text, photo, video, or document) and it will be forwarded to all users.',

  adminBroadcastSent: (n) => `✅ Broadcast sent to \`${n}\` users.`,

  adminBan: (userId) => `✅ User \`${userId}\` has been banned.`,

  adminUnban: (userId) => `✅ User \`${userId}\` has been unbanned.`,

  adminAddBalance: (userId, amount) => `✅ Added \`${amount}\` EIKA to user \`${userId}\`.`,  

  adminRemoveBalance: (userId, amount) => `✅ Removed \`${amount}\` EIKA from user \`${userId}\`.`,

  adminWithdraws: (list) => list.length ? list.map((w, i) => `${i + 1}. User \`${w.userId}\` - ${w.amount} EIKA via ${w.method} (${w.account}) - *${w.status}*`).join('\n') : 'No withdrawal requests.',

  adminExport: '📁 User data exported successfully to `data/users_export.json`.',

  taskEarn: (task, reward) => `✅ You completed \`${task}\` and earned \`${reward}\` EIKA!`,

  notRegistered: '❌ You are not registered. Please send /start first.',

  banned: '❌ Your account has been banned. Contact @{support} for assistance.',

  cooldown: '⏳ Please wait before using this command again.',

  invalidAmount: '❌ Invalid amount.',

  notAdmin: '❌ You are not authorized to use this command.',

  error: '❌ An error occurred. Please try again later.',
};
