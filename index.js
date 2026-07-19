const bot = require('./src/bot');
const logger = require('./src/logger');

logger.info('====================================================');
logger.info('   Starting WhatsApp Sholat Reminder Bot...         ');
logger.info('====================================================');

// Initialize and start the WhatsApp bot
(async () => {
  try {
    await bot.init();
  } catch (error) {
    logger.error(`Failed to start Sholat Reminder Bot: ${error.message}`);
    process.exit(1);
  }
})();
