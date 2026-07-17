const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '../.env') });

function parseBoolean(val, defaultVal = false) {
  if (val === undefined || val === null) return defaultVal;
  return val.toLowerCase() === 'true';
}

function parseArray(val) {
  if (!val) return [];
  return val.split(',').map(item => item.trim()).filter(Boolean);
}

const config = {
  waSessionName: process.env.WA_SESSION_NAME || 'sholat-bot-session',
  
  // Array of whitelisted group IDs
  targetGroupIds: parseArray(process.env.TARGET_GROUP_IDS),
  
  // Location
  city: process.env.CITY || 'Ponorogo',
  country: process.env.COUNTRY || 'Indonesia',
  latitude: parseFloat(process.env.LATITUDE || '-7.8652'),
  longitude: parseFloat(process.env.LONGITUDE || '111.4617'),
  prayerMethod: process.env.PRAYER_METHOD || 'Kemenag',
  
  // Reminder times
  preReminderMinutes: parseInt(process.env.PRE_REMINDER_MINUTES || '3', 10),
  timezone: process.env.TIMEZONE || 'Asia/Jakarta',
  
  // Admins
  adminPhones: parseArray(process.env.ADMIN_PHONES),
  
  // Feature Toggles
  enableHijriDate: parseBoolean(process.env.ENABLE_HIJRI_DATE, true),
  enableHadith: parseBoolean(process.env.ENABLE_HADITH, true),
  enableAdminCommands: parseBoolean(process.env.ENABLE_ADMIN_COMMANDS, true),
  hadithTopic: process.env.HADITH_TOPIC || 'sholat_tepat_waktu'
};

console.log(config)

module.exports = config;
