const { db } = require('../database/db');

async function findOrCreateUser(telegramId, from = {}) {
  let user = await db.users.findOne({ telegramId });

  if (!user) {
    const now = new Date().toISOString();
    user = {
      telegramId,
      username: from.username || null,
      firstName: from.first_name || 'Unknown',
      lastName: from.last_name || null,
      language: from.language_code || 'en',
      joinDate: now,
      lastActive: now,
      balance: 0,
      todayEarnings: 0,
      totalEarnings: 0,
      totalWithdraw: 0,
      referralCount: 0,
      referralEarnings: 0,
      tasksCompleted: 0,
      dailyBonusClaimed: false,
      lastDailyClaim: null,
      banned: false,
    };
    await db.users.insertOne(user);
  } else {
    user = await db.users.updateOne(
      { telegramId },
      { lastActive: new Date().toISOString(), username: from.username || user.username }
    );
  }

  return user;
}

async function getUser(telegramId) {
  return db.users.findOne({ telegramId });
}

async function isBanned(telegramId) {
  const user = await db.users.findOne({ telegramId });
  return user ? user.banned : false;
}

async function addBalance(telegramId, amount) {
  const user = await db.users.findOne({ telegramId });
  if (!user) return null;
  return db.users.updateOne(
    { telegramId },
    {
      balance: (user.balance || 0) + amount,
      totalEarnings: (user.totalEarnings || 0) + amount,
      todayEarnings: (user.todayEarnings || 0) + amount,
    }
  );
}

async function deductBalance(telegramId, amount) {
  const user = await db.users.findOne({ telegramId });
  if (!user || (user.balance || 0) < amount) return null;
  return db.users.updateOne(
    { telegramId },
    {
      balance: (user.balance || 0) - amount,
      totalWithdraw: (user.totalWithdraw || 0) + amount,
    }
  );
}

async function isAdmin(telegramId) {
  const config = require('../config');
  return config.admins.includes(Number(telegramId));
}

module.exports = { findOrCreateUser, getUser, isBanned, addBalance, deductBalance, isAdmin };
