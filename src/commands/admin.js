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

async function adminPanel(ctx, bot) {
  const tid = ctx.from.id;
  if (!(await isAdmin(tid))) return ctx.reply(getMsg('notAdmin', 'en'));
  await ctx.reply(getMsg('adminPanel', 'en'), { parse_mode: 'Markdown', reply_markup: adminKeyboard() });
  logger.admin(tid, 'Opened admin panel');
}

async function adminStats(ctx, bot) {
  const tid = ctx.from.id;
  if (!(await isAdmin(tid))) return ctx.answerCbQuery('Not authorized', { show_alert: true });
  const users = await getAllUsers();
  const totalUsers = users.length;
  const activeToday = users.filter(u => u.lastActive && u.lastActive.slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
  const totalEarnings = users.reduce((s, u) => s + (u.totalEarnings || 0), 0);
  const allWithdrawals = await getWithdrawals();
  const pendingWithdrawals = allWithdrawals.filter(w => w.status === 'Pending').length;
  await ctx.reply(getMsg('adminStats', 'en', { totalUsers, activeToday, totalEarnings, totalWithdrawals: allWithdrawals.length, pendingWithdrawals }), { parse_mode: 'Markdown' });
  await ctx.answerCbQuery();
}

async function adminUsers(ctx, bot) {
  const tid = ctx.from.id;
  if (!(await isAdmin(tid))) return ctx.answerCbQuery('Not authorized', { show_alert: true });
  const users = await getAllUsers();
  const msg = users.length > 50
    ? `👥 *Users* (${users.length})\n\nFirst 50:\n${users.slice(0, 50).map(u => `• ${u.firstName} (@${u.username || 'N/A'}) - ${u.balance} EIKA`).join('\n')}`
    : getMsg('adminUsers', 'en', users);
  await ctx.reply(msg, { parse_mode: 'Markdown' });
  await ctx.answerCbQuery();
}

async function adminBroadcast(ctx, bot) {
  const tid = ctx.from.id;
  if (!(await isAdmin(tid))) return ctx.answerCbQuery('Not authorized', { show_alert: true });
  await ctx.reply('📢 *Broadcast*\n\nSend any message (text/photo/video/doc) and it will be forwarded to all users.', { parse_mode: 'Markdown' });
  await ctx.answerCbQuery();
}

async function adminWithdraws(ctx, bot) {
  const tid = ctx.from.id;
  if (!(await isAdmin(tid))) return ctx.answerCbQuery('Not authorized', { show_alert: true });
  const pending = await getPendingWithdrawals();
  const msg = pending.length
    ? pending.map((w, i) => `${i + 1}. User \`${w.userId}\` - ${w.amount} EIKA via ${w.method} - *Pending*`).join('\n')
    : 'No pending withdrawals.';
  await ctx.reply(msg, { parse_mode: 'Markdown' });
  await ctx.answerCbQuery();
}

async function adminExport(ctx, bot) {
  const tid = ctx.from.id;
  if (!(await isAdmin(tid))) return ctx.answerCbQuery('Not authorized', { show_alert: true });
  const users = await getAllUsers();
  const exportPath = path.join(__dirname, '..', '..', 'data', 'users_export.json');
  await fs.writeFile(exportPath, JSON.stringify(users, null, 2), 'utf-8');
  await ctx.replyWithDocument({ source: exportPath });
  await ctx.answerCbQuery();
  logger.admin(tid, 'Exported user data');
}

async function adminBan(ctx, bot, args) {
  const tid = ctx.from.id;
  if (!(await isAdmin(tid))) return ctx.reply(getMsg('notAdmin', 'en'));
  if (!args || !args[0]) return ctx.reply('Usage: /ban <userId>');
  const targetId = Number(sanitize(args[0]));
  const user = await getUser(targetId);
  if (!user) return ctx.reply('User not found.');
  await db.users.updateOne({ telegramId: targetId }, { banned: true });
  await ctx.reply(getMsg('adminBan', 'en', targetId), { parse_mode: 'Markdown' });
  logger.admin(tid, `Banned user ${targetId}`);
}

async function adminUnban(ctx, bot, args) {
  const tid = ctx.from.id;
  if (!(await isAdmin(tid))) return ctx.reply(getMsg('notAdmin', 'en'));
  if (!args || !args[0]) return ctx.reply('Usage: /unban <userId>');
  const targetId = Number(sanitize(args[0]));
  const user = await getUser(targetId);
  if (!user) return ctx.reply('User not found.');
  await db.users.updateOne({ telegramId: targetId }, { banned: false });
  await ctx.reply(getMsg('adminUnban', 'en', targetId), { parse_mode: 'Markdown' });
  logger.admin(tid, `Unbanned user ${targetId}`);
}

async function adminAddBalance(ctx, bot, args) {
  const tid = ctx.from.id;
  if (!(await isAdmin(tid))) return ctx.reply(getMsg('notAdmin', 'en'));
  if (!args || args.length < 2) return ctx.reply('Usage: /addbalance <userId> <amount>');
  const targetId = Number(sanitize(args[0]));
  const amount = Number(sanitize(args[1]));
  if (!isValidAmount(amount)) return ctx.reply(getMsg('invalidAmount', 'en'));
  const user = await getUser(targetId);
  if (!user) return ctx.reply('User not found.');
  await addBalance(targetId, amount);
  await ctx.reply(getMsg('adminAddBalance', 'en', targetId, amount), { parse_mode: 'Markdown' });
  logger.admin(tid, `Added ${amount} EIKA to user ${targetId}`);
}

async function adminRemoveBalance(ctx, bot, args) {
  const tid = ctx.from.id;
  if (!(await isAdmin(tid))) return ctx.reply(getMsg('notAdmin', 'en'));
  if (!args || args.length < 2) return ctx.reply('Usage: /removebalance <userId> <amount>');
  const targetId = Number(sanitize(args[0]));
  const amount = Number(sanitize(args[1]));
  if (!isValidAmount(amount)) return ctx.reply(getMsg('invalidAmount', 'en'));
  await deductBalance(targetId, amount);
  await ctx.reply(getMsg('adminRemoveBalance', 'en', targetId, amount), { parse_mode: 'Markdown' });
  logger.admin(tid, `Removed ${amount} EIKA from user ${targetId}`);
}

module.exports = { adminPanel, adminStats, adminUsers, adminBroadcast, adminWithdraws, adminExport, adminBan, adminUnban, adminAddBalance, adminRemoveBalance };
