/**
 * Logger Utility
 * Centralized logging with timestamps
 */

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class Logger {
  static timestamp() {
    return new Date().toISOString();
  }

  static info(message, data = null) {
    console.log(`${colors.cyan}[INFO]${colors.reset} ${this.timestamp()} - ${message}`);
    if (data) console.log(data);
  }

  static error(message, error = null) {
    console.error(`${colors.red}[ERROR]${colors.reset} ${this.timestamp()} - ${message}`);
    if (error) console.error(error);
  }

  static warn(message, data = null) {
    console.warn(`${colors.yellow}[WARN]${colors.reset} ${this.timestamp()} - ${message}`);
    if (data) console.warn(data);
  }

  static success(message, data = null) {
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${this.timestamp()} - ${message}`);
    if (data) console.log(data);
  }

  static debug(message, data = null) {
    if (process.env.DEBUG === 'true') {
      console.log(`${colors.blue}[DEBUG]${colors.reset} ${this.timestamp()} - ${message}`);
      if (data) console.log(data);
    }
  }
}

module.exports = Logger;
