'use strict';

const fs = require('./fs');
const { pid } = require('node:process');
const { inspect } = require('util');

const LOG_LEVEL = {
  silly: 'silly',
  trace: 'trace',
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'fatal',
};

const CURRENT_DATETIME = new Date().toJSON().slice(0, 16).replace(/[-T:]/g, '');
const LOG_PATH = fs.join(fs.appDir, 'files', 'logs', `${CURRENT_DATETIME}_${pid}.log`);

class Logger {
  logLevel = LOG_LEVEL.info;

  setLogLevel(logLevel) {
    this.logLevel = logLevel;
  }

  info(message, ...data) {
    this._emitMessage(LOG_LEVEL.info, message, data);
  }

  warn(message, ...data) {
    this._emitMessage(LOG_LEVEL.warn, message, data);
  }

  error(message, ...data) {
    this._emitMessage(LOG_LEVEL.error, message, data);
  }

  debug(message, ...data) {
    this._emitMessage(LOG_LEVEL.debug, message, data);
  }

  _emitMessage(logLevel, message, data) {
    const output = `${this.getPrefix(logLevel)} ${message}`;

    if (this._allowLogging(logLevel))
      data.length ? console[logLevel](output, data) : console[logLevel](output);

    const logRecord = `${this._currentDateString} ${logLevel
      .toUpperCase()
      .padEnd(6, ' ')} ${message}\n`;
    fs.appendText(LOG_PATH, logRecord);
  }

  getPrefix(logLevel) {
    const logLevelsColors = {
      [LOG_LEVEL.silly]: 'whiteBright',
      [LOG_LEVEL.trace]: 'white',
      [LOG_LEVEL.debug]: 'greenBright',
      [LOG_LEVEL.info]: 'blueBright',
      [LOG_LEVEL.warn]: 'yellowBright',
      [LOG_LEVEL.error]: 'redBright',
      [LOG_LEVEL.fatal]: 'magentaBright',
    };
    const logLevelColor = inspect.colors[logLevelsColors[logLevel]] ?? [0, 0];
    const logLevelText = logLevel.toUpperCase().padEnd(6, ' ');
    const logLevelColored = `\x1b[1m\u001b[${logLevelColor[0]}m${logLevelText}\u001b[${logLevelColor[1]}m\x1b[0m`;
    const dateColor = inspect.colors['gray'] ?? [0, 0];
    const dateColored = `\u001b[${dateColor[0]}m${this._currentDateString}\u001b[${dateColor[1]}m`;
    return `${dateColored} ${logLevelColored}`;
  }

  get _currentDateString() {
    return new Date().toISOString().replace(/[TZ]/g, ' ');
  }

  _allowLogging(messageLogLevel) {
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
