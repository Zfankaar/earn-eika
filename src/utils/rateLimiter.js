const config = require('../config');

const commandCache = new Map();
const callbackCache = new Map();

function rateLimiter(cache, max, windowMs) {
  return (key) => {
    const now = Date.now();
    const entry = cache.get(key);

    if (!entry || now - entry.start > windowMs) {
      cache.set(key, { start: now, count: 1 });
      return false;
    }

    entry.count++;
    if (entry.count > max) {
      return true;
    }
    return false;
  };
}

const limitCommand = rateLimiter(commandCache, config.rateLimit.maxCommands, config.rateLimit.windowMs);
const limitCallback = rateLimiter(callbackCache, config.rateLimit.maxCalls, config.rateLimit.windowMs);

module.exports = { limitCommand, limitCallback };
