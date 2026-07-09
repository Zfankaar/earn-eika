const { db } = require('../database/db');

async function getEarningHistory(telegramId) {
  return db.earnings.findAll({ userId: telegramId });
}

async function getTodayEarnings(telegramId) {
  const today = new Date().toISOString().slice(0, 10);
  const earnings = await db.earnings.findAll({ userId: telegramId });
  return earnings.filter(e => e.date.slice(0, 10) === today).reduce((sum, e) => sum + e.amount, 0);
}

module.exports = { getEarningHistory, getTodayEarnings };
