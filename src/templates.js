const fs = require('fs');
const path = require('path');
const https = require('https');
const config = require('./config');
const logger = require('./logger');

const HADITH_API_URL = 'https://api.hadith.gading.dev/books/bukhari?range=1-300';
const stateFilePath = path.join(__dirname, '../data/state.json');
const backupHadithsPath = path.join(__dirname, '../data/hadiths.json');

/**
 * Helper function untuk fetch data dari Web API secara online (Asynchronous)
 */
function fetchHadithsFromWeb() {
  return new Promise((resolve, reject) => {
    https.get(HADITH_API_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          if (parsedData && parsedData.data && parsedData.data.hadiths) {
            const mappedHadiths = parsedData.data.hadiths.map(h => ({
              id: `web-${h.number}`,
              text: h.id,
              source: `HR. Bukhari, No. ${h.number}`
            }));
            resolve(mappedHadiths);
          } else {
            reject(new Error("Struktur data API tidak sesuai"));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Gets a random hadith from the web pool, ensuring no consecutive repeats.
 * Menerapkan sistem fallback ke data lokal jika API web gagal diakses.
 */
async function getRandomHadith() {
  let poolHadiths = [];

  try {
    if (fs.existsSync(backupHadithsPath)) {
      poolHadiths = JSON.parse(fs.readFileSync(backupHadithsPath, 'utf8'));
    }
  } catch (err) {
    logger.error(`Gagal membaca database hadits lokal: ${err.message}`);
  }

  if (!poolHadiths || poolHadiths.length === 0) {
    try {
      poolHadiths = await fetchHadithsFromWeb();
      poolHadiths = poolHadiths.filter(h =>
        h.text.toLowerCase().includes('shalat') ||
        h.text.toLowerCase().includes('sholat') ||
        h.text.toLowerCase().includes('wudhu') ||
        h.text.toLowerCase().includes('masjid') ||
        h.text.toLowerCase().includes('imam')
      );
    } catch (e) {
      logger.warn(`Gagal mengambil hadits dari Web API (${e.message}).`);
    }
  }

  if (!poolHadiths || poolHadiths.length === 0) return null;

  let lastHadithId = null;
  try {
    if (fs.existsSync(stateFilePath)) {
      const state = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
      lastHadithId = state.lastHadithId;
    }
  } catch (e) {
    logger.warn(`Could not read state file: ${e.message}`);
  }

  const eligibleHadiths = poolHadiths.filter(h => String(h.id) !== String(lastHadithId));
  const finalPool = eligibleHadiths.length > 0 ? eligibleHadiths : poolHadiths;
  const selected = finalPool[Math.floor(Math.random() * finalPool.length)];

  try {
    fs.writeFileSync(stateFilePath, JSON.stringify({ lastHadithId: selected.id }), 'utf8');
  } catch (e) {
    logger.warn(`Could not write state file: ${e.message}`);
  }

  return selected;
}

/**
 * Formats a Date object to local time string (HH:mm WIB/WITA/WIT)
 */
function formatLocalTime(date) {
  const timezoneMap = {
    'Asia/Jakarta': 'WIB',
    'Asia/Makassar': 'WITA',
    'Asia/Jayapura': 'WIT'
  };

  const tzSuffix = timezoneMap[config.timezone] || '';
  const timeStr = date.toLocaleTimeString('id-ID', {
    timeZone: config.timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(/\./g, ':');

  return `${timeStr} ${tzSuffix}`.trim();
}

/**
 * Formats a Date object to Hijri date string (e.g. 1 Dzulhijjah 1447 H)
 */
function formatHijriDate(date) {
  try {
    const options = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', options);
    let formatted = formatter.format(date);

    if (!formatted.toLowerCase().includes('h')) {
      formatted += ' H';
    }
    return formatted;
  } catch (e) {
    logger.warn(`Hijri date calculation error, using fallback empty: ${e.message}`);
    return '';
  }
}

/**
 * Gets a Gregorian date string in Indonesian (e.g. Senin, 1 Juni 2026)
 */
function formatGregorianDate(date) {
  try {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return '';
  }
}

const prayerVariants = {
  Subuh: [
    {
      greeting: "🌙 *Assalamu'alaikum Warahmatullahi Wabarakatuh*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Alhamdulillah, sudah masuk waktu *Sholat Subuh* 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})",
      footer: "Yuk segerakan sholat Subuh berjamaah di masjid terdekat, jangan tunda! 🤲"
    },
    {
      greeting: "✨ *Assalamu'alaikum Warahmatullahi Wabarakatuh*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Fajar telah tiba, mari menyambut berkah pagi dengan mendirikan *Sholat Subuh* 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}",
      footer: "Sholat subuh berjamaah adalah sumber cahaya di hari kiamat. Mari bersiap! 🤲"
    },
    {
      greeting: "🌅 *Assalamu'alaikum wr. wb.*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Mari mulai hari ini dengan ketaatan. Waktu *Sholat Subuh* telah tiba untuk wilayah kita 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}",
      footer: "Awali langkah harimu dengan bersujud menghadap Allah SWT. Mari sholat! 🤲"
    }
  ],
  Dzuhur: [
    {
      greeting: "☀️ *Assalamu'alaikum Warahmatullahi Wabarakatuh*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Waktu *Sholat Dzuhur* telah tiba 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})",
      footer: "Tinggalkan sejenak aktivitasmu, saatnya menghadap Allah SWT. Rehatkan jiwa dengan sholat! 🤲"
    },
    {
      greeting: "✨ *Assalamu'alaikum Warahmatullahi Wabarakatuh*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Panggilan suci *Sholat Dzuhur* telah berkumandang di tengah kesibukan kita 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}",
      footer: "Mari sejenak basuh muka dengan air wudhu, segarkan pikiran, dan tunaikan kewajiban kita 🤲"
    },
    {
      greeting: "🌤️ *Assalamu'alaikum wr. wb.*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Sudah masuk waktu *Sholat Dzuhur* 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}",
      footer: "Kesuksesan sejati dimulai dari ketaatan sholat tepat waktu. Yuk, mari sholat Dzuhur dulu! 🤲"
    }
  ],
  Ashar: [
    {
      greeting: "🌤️ *Assalamu'alaikum Warahmatullahi Wabarakatuh*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Waktu *Sholat Ashar* telah tiba 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})",
      footer: "Jangan sampai terlewat, yuk sholat Ashar dulu! Jaga sholat wustha kita 🤲"
    },
    {
      greeting: "✨ *Assalamu'alaikum Warahmatullahi Wabarakatuh*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Mentari mulai condong, mari bersiap menunaikan ibadah *Sholat Ashar* tepat waktu 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}",
      footer: "Segera selesaikan tugas sejenak dan penuhi panggilan-Nya. Selamat menunaikan sholat Ashar 🤲"
    },
    {
      greeting: "🌾 *Assalamu'alaikum wr. wb.*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Alhamdulillah, panggilan *Sholat Ashar* kembali memanggil kita 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}",
      footer: "Tinggalkan pekerjaan sejenak demi keberkahan usaha kita. Mari sholat tepat waktu! 🤲"
    }
  ],
  Maghrib: [
    {
      greeting: "🌅 *Assalamu'alaikum Warahmatullahi Wabarakatuh*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Alhamdulillah, sudah masuk waktu *Sholat Maghrib* 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})",
      footer: "Syukuri penghujung hari, segera sholat Maghrib! Jangan tunda karena waktunya singkat 🤲"
    },
    {
      greeting: "✨ *Assalamu'alaikum Warahmatullahi Wabarakatuh*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Mentari telah tenggelam, saatnya bersyukur mendirikan *Sholat Maghrib* berjamaah 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}",
      footer: "Mari tutup aktivitas siang kita dengan menghadap Sang Pencipta. Segera bersuci dan sholat 🤲"
    },
    {
      greeting: "🌆 *Assalamu'alaikum wr. wb.*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Waktu *Sholat Maghrib* yang penuh berkah telah tiba 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}",
      footer: "Mari sambut malam dengan sujud yang khusyuk. Selamat melaksanakan sholat Maghrib 🤲"
    }
  ],
  Isya: [
    {
      greeting: "🌙 *Assalamu'alaikum Warahmatullahi Wabarakatuh*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Waktu *Sholat Isya* telah tiba 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}} ({{gregorian}})",
      footer: "Tutup harimu dengan sholat Isya berjamaah, semoga malam kita berkah dan penuh ketenangan! 🤲"
    },
    {
      greeting: "✨ *Assalamu'alaikum Warahmatullahi Wabarakatuh*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Panggilan terakhir hari ini, waktu *Sholat Isya* telah berkumandang 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}",
      footer: "Sempurnakan ibadah harian kita dengan sholat Isya tepat waktu sebelum beristirahat 🤲"
    },
    {
      greeting: "🌌 *Assalamu'alaikum wr. wb.*\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*",
      body: "Waktu *Sholat Isya* yang damai telah masuk 🕌\n🕐 Pukul *{{time}}*\n📅 {{hijri}}",
      footer: "Mari menghadap Allah SWT di penghujung hari. Selamat menunaikan ibadah sholat Isya 🤲"
    }
  ]
};

const preReminderVariants = [
  "⏰ *Pengingat Sholat — Keluarga Besar UNIDA Gontor*\n\n*{{minutes}} menit* lagi masuk waktu *{{prayerName}}* 🕌\nSegera bersiap-siap dan ambil wudhu! 💧",
  "⏰ *Pre-Reminder Sholat — UNIDA Gontor*\n\nPersiapan diri, *{{minutes}} menit* lagi adzan *{{prayerName}}* akan berkumandang 🕌\nMari bersuci dan segerakan bersiap! 💧",
  "⏰ *Pengingat Sholat — Keluarga Besar UNIDA Gontor*\n\nWaktu *{{prayerName}}* segera tiba dalam *{{minutes}} menit* 🕌\nTinggalkan pekerjaan sejenak dan bersiaplah mengambil wudhu! 💧"
];

/**
 * Renders a full dynamic reminder message for a specific prayer
 * Ditambahkan kata kunci `async` karena memanggil fungsi fetch API.
 */
async function renderMainReminder(prayerName, prayerTimeDate) {
  const variants = prayerVariants[prayerName];
  if (!variants || variants.length === 0) return '';

  const now = new Date();
  const dayIndex = now.getDate();
  const isFriday = now.getDay() === 5;

  const variant = variants[dayIndex % variants.length];

  const timeStr = formatLocalTime(prayerTimeDate);
  const hijriStr = formatHijriDate(now);
  const gregStr = formatGregorianDate(now);

  let body = variant.body
    .replace('{{time}}', timeStr)
    .replace('{{hijri}}', hijriStr)
    .replace('{{gregorian}}', gregStr);

  let footer = variant.footer;

  if (prayerName === 'Dzuhur' && isFriday) {
    body = body.replace(/Sholat Dzuhur/g, 'Sholat Jumat');
    footer = "Bagi kaum pria, mari bersiap lebih awal, potong kuku, gunakan wewangian, dan segerakan ke masjid terdekat untuk Sholat Jumat! 🤲";
  }

  const isIdulFitri = hijriStr.includes('1 Syawal') || hijriStr.includes('Shawwal');
  const isIdulAdha = hijriStr.includes('10 Dzulhijjah') || hijriStr.includes('Dhu al-Hijjah');

  if (prayerName === 'Subuh' && (isIdulFitri || isIdulAdha)) {
    const namaIed = isIdulFitri ? 'Idul Fitri' : 'Idul Adha';
    footer += `\n\n🎉 *Selamat Hari Raya ${namaIed}!* Jangan lupa mandi sunnah Ied, makan secukupnya (untuk Fitri), dan mari bersiap menuju lapangan/masjid untuk menunaikan Sholat Ied jam 06:15 WIB. Taqabbalallahu minna wa minkum! 🤝`;
  }

  let message = `${variant.greeting}\n\n${body}\n\n`;

  if (config.enableHadith) {
    const hadith = await getRandomHadith();
    if (hadith) {
      message += `📖 *Hadith Hari Ini:*\n_"${hadith.text}"_\n*(${hadith.source})*\n\n`;
    }
  }

  message += footer;
  return message;
}

/**
 * Renders a pre-reminder message with dynamic minutes remaining
 */
function renderPreReminder(prayerName, minutes) {
  const now = new Date();
  const dayIndex = now.getDate();
  const isFriday = now.getDay() === 5;

  const template = preReminderVariants[dayIndex % preReminderVariants.length];

  let displayPrayerName = `Sholat ${prayerName}`;
  if (prayerName === 'Dzuhur' && isFriday) {
    displayPrayerName = 'Sholat Jumat';
  }

  return template
    .replace(/{{prayerName}}/g, displayPrayerName)
    .replace(/{{minutes}}/g, minutes);
}

/**
 * Renders a summary of all prayer times for a specific date
 */
function renderDailyScheduleSummary(times, date, type) {
  const hijriStr = formatHijriDate(date);
  const gregStr = formatGregorianDate(date);

  let header = "";
  if (type === 'malam') {
    header = "✨ *[JADWAL SHOLAT UNTUK BESOK HARI]* ✨\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*";
  } else {
    header = "🌅 *[JADWAL SHOLAT HARI INI]* 🌅\n*Keluarga Besar dan Civitas Akademika UNIDA Gontor*";
  }

  let message = `${header}\n\n`;
  message += `📅 Gregorian: ${gregStr}\n`;
  message += `🌙 Hijriah: ${hijriStr}\n\n`;
  message += "Berikut adalah estimasi waktu masuk sholat:\n";

  Object.keys(times).forEach(prayerName => {
    const timeStr = formatLocalTime(times[prayerName]);
    const cleanTime = timeStr.split(' ')[0];

    let name = prayerName;
    if (prayerName === 'Dzuhur' && date.getDay() === 5) {
      name = 'Jumat';
    }

    message += `▪️ *${name.padEnd(8, ' ')}* :  ${cleanTime}\n`;
  });

  message += "\n*“Maka dirikanlah shalat itu (dengan tertib). Sesungguhnya shalat itu adalah fardhu yang ditentukan waktunya atas orang-orang yang beriman.” (QS. An-Nisa: 103)*\n\n";
  message += "Mari persiapkan diri dan segerakan menuju masjid saat panggilan adzan berkumandang! 🤲";

  return message;
}

module.exports = {
  renderMainReminder,
  renderPreReminder,
  renderDailyScheduleSummary,
  formatLocalTime,
  formatHijriDate
};
