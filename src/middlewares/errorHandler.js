const logger = require('../services/logger');

function errorHandler(bot) {
  bot.on('polling_error', (err) => {
    logger.error(`Polling error: ${err.message}`);
  });

  process.on('uncaughtException', (err) => {
    logger.error(`Uncaught exception: ${err.message}`);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error(`Unhandled rejection: ${reason}`);
  });
}

module.exports = errorHandler;
