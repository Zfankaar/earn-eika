const { db } = require('../database/db');
const { addBalance } = require('../helpers/userHelper');
const config = require('../config');
const { getMsg } = require('../messages');
const { v4: uuidv4 } = require('uuid');

function generateReferralCode() {
  return uuidv4().slice(0, 8);
}

async function getReferralLink(telegramId) {
  const user = await db.users.findOne({ telegramId });
  if (!user) return null;
  let code = user.referralCode;
  if (!code) {
    code = generateReferralCode();
    await db.users.updateOne({ telegramId }, { referralCode: code });
  }
  return `https://t.me/${config.bot.name.toLowerCase().replace(/\s/g, '')}bot?start=ref_${code}`;
}

async function processReferral(telegramId, refCode, bot) {
  const referrer = await db.users.findOne({ referralCode: refCode });
  if (!referrer) return false;
  if (referrer.telegramId === telegramId) return false;

  const existing = await db.referrals.findOne({ invitedId: telegramId });
  if (existing) return false;

  const reward = config.rewards.referralReward;
  const refEntry = {
    id: uuidv4(),
    referrerId: referrer.telegramId,
    invitedId: telegramId,
    reward,
    date: new Date().toISOString(),
  };
  await db.referrals.insertOne(refEntry);
  await addBalance(referrer.telegramId, reward);
  await db.users.updateOne(
    { telegramId: referrer.telegramId },
    {
      referralCount: (referrer.referralCount || 0) + 1,
      referralEarnings: (referrer.referralEarnings || 0) + reward,
    }
  );
  try {
    const msg = getMsg('referralNew', 'en', reward);
    await bot.sendMessage(referrer.telegramId, msg, { parse_mode: 'Markdown' });
  } catch {
    // silent
  }
  return true;
}

async function getReferralHistory(telegramId) {
  return db.referrals.findAll({ referrerId: telegramId });
}

module.exports = { getReferralLink, processReferral, getReferralHistory };
