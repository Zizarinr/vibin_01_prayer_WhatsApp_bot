const cron = require('node-cron');
const config = require('./config');
const logger = require('./logger');
const prayerEngine = require('./prayerEngine');
const templates = require('./templates');

let activeTimers = [];
let midnightJob = null;
let whatsAppBot = null;

/**
 * Membersihkan semua timer pengingat sholat yang sedang berjalan
 */
function clearAllTimers() {
  logger.info(`Cleaning up ${activeTimers.length} active scheduled timers.`);
  activeTimers.forEach(timer => {
    if (timer.ref) clearTimeout(timer.ref);
  });
  activeTimers = [];
}

/**
 * Mengirim pesan broadcast ke seluruh grup yang ada di whitelist config
 * @param {string} message
 */
async function broadcastMessage(message) {
  if (!whatsAppBot) {
    logger.error('WhatsApp Bot Client is not initialized in Scheduler.');
    return;
  }

  if (!config.targetGroupIds || config.targetGroupIds.length === 0) {
    logger.warn('No target group IDs configured. Message broadcast skipped.');
    return;
  }

  const broadcastPromises = config.targetGroupIds.map(async (groupId) => {
    try {
      let formattedId = groupId.trim();
      if (!formattedId.endsWith('@g.us')) {
        formattedId = `${formattedId}@g.us`;
      }

      logger.info(`Broadcasting reminder to group: ${formattedId}`);
      await whatsAppBot.sendMessage(formattedId, message);
    } catch (error) {
      logger.error(`Failed to send message to group ${groupId}: ${error.message}`);
    }
  });

  await Promise.allSettled(broadcastPromises);
}

/**
 * Menjadwalkan seluruh alarm pengingat sholat untuk hari ini
 */
function scheduleToday() {
  clearAllTimers();

  const now = new Date();
  const isFriday = now.getDay() === 5;

  logger.info(`Initiating prayer schedule for: ${now.toDateString()}`);

  let times;
  try {
    times = prayerEngine.getPrayerTimesForDate(now);
  } catch (error) {
    logger.error(`Critical error retrieving prayer times from engine: ${error.message}`);
    return;
  }

  Object.keys(times).forEach(prayerName => {
    const prayerTime = times[prayerName];

    if (!prayerTime) {
      logger.error(`Prayer time for ${prayerName} is undefined or invalid.`);
      return;
    }

    const logPrayerName = (prayerName === 'Dzuhur' && isFriday) ? 'Jumat' : prayerName;
    logger.info(`Calculated [${logPrayerName}] time: ${templates.formatLocalTime(prayerTime)}`);

    const mainDelay = prayerTime.getTime() - now.getTime();
    if (mainDelay > 0) {
      const timerRef = setTimeout(async () => {
        try {
          logger.info(`Triggering main reminder event for ${logPrayerName}`);
          // Diperbaiki: Ditambahkan 'await' karena fungsi renderMainReminder sekarang bertipe async (fetch Web API)
          const message = await templates.renderMainReminder(prayerName, prayerTime);
          await broadcastMessage(message);
        } catch (err) {
          logger.error(`Error inside main reminder execution for ${prayerName}: ${err.message}`);
        }
      }, mainDelay);

      activeTimers.push({
        ref: timerRef,
        prayer: prayerName,
        type: 'main',
        time: prayerTime
      });
      logger.info(`-> Scheduled main reminder for [${logPrayerName}] in ${(mainDelay / 60000).toFixed(2)} minutes.`);
    } else {
      logger.info(`-> Main reminder for [${logPrayerName}] is in the past. Skipped.`);
    }

    const minutesArray = Array.isArray(config.preReminderMinutes) ? config.preReminderMinutes : [3];

    minutesArray.forEach(minutes => {
      const preReminderTime = new Date(prayerTime.getTime() - (minutes * 60000));
      const preDelay = preReminderTime.getTime() - now.getTime();

      if (preDelay > 0) {
        const timerRef = setTimeout(async () => {
          try {
            logger.info(`Triggering ${minutes} minutes pre-reminder event for ${logPrayerName}`);
            const message = templates.renderPreReminder(prayerName, minutes);
            await broadcastMessage(message);
          } catch (err) {
            logger.error(`Error inside ${minutes}m pre-reminder execution for ${prayerName}: ${err.message}`);
          }
        }, preDelay);

        activeTimers.push({
          ref: timerRef,
          prayer: prayerName,
          type: `pre-${minutes}`,
          time: preReminderTime
        });
        logger.info(`-> Scheduled ${minutes}m pre-reminder for [${logPrayerName}] in ${(preDelay / 60000).toFixed(2)} minutes.`);
      } else {
        logger.debug(`${minutes}m pre-reminder for [${logPrayerName}] is in the past. Skipped.`);
      }
    });
  });
}

/**
 * Menginisialisasi dan menyalakan sistem scheduler utama
 * @param {Object} botClient - Instance dari whatsapp-web.js
 */
function start(botClient) {
  if (!botClient) {
    logger.error('Cannot start scheduler: WhatsApp bot client instance is missing.');
    return;
  }

  whatsAppBot = botClient;
  logger.info('Polishing and starting Scheduler System...');

  scheduleToday();

  midnightJob = cron.schedule('0 0 * * *', () => {
    logger.info('Midnight cron triggered. Resetting timers and fetching new calculations.');
    scheduleToday();
  }, {
    scheduled: true,
    timezone: config.timezone || 'Asia/Jakarta'
  });

  logger.info('Midnight cron job core successfully established.');
}

function reschedule() {
  logger.info('Force rescheduling event invoked.');
  scheduleToday();
}

function getScheduleState() {
  return activeTimers
    .map(t => ({
      prayer: t.prayer,
      type: t.type,
      time: t.time
    }))
    .sort((a, b) => a.time - b.time);
}

module.exports = {
  start,
  reschedule,
  getScheduleState,
  clearAllTimers
};
