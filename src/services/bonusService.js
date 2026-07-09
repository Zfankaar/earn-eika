const { db } = require('../database/db');
const { addBalance } = require('../helpers/userHelper');
const config = require('../config');
const { checkCooldown } = require('../utils/cooldown');

async function claimDailyBonus(telegramId) {
  const user = await db.users.findOne({ telegramId });
  if (!user) return { error: 'User not registered' };
  if (user.banned) return { error: 'Account is banned' };

  const remaining = checkCooldown(telegramId, 'dailyBonus', config.cooldowns.dailyBonus);
  if (remaining > 0) {
    const hours = Math.floor(remaining / 3600);
    const mins = Math.floor((remaining % 3600) / 60);
    return { error: `Already claimed. Come back in ${hours}h ${mins}m.`, cooldown: remaining };
  }

  const reward = config.rewards.dailyBonus;
  await addBalance(telegramId, reward);
  await db.users.updateOne(
    { telegramId },
    {
      dailyBonusClaimed: true,
      lastDailyClaim: new Date().toISOString(),
      tasksCompleted: (user.tasksCompleted || 0) + 1,
    }
  );

  return { success: true, reward };
}

module.exports = { claimDailyBonus };
