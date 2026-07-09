require('dotenv').config();

module.exports = {
  bot: {
    token: process.env.BOT_TOKEN,
    name: 'Earn Eika',
    username: process.env.BOT_USERNAME || 'Earn_eika_bot',
    currency: 'EIKA',
  },

  admins: [123456789],

  rewards: {
    dailyBonus: 100,
    referralReward: 50,
    watchAd: 10,
    visitWebsite: 15,
    joinChannel: 25,
  },

  withdraw: {
    minAmount: 500,
  },

  cooldowns: {
    dailyBonus: 24 * 60 * 60 * 1000,
    watchAd: 30 * 1000,
    visitWebsite: 60 * 1000,
  },

  support: {
    username: 'support',
  },

  channels: {
    required: [],
  },

  rateLimit: {
    windowMs: 60 * 1000,
    maxCommands: 20,
    maxCalls: 30,
  },

  proxy: process.env.PROXY || '',
};
