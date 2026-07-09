const { db } = require('../database/db');
const { deductBalance } = require('../helpers/userHelper');
const config = require('../config');
const { v4: uuidv4 } = require('uuid');

async function createWithdrawal(telegramId, amount, method, account) {
  const user = await db.users.findOne({ telegramId });
  if (!user) return { error: 'User not found' };
  if (user.banned) return { error: 'Account is banned' };
  if ((user.balance || 0) < amount) return { error: 'Insufficient balance' };
  if (amount < config.withdraw.minAmount) return { error: `Minimum withdraw is ${config.withdraw.minAmount} EIKA` };

  const validMethods = ['UPI', 'Paytm', 'Google Pay', 'Bank Transfer'];
  if (!validMethods.includes(method)) return { error: `Invalid method. Valid: ${validMethods.join(', ')}` };

  const withdrawal = {
    id: uuidv4(),
    userId: telegramId,
    amount,
    method,
    account,
    date: new Date().toISOString(),
    status: 'Pending',
  };

  await db.withdrawals.insertOne(withdrawal);
  await deductBalance(telegramId, amount);
  return { success: true, withdrawal };
}

async function getWithdrawals(filter = {}) {
  return db.withdrawals.findAll(filter);
}

async function getUserWithdrawals(telegramId) {
  return db.withdrawals.findAll({ userId: telegramId });
}

async function getPendingWithdrawals() {
  return db.withdrawals.findAll({ status: 'Pending' });
}

async function approveWithdrawal(withdrawId) {
  const w = await db.withdrawals.findOne({ id: withdrawId });
  if (!w) return null;
  return db.withdrawals.updateOne({ id: withdrawId }, { status: 'Approved' });
}

async function rejectWithdrawal(withdrawId) {
  const w = await db.withdrawals.findOne({ id: withdrawId });
  if (!w) return null;
  await db.withdrawals.updateOne({ id: withdrawId }, { status: 'Rejected' });
  return w;
}

module.exports = { createWithdrawal, getWithdrawals, getUserWithdrawals, getPendingWithdrawals, approveWithdrawal, rejectWithdrawal };
