const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');
const qrcode = require('qrcode-terminal');
const config = require('./config');
const logger = require('./logger');
const scheduler = require('./scheduler');
const templates = require('./templates');
const prayerEngine = require('./prayerEngine');

// Monkey-patch: Client.initialize uses waitUntil:'load' which often returns before
// WA's SPA is fully ready (Debug.VERSION undefined). The inject loop then polls for
// 30s, and if WA navigates during that time, the execution context is destroyed.
// We replace the launch+navigate logic to use networkidle0 and pre-wait for Debug.
const origClientInit = Client.prototype.initialize;
Client.prototype.initialize = async function() {
  const puppeteerOpts = this.options.puppeteer;
  const authTimeoutMs = this.options.authTimeoutMs || 30000;

  await this.authStrategy.beforeBrowserInitialized();

  const browserArgs = [...(puppeteerOpts.args || [])];
  if (this.options.userAgent !== false &&
      !browserArgs.find(a => a.includes('--user-agent'))) {
    browserArgs.push(`--user-agent=${this.options.userAgent}`);
  }
  browserArgs.push('--disable-blink-features=AutomationControlled');

  const browser = await puppeteer.launch({
    ...puppeteerOpts,
    args: browserArgs,
  });
  const page = (await browser.pages())[0];

  if (this.options.proxyAuthentication !== undefined) {
    await page.authenticate(this.options.proxyAuthentication);
  }
  if (this.options.userAgent !== false) {
    await page.setUserAgent(this.options.userAgent);
  }
  if (this.options.bypassCSP) await page.setBypassCSP(true);

  this.pupBrowser = browser;
  this.pupPage = page;

  await this.authStrategy.afterBrowserInitialized();
  await this.initWebVersionCache();
  if (this.options.evalOnNewDoc !== undefined) {
    await page.evaluateOnNewDocument(this.options.evalOnNewDoc);
  }

  // Navigate with networkidle0 (waits for network to fully settle)
  await page.goto('https://web.whatsapp.com/', {
    waitUntil: 'networkidle0',
    timeout: 0,
    referer: 'https://whatsapp.com/',
  });

  // Wait for Debug.VERSION to be available, surviving any navigation
  let debugFound = false;
  const deadline = Date.now() + authTimeoutMs;
  while (Date.now() < deadline) {
    try {
      const hasDebug = await page.evaluate('window.Debug?.VERSION != undefined');
      if (hasDebug) { debugFound = true; break; }
    } catch (_) {
      // Page navigated (e.g. QR login page redirect). Wait for new context.
      try { await page.waitForNavigation({ timeout: 10000 }); } catch (_) {}
    }
    await new Promise(r => setTimeout(r, 500));
  }
  if (!debugFound) {
    throw new Error('auth timeout');
  }

  // Continue with standard inject + framenavigated setup
  try {
    await this.inject();
  } catch (error) {
    if (error && error.message && (
      error.message.includes('Execution context was destroyed') ||
      error.message.includes('most likely because of a navigation')
    )) {
      logger.warn('Page navigated during inject, retrying after stabilization...');
      try { await page.waitForNavigation({ timeout: 15000 }); } catch (_) {}
      await new Promise(r => setTimeout(r, 1000));
      await this.inject();
    } else {
      throw error;
    }
  }
  this.pupPage.on('framenavigated', async (frame) => {
    if (frame.url().includes('post_logout=1') || this.lastLoggedOut) {
      this.emit('disconnected', 'LOGOUT');
      await this.authStrategy.logout();
      await this.authStrategy.beforeBrowserInitialized();
      await this.authStrategy.afterBrowserInitialized();
      this.lastLoggedOut = false;
    }
    await this.inject();
  });
};

/**
 * @type {import("whatsapp-web.js").Client | null}
 */
let client = null;

/**
 * Initializes and starts the WhatsApp Bot Client
 */
async function init() {
  logger.info('Initializing WhatsApp client...');
  
  const chromePath = puppeteer.executablePath();

  client = new Client({
    authStrategy: new LocalAuth({
      clientId: config.waSessionName
    }),
    puppeteer: {
      headless: 'shell',
      executablePath: chromePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote'
      ]
    },
    webVersionCache: { type: 'none' }
  });
  
  // 1. QR Code Event
  client.on('qr', (qr) => {
    logger.info('==================================================================');
    logger.info('⚠️ ACTION REQUIRED: SCAN THE QR CODE BELOW WITH WHATSAPP TO LOGIN ⚠️');
    logger.info('==================================================================');
    qrcode.generate(qr, { small: true });
  });
  
  // 2. Authentication Event
  let authCount = 0;
  client.on('authenticated', () => {
    authCount++;
    if (authCount === 1) {
      logger.info('WhatsApp Authentication successful! Session is being saved...');
    }
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
    let groups = [];
    try {
      const chats = await client.getChats();
      groups = chats.filter(chat => chat.isGroup);
    } catch (err) {
      logger.warn(`getChats() via WWebJS failed: ${err.message}`);
      // Fallback: try to enumerate chats via direct page evaluation
      try {
        const rawGroups = await client.pupPage.evaluate(() => {
          try {
            const Coll = window.require('WAWebCollections');
            if (!Coll || !Coll.Chat) return [];
            const models = Coll.Chat.getModelsArray();
            const result = [];
            for (const chat of models) {
              try {
                if (chat.groupMetadata) {
                  result.push({
                    name: chat.name || chat.formattedTitle || 'Unnamed',
                    id: { _serialized: chat.id._serialized }
                  });
                }
              } catch { /* skip problematic chats */ }
            }
            return result;
          } catch (e) {
            return { error: e.message || String(e) };
          }
        });
        if (Array.isArray(rawGroups)) {
          groups = rawGroups;
        } else {
          logger.warn(`Direct evaluation failed: ${rawGroups.error}`);
        }
      } catch (evalErr) {
        logger.warn(`Page evaluation failed: ${evalErr.message}`);
      }
    }

    if (groups.length > 0) {
      logger.info('----------------------------------------------------');
      logger.info(`Joined ${groups.length} WhatsApp Group(s):`);
      groups.forEach((group, index) => {
        logger.info(`[${index + 1}] Name: "${group.name}" | ID: ${group.id._serialized}`);
      });
      logger.info('----------------------------------------------------');
    } else {
      logger.warn('No WhatsApp groups found. Make sure the bot account has joined at least one group.');
    }

    if (config.targetGroupIds.length === 0) {
      logger.info('📋 FIRST-TIME SETUP (step 3/3):');
      logger.info('   1. ✅ Phone connected');
      logger.info('   2. ✅ Group IDs listed above');
      logger.info('   3. ✏️  Copy the target Group ID, paste it into TARGET_GROUP_IDS in your .env file,');
      logger.info('      then STOP this process (Ctrl+C) and run "npm start" again.');
      logger.info('      The bot will remember your session — no QR scan needed.');
      return;
    }

    logger.info(`🎯 Target groups configured: ${config.targetGroupIds.length} group(s). Starting scheduler...`);
    scheduler.start(client);
  });
  
  // 4. Disconnected Event
  client.on('disconnected', async (reason) => {
    logger.warn(`WhatsApp client was disconnected: ${reason}`);
    logger.info('Attempting to re-initialize WhatsApp client...');
    try {
      await client.initialize();
    } catch (error) {
      logger.error(`Failed to re-initialize WhatsApp client: ${error.message}`);
    }
  });
  
  // 5. Message Event (Admin Commands)
  client.on("message", async (message) => {
    const text = message.body.trim();
    if (!text.startsWith('!')) return;
    if (!config.enableAdminCommands) return;

    const sender = message.author || message.from;
    const senderPhone = sender.split('@')[0];

    if (!config.adminPhones.includes(senderPhone)) {
      logger.info(`Unauthorized command from ${senderPhone}: "${text}"`);
      return;
    }

    logger.info(`Admin command: "${text}" from ${senderPhone}`);
    
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
  
  // Initialize connection with error handling
  try {
    await client.initialize();
  } catch (error) {
    logger.error(`Failed to initialize WhatsApp connection: ${error.message}`);
    throw error;
  }
}

module.exports = {
  init
};
