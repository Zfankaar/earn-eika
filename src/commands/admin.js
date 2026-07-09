const { isAdmin, getUser, addBalance, deductBalance } = require('../helpers/userHelper');
const { getAllUsers, getActiveToday, getTotalEarnings, getUserCount, getPendingWithdrawals } = require('../services/userService');
const { getWithdrawals } = require('../services/withdrawService');
const { adminKeyboard } = require('../keyboards');
const { getMsg } = require('../messages');
const { sanitize, isValidAmount } = require('../utils/validation');
const logger = require('../services/logger');
const { db } = require('../database/db');
const fs = require('fs/promises');
const path = require('path');

async function adminPanel(msg, bot) {
  const telegramId = msg.from.id;
  if (!(await isAdmin(telegramId))) {
    return bot.sendMessage(telegramId, getMsg('notAdmin', 'en'));
  }
  await bot.sendMessage(telegramId, getMsg('adminPanel', 'en'), {
    parse_mode: 'Markdown',
    reply_markup: adminKeyboard(),
  });
  logger.admin(telegramId, 'Opened admin panel');
}

async function adminStats(query, bot) {
  const telegramId = query.from.id;
  if (!(await isAdmin(telegramId))) return bot.answerCallbackQuery(query.id, { text: 'Not authorized', show_alert: true });

  const totalUsers = await getUserCount();
  const activeToday = (await getActiveToday()).length;
  const totalEarnings = await getTotalEarnings();
  const pendingWithdrawals = (await getPendingWithdrawals()).length;
  const allWithdrawals = await getWithdrawals();

  await bot.sendMessage(telegramId, getMsg('adminStats', 'en', { totalUsers, activeToday, totalEarnings, totalWithdrawals: allWithdrawals.length, pendingWithdrawals }), { parse_mode: 'Markdown' });
  await bot.answerCallbackQuery(query.id);
}

async function adminUsers(query, bot) {
  const telegramId = query.from.id;
  if (!(await isAdmin(telegramId))) return bot.answerCallbackQuery(query.id, { text: 'Not authorized', show_alert: true });

  const users = await getAllUsers();
  const msg = users.length > 50
    ? `👥 *Users* (${users.length})\n\nShowing first 50:\n${users.slice(0, 50).map(u => `• ${u.firstName} (@${u.username || 'N/A'}) - ${u.balance} EIKA`).join('\n')}`
    : getMsg('adminUsers', 'en', users);

  await bot.sendMessage(telegramId, msg, { parse_mode: 'Markdown' });
  await bot.answerCallbackQuery(query.id);
}

async function adminBroadcast(query, bot) {
  const telegramId = query.from.id;
  if (!(await isAdmin(telegramId))) return bot.answerCallbackQuery(query.id, { text: 'Not authorized', show_alert: true });

  await bot.sendMessage(telegramId, getMsg('adminBroadcast', 'en'), { parse_mode: 'Markdown' });
  await bot.answerCallbackQuery(query.id);
}

async function handleBroadcast(msg, bot) {
  const telegramId = msg.from.id;
  if (!(await isAdmin(telegramId))) return;
  if (!msg.text && !msg.photo && !msg.video && !msg.document) return;

  const users = await getAllUsers();
  let sent = 0;

  for (const user of users) {
    try {
      if (msg.text) {
        await bot.sendMessage(user.telegramId, msg.text, { parse_mode: 'Markdown' });
      } else if (msg.photo) {
        await bot.sendPhoto(user.telegramId, msg.photo[msg.photo.length - 1].file_id, { caption: msg.caption || '' });
      } else if (msg.video) {
        await bot.sendVideo(user.telegramId, msg.video.file_id, { caption: msg.caption || '' });
      } else if (msg.document) {
        await bot.sendDocument(user.telegramId, msg.document.file_id, { caption: msg.caption || '' });
      }
      sent++;
    } catch { }
  }

  await bot.sendMessage(telegramId, getMsg('adminBroadcastSent', 'en', sent), { parse_mode: 'Markdown' });
  logger.admin(telegramId, `Broadcast sent to ${sent} users`);
}

async function adminBan(msg, bot, args) {
  const telegramId = msg.from.id;
  if (!(await isAdmin(telegramId))) return bot.sendMessage(telegramId, getMsg('notAdmin', 'en'));
  if (!args || !args[0]) return bot.sendMessage(telegramId, 'Usage: /ban <userId>');

  const targetId = Number(sanitize(args[0]));
  const user = await getUser(targetId);
  if (!user) return bot.sendMessage(telegramId, 'User not found.');

  await db.users.updateOne({ telegramId: targetId }, { banned: true });
  await bot.sendMessage(telegramId, getMsg('adminBan', 'en', targetId), { parse_mode: 'Markdown' });
  logger.admin(telegramId, `Banned user ${targetId}`);
}

async function adminUnban(msg, bot, args) {
  const telegramId = msg.from.id;
  if (!(await isAdmin(telegramId))) return bot.sendMessage(telegramId, getMsg('notAdmin', 'en'));
  if (!args || !args[0]) return bot.sendMessage(telegramId, 'Usage: /unban <userId>');

  const targetId = Number(sanitize(args[0]));
  const user = await getUser(targetId);
  if (!user) return bot.sendMessage(telegramId, 'User not found.');

  await db.users.updateOne({ telegramId: targetId }, { banned: false });
  await bot.sendMessage(telegramId, getMsg('adminUnban', 'en', targetId), { parse_mode: 'Markdown' });
  logger.admin(telegramId, `Unbanned user ${targetId}`);
}

async function adminAddBalance(msg, bot, args) {
  const telegramId = msg.from.id;
  if (!(await isAdmin(telegramId))) return bot.sendMessage(telegramId, getMsg('notAdmin', 'en'));
  if (!args || args.length < 2) return bot.sendMessage(telegramId, 'Usage: /addbalance <userId> <amount>');

  const targetId = Number(sanitize(args[0]));
  const amount = Number(sanitize(args[1]));
  if (!isValidAmount(amount)) return bot.sendMessage(telegramId, getMsg('invalidAmount', 'en'));

  const user = await getUser(targetId);
  if (!user) return bot.sendMessage(telegramId, 'User not found.');

  await addBalance(targetId, amount);
  await bot.sendMessage(telegramId, getMsg('adminAddBalance', 'en', targetId, amount), { parse_mode: 'Markdown' });
  logger.admin(telegramId, `Added ${amount} EIKA to user ${targetId}`);
}

async function adminRemoveBalance(msg, bot, args) {
  const telegramId = msg.from.id;
  if (!(await isAdmin(telegramId))) return bot.sendMessage(telegramId, getMsg('notAdmin', 'en'));
  if (!args || args.length < 2) return bot.sendMessage(telegramId, 'Usage: /removebalance <userId> <amount>');

  const targetId = Number(sanitize(args[0]));
  const amount = Number(sanitize(args[1]));
  if (!isValidAmount(amount)) return bot.sendMessage(telegramId, getMsg('invalidAmount', 'en'));

  await deductBalance(targetId, amount);
  await bot.sendMessage(telegramId, getMsg('adminRemoveBalance', 'en', targetId, amount), { parse_mode: 'Markdown' });
  logger.admin(telegramId, `Removed ${amount} EIKA from user ${targetId}`);
}

async function adminWithdraws(query, bot) {
  const telegramId = query.from.id;
  if (!(await isAdmin(telegramId))) return bot.answerCallbackQuery(query.id, { text: 'Not authorized', show_alert: true });

  const pending = await getPendingWithdrawals();
  const msg = pending.length
    ? pending.map((w, i) => `${i + 1}. User \`${w.userId}\` - ${w.amount} EIKA via ${w.method} (${w.account}) - *Pending*`).join('\n')
    : 'No pending withdrawals.';

  await bot.sendMessage(telegramId, msg, { parse_mode: 'Markdown' });
  await bot.answerCallbackQuery(query.id);
}

async function adminExport(query, bot) {
  const telegramId = query.from.id;
  if (!(await isAdmin(telegramId))) return bot.answerCallbackQuery(query.id, { text: 'Not authorized', show_alert: true });

  const users = await getAllUsers();
  const exportPath = path.join(__dirname, '..', '..', 'data', 'users_export.json');
  await fs.writeFile(exportPath, JSON.stringify(users, null, 2), 'utf-8');
  await bot.sendDocument(telegramId, exportPath, {}, { filename: 'users_export.json', contentType: 'application/json' });
  await bot.answerCallbackQuery(query.id);
  logger.admin(telegramId, 'Exported user data');
}

async function adminStatsCmd(msg, bot) {
  adminStats({ from: msg.from, id: 'cmd', message: msg }, bot);
}
async function adminUsersCmd(msg, bot) {
  adminUsers({ from: msg.from, id: 'cmd', message: msg }, bot);
}
async function adminBroadcastCmd(msg, bot) {
  adminBroadcast({ from: msg.from, id: 'cmd', message: msg }, bot);
}
async function adminWithdrawsCmd(msg, bot) {
  adminWithdraws({ from: msg.from, id: 'cmd', message: msg }, bot);
}
async function adminExportCmd(msg, bot) {
  adminExport({ from: msg.from, id: 'cmd', message: msg }, bot);
}

module.exports = {
  adminPanel, adminStats, adminUsers, adminBroadcast, handleBroadcast,
  adminBan, adminUnban, adminAddBalance, adminRemoveBalance,
  adminWithdraws, adminExport,
  adminStatsCmd, adminUsersCmd, adminBroadcastCmd, adminWithdrawsCmd, adminExportCmd,
};
