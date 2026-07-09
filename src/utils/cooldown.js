const cooldowns = new Map();

function checkCooldown(userId, key, duration) {
  const mapKey = `${userId}_${key}`;
  const now = Date.now();
  const last = cooldowns.get(mapKey);

  if (last && now - last < duration) {
    const remaining = Math.ceil((duration - (now - last)) / 1000);
    return remaining;
  }

  cooldowns.set(mapKey, now);
  return 0;
}

function getRemainingCooldown(userId, key, duration) {
  const mapKey = `${userId}_${key}`;
  const now = Date.now();
  const last = cooldowns.get(mapKey);
  if (last && now - last < duration) {
    return Math.ceil((duration - (now - last)) / 1000);
  }
  return 0;
}

module.exports = { checkCooldown, getRemainingCooldown };
