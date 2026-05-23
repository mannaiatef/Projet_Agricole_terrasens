const level = process.env.LOG_LEVEL || 'info';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = LOG_LEVELS[level] || LOG_LEVELS.info;

class Logger {
  static error(message, meta = {}) {
    if (LOG_LEVELS.error <= currentLevel) {
      console.error(`[${new Date().toISOString()}] ERROR: ${message}`, meta);
    }
  }

  static warn(message, meta = {}) {
    if (LOG_LEVELS.warn <= currentLevel) {
      console.warn(`[${new Date().toISOString()}] WARN: ${message}`, meta);
    }
  }

  static info(message, meta = {}) {
    if (LOG_LEVELS.info <= currentLevel) {
      console.log(`[${new Date().toISOString()}] INFO: ${message}`, meta);
    }
  }

  static debug(message, meta = {}) {
    if (LOG_LEVELS.debug <= currentLevel) {
      console.log(`[${new Date().toISOString()}] DEBUG: ${message}`, meta);
    }
  }
}

module.exports = Logger;
