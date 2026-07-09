const fs = require('fs/promises');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');

function timestamp() {
  return new Date().toISOString();
}

async function ensureLogDir() {
  try {
    await fs.access(LOG_DIR);
  } catch {
    await fs.mkdir(LOG_DIR, { recursive: true });
  }
}

async function writeLog(level, msg) {
  await ensureLogDir();
  const date = new Date().toISOString().slice(0, 10);
  const file = path.join(LOG_DIR, `${date}.log`);
  const line = `[${timestamp()}] [${level.toUpperCase()}] ${msg}\n`;
  try {
    await fs.appendFile(file, line, 'utf-8');
  } catch {
    // silently fail if logging itself fails
  }
}

const logger = {
  info(msg) {
    console.log(`[INFO] ${msg}`);
    writeLog('info', msg);
  },
  warn(msg) {
    console.warn(`[WARN] ${msg}`);
    writeLog('warn', msg);
  },
  error(msg) {
    console.error(`[ERROR] ${msg}`);
    writeLog('error', msg);
  },
  debug(msg) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${msg}`);
    }
    writeLog('debug', msg);
  },
  admin(userId, action) {
    const msg = `Admin [${userId}]: ${action}`;
    console.log(`[ADMIN] ${msg}`);
    writeLog('admin', msg);
  },
  user(userId, action) {
    const msg = `User [${userId}]: ${action}`;
    writeLog('user', msg);
  },
};

module.exports = logger;
