const config = require('../../config');
const { addBalance } = require('../../helpers/userHelper');
const { db } = require('../../database/db');
const { checkCooldown } = require('../../utils/cooldown');
const logger = require('../logger');
const { v4: uuidv4 } = require('uuid');

async function completeTask(telegramId, taskName, reward, cooldownKey, cooldownMs) {
  const user = await db.users.findOne({ telegramId });
  if (!user) return { error: 'User not registered' };
  if (user.banned) return { error: 'Account is banned' };

  if (cooldownKey) {
    const remaining = checkCooldown(telegramId, cooldownKey, cooldownMs);
    if (remaining > 0) {
      return { error: `Please wait ${remaining}s before doing this task again.`, cooldown: remaining };
    }
  }

  await addBalance(telegramId, reward);
  await db.users.updateOne(
    { telegramId },
    { tasksCompleted: (user.tasksCompleted || 0) + 1 }
  );

  const earning = {
    id: uuidv4(),
    userId: telegramId,
    task: taskName,
    amount: reward,
    date: new Date().toISOString(),
  };
  await db.earnings.insertOne(earning);

  logger.user(telegramId, `Completed task "${taskName}" earned ${reward} EIKA`);
  return { success: true, reward };
}

async function watchAd(telegramId) {
  return completeTask(telegramId, 'Watch Ad', config.rewards.watchAd, 'watchAd', config.cooldowns.watchAd);
}

async function visitWebsite(telegramId) {
  return completeTask(telegramId, 'Visit Website', config.rewards.visitWebsite, 'visitWebsite', config.cooldowns.visitWebsite);
}

async function joinChannel(telegramId) {
  return completeTask(telegramId, 'Join Channel', config.rewards.joinChannel, 'joinChannel', 0);
}

async function dailyCheckin(telegramId) {
  return completeTask(telegramId, 'Daily Check-in', config.rewards.dailyBonus, 'dailyCheckin', 24 * 60 * 60 * 1000);
}

module.exports = { watchAd, visitWebsite, joinChannel, dailyCheckin };
