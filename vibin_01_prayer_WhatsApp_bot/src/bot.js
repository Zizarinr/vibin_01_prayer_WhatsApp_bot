const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const logger = require('./logger');
const scheduler = require('./scheduler');
const templates = require('./templates');
const prayerEngine = require('./prayerEngine');

/**
 * @type {import("whatsapp-web.js").Client | null}
 */
let client = null;

/**
 * Initializes and starts the WhatsApp Bot Client
 */
function init() {
  logger.info('Initializing WhatsApp client...');
  
  client = new Client({
    authStrategy: new LocalAuth({
      clientId: config.waSessionName
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    },
  });
  
  // 1. QR Code Event
  client.on('qr', (qr) => {
    logger.info('==================================================================');
    logger.info('⚠️ ACTION REQUIRED: SCAN THE QR CODE BELOW WITH WHATSAPP TO LOGIN ⚠️');
    logger.info('==================================================================');
    qrcode.generate(qr, { small: true });
  });
  
  // 2. Authentication Event
  client.on('authenticated', () => {
    logger.info('WhatsApp Authentication successful! Session is being saved...');
  });
  
  client.on('auth_failure', (msg) => {
    logger.error(`WhatsApp Authentication failed: ${msg}`);
  });
  
  // 3. Ready Event
  client.on('ready', async () => {
    logger.info('==================================================================');
    logger.info('🚀 SHOLAT REMINDER BOT IS ONLINE & READY! 🚀');
    logger.info('==================================================================');
    
    // Log all joined groups to help the user identify Group IDs
    try {
      const chats = await client.getChats();
      const groups = chats.filter(chat => chat.isGroup);
      
      logger.info('----------------------------------------------------');
      logger.info(`Joined ${groups.length} WhatsApp Group(s):`);
      groups.forEach((group, index) => {
        logger.info(`[${index + 1}] Name: "${group.name}" | ID: ${group.id._serialized}`);
      });
      logger.info('👉 Copy the relevant ID and update TARGET_GROUP_IDS in .env');
      logger.info('----------------------------------------------------');
    } catch (err) {
      logger.error(`Failed to list joined groups: ${err.message}`);
    }
    
    // Start Scheduler
    scheduler.start(client);
  });
  
  // 4. Disconnected Event
  client.on('disconnected', (reason) => {
    logger.warn(`WhatsApp client was disconnected: ${reason}`);
    logger.info('Attempting to re-initialize WhatsApp client...');
    client.initialize();
  });
  
  // 5. Message Event (Admin Commands)
  client.on("message", async (message) => {
    if (!config.enableAdminCommands) return;

    logger.info("Message received")
    
    const text = message.body.trim();
    if (!text.startsWith('!')) return; // Commands start with !
    
    // Determine sender phone number (author in groups, from in direct chats)
    const sender = message.author || message.from;

    logger.info(`Sender : ${sender}`)

    const senderPhone = sender.split('@')[0];
    
    // Validate if sender is an admin
    const isAdmin = config.adminPhones.includes(senderPhone);
    if (!isAdmin) {
      logger.info("Sender is not an Admin")
      logger.info(`Sender is ${senderPhone}`)
      // Ignore command from non-admins silently (security measure)
      return;
    }
    
    logger.info(`Received admin command: "${text}" from ${senderPhone}`);
    
    try {
      if (text === '!ping') {
        await message.reply('🏓 *Pong!*\nSholat Reminder Bot is active and running.');
      } 
      
      else if (text === '!jadwal') {
        const now = new Date();
        const times = prayerEngine.getPrayerTimesForDate(now);
        
        let response = `🕌 *Jadwal Sholat Hari Ini*\n📍 *Kota*: ${config.city}, ${config.country}\n📅 *Hijri*: ${templates.formatHijriDate(now)}\n\n`;
        Object.keys(times).forEach(name => {
          response += `▪️ *${name}*: ${templates.formatLocalTime(times[name])}\n`;
        });
        
        await message.reply(response);
      } 
      
      else if (text === '!status') {
        const scheduleState = scheduler.getScheduleState();
        let response = `📊 *Status Sholat Reminder Bot*\n`;
        response += `▪️ *WA Connection*: Connected ✅\n`;
        response += `▪️ *Location*: ${config.city} (${config.latitude}, ${config.longitude})\n`;
        response += `▪️ *Configured Target Groups*: ${config.targetGroupIds.length} group(s)\n\n`;
        
        if (scheduleState.length === 0) {
          response += `⚠️ No future reminders scheduled for today (they may have already passed).`;
        } else {
          response += `📅 *Next Scheduled Reminders Today*:\n`;
          scheduleState.forEach(job => {
            const timeStr = templates.formatLocalTime(job.time);
            const typeStr = job.type === 'pre' ? '⚠️ Pre-Reminder' : '🕌 Adzan Reminder';
            response += `▪️ *${job.prayer}* (${typeStr}): ${timeStr}\n`;
          });
        }
        
        await message.reply(response);
      }
      
      else if (text.startsWith('!lokasi ')) {
        const parts = text.replace('!lokasi ', '').split(' ');
        if (parts.length < 3) {
          await message.reply('⚠️ Format salah. Contoh: `!lokasi Ponorogo -7.8652 111.4617`');
          return;
        }
        
        const newCity = parts[0];
        const newLat = parseFloat(parts[1]);
        const newLng = parseFloat(parts[2]);
        
        if (isNaN(newLat) || isNaN(newLng)) {
          await message.reply('⚠️ Latitude & Longitude harus berupa angka desimal.');
          return;
        }
        
        // Dynamically update config in-memory
        config.city = newCity;
        config.latitude = newLat;
        config.longitude = newLng;
        
        // Force reschedule
        scheduler.reschedule();
        
        await message.reply(`✅ *Lokasi Berhasil Diubah!*\n📍 *Kota*: ${newCity}\n🌐 *Koordinat*: ${newLat}, ${newLng}\n\nJadwal hari ini telah dihitung ulang.`);
      }
    } catch (err) {
      logger.error(`Error processing command "${text}": ${err.message}`);
      await message.reply(`❌ *Terjadi Error*: ${err.message}`);
    }
  });
  
  // Initialize connection
  client.initialize();
}

module.exports = {
  init
};
