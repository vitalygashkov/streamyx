'use strict';

const { Files } = require('./files');

const LOG_LEVEL = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
};

const CURRENT_DATETIME = new Date().toJSON().slice(0, 16).replace(/[-T:]/g, '');

class Logger {
  #files;
  #logFilename;
  logLevel = LOG_LEVEL.info;

  constructor() {
    this.#files = new Files();
    this.#files.goTo('files');
    this.#files.goTo('logs');
    this.#logFilename = `${CURRENT_DATETIME}_${process.pid}.log`;
  }

  setLogLevel(logLevel) {
    this.logLevel = logLevel;
  }

  info(message, ...data) {
    this.#emitMessage(LOG_LEVEL.info, message, data);
  }

  warn(message, ...data) {
    this.#emitMessage(LOG_LEVEL.warn, message, data);
  }

  error(message, ...data) {
    this.#emitMessage(LOG_LEVEL.error, message, data);
  }

  debug(message, ...data) {
    this.#emitMessage(LOG_LEVEL.debug, message, data);
  }

  #emitMessage(logLevel, message, data) {
    const output = `${this.getPrefix(logLevel)} ${message}`;

    if (this.#allowLogging(logLevel))
      data.length ? console[logLevel](output, data) : console[logLevel](output);

    const logRecord = `${this.#currentDateString.padEnd(23, ' ')} ${logLevel
      .toUpperCase()
      .padEnd(6, ' ')} ${message}\n`;
    this.#files.append(this.#logFilename, logRecord);
  }

  getPrefix(logLevel) {
    const logLevelColors = {
      [LOG_LEVEL.debug]: '\x1b[2m\x1b[37m',
      [LOG_LEVEL.info]: '\x1b[1m\x1b[37m',
      [LOG_LEVEL.warn]: '\x1b[33m',
      [LOG_LEVEL.error]: '\x1b[31m',
    };
    const formattedDate = '\x1b[35m' + this.#currentDateString.padEnd(23, ' ');
    const formattedLogLevel =
      logLevelColors[logLevel] + logLevel.toUpperCase().padEnd(6, ' ') + '\x1b[0m';
    return `${formattedDate} ${formattedLogLevel}`;
  }

  get #currentDateString() {
    return new Intl.DateTimeFormat('default', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).format(new Date());
  }

  #allowLogging(messageLogLevel) {
    switch (this.logLevel) {
      case LOG_LEVEL.error:
        return messageLogLevel === LOG_LEVEL.error;
      case LOG_LEVEL.warn:
        return messageLogLevel === LOG_LEVEL.error || messageLogLevel === LOG_LEVEL.warn;
      case LOG_LEVEL.info:
        return (
          messageLogLevel === LOG_LEVEL.error ||
          messageLogLevel === LOG_LEVEL.warn ||
          messageLogLevel === LOG_LEVEL.info
        );
      case LOG_LEVEL.debug:
        return (
          messageLogLevel === LOG_LEVEL.error ||
          messageLogLevel === LOG_LEVEL.warn ||
          messageLogLevel === LOG_LEVEL.info ||
          messageLogLevel === LOG_LEVEL.debug
        );
      default:
        return false;
    }
  }
}

const logger = new Logger();

module.exports = { Logger, LOG_LEVEL, logger };
