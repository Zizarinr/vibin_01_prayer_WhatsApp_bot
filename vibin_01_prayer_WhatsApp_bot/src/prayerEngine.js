const adhan = require('adhan');
const config = require('./config');
const logger = require('./logger');

/**
 * @param {Date} date
 * @returns {Object}
 */
function getPrayerTimesForDate(date) {
  try {
    const coordinates = new adhan.Coordinates(config.latitude, config.longitude);

    let params = adhan.CalculationMethod.Other();

    const method = config.prayerMethod.toLowerCase();

    if (method === 'kemenag') {
      params.fajrAngle = 20.0;
      params.ishaAngle = 18.0;
    } else if (method === 'muhammadiyah' || method === 'khgt') {
      params.fajrAngle = 18.0;
      params.ishaAngle = 18.0;
    } else {
      try {
        if (adhan.CalculationMethod[config.prayerMethod]) {
          params = adhan.CalculationMethod[config.prayerMethod]();
        } else {
          params.fajrAngle = 20.0;
          params.ishaAngle = 18.0;
        }
      } catch (e) {
        logger.warn(`Calculation method "${config.prayerMethod}" not found in adhan-js, using default Kemenag standard.`);
        params.fajrAngle = 20.0;
        params.ishaAngle = 18.0;
      }
    }

    params.madhab = adhan.Madhab.Shafi;

    const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);

    return {
      Subuh: prayerTimes.fajr,
      Dzuhur: prayerTimes.dhuhr,
      Ashar: prayerTimes.asr,
      Maghrib: prayerTimes.maghrib,
      Isya: prayerTimes.isha
    };
  } catch (error) {
    logger.error(`Error calculating prayer times: ${error.message}`);
    throw error;
  }
}

module.exports = {
  getPrayerTimesForDate
};
