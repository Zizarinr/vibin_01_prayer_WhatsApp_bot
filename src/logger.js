const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] [${level.toUpperCase()}]: ${message}`;
  })
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] [${level}]: ${message}`;
  })
);

const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    // Output console with colors
    new winston.transports.Console({
      format: consoleFormat
    }),
    
    // Rotating file for all logs
    new winston.transports.DailyRotateFile({
      dirname: path.join(__dirname, '../logs'),
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    
    // Rotating file for errors only
    new winston.transports.DailyRotateFile({
      dirname: path.join(__dirname, '../logs'),
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    })
  ]
});

module.exports = logger;
