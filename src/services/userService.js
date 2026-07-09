const { db } = require('../database/db');

async function getAllUsers() {
  return db.users.findAll();
}

async function getActiveToday() {
  const today = new Date().toISOString().slice(0, 10);
  const users = await db.users.findAll();
  return users.filter(u => u.lastActive && u.lastActive.slice(0, 10) === today);
}

async function getTotalEarnings() {
  const users = await db.users.findAll();
  return users.reduce((sum, u) => sum + (u.totalEarnings || 0), 0);
}

async function getTotalWithdrawals() {
  const withdraws = await db.withdrawals.findAll();
  return withdraws.length;
}

async function getPendingWithdrawals() {
  return db.withdrawals.findAll({ status: 'Pending' });
}

async function getUserCount() {
  return db.users.count();
}

module.exports = { getAllUsers, getActiveToday, getTotalEarnings, getTotalWithdrawals, getPendingWithdrawals, getUserCount };
