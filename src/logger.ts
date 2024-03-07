import { pid } from 'node:process';
import { inspect } from 'node:util';
import { EventEmitter } from 'node:events';
import fs from './fs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const CURRENT_DATETIME = new Date().toJSON().slice(0, 16).replace(/[-T:]/g, '');
const LOG_DIR = fs.join(fs.appDir, 'logs');
const LOG_PATH = fs.join(LOG_DIR, `${CURRENT_DATETIME}_${pid}.log`);
const LOGS_COUNT_THRESHOLD = 50;

class Logger extends EventEmitter {
  logLevel: LogLevel = 'info';

  constructor() {
    super();
    fs.createDir(LOG_DIR).then(() =>
      fs.readDir(LOG_DIR).then((files: string[]) => {
        const oldLogs = files.sort().slice(LOGS_COUNT_THRESHOLD);
        const deleteQueue = oldLogs.map((logName) => fs.delete(fs.join(LOG_DIR, logName)));
        Promise.all(deleteQueue);
      })
    );
  }

  setLogLevel(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }

  info(message: string, ...data: unknown[]) {
    this._emitMessage('info', message, data);
  }

  warn(message: string, ...data: unknown[]) {
    this._emitMessage('warn', message, data);
  }

  error(message: string, ...data: unknown[]) {
    this._emitMessage('error', message, data);
  }

  debug(message: string, ...data: unknown[]) {
    this._emitMessage('debug', message, data);
  }

  _emitMessage(logLevel: LogLevel, message: string, data: unknown[]) {
    const output = `${this.getPrefix(logLevel)} ${message}`;
    if (this._allowLogging(logLevel)) {
      data.length ? console[logLevel](output, data) : console[logLevel](output);
    }

    const logRecord = `${this._currentDateString} ${logLevel
      .toUpperCase()
      .padEnd(6, ' ')} ${message}\n`;
    fs.appendText(LOG_PATH, logRecord);
    this.emit('log', logRecord);
  }

  getPrefix(logLevel: LogLevel) {
    const logLevelsColors: Record<LogLevel, string> = {
      debug: 'greenBright',
      info: 'blueBright',
      warn: 'yellowBright',
      error: 'redBright',
    };
    const logLevelColor = inspect.colors[logLevelsColors[logLevel]] ?? [0, 0];
    const logLevelText = logLevel.toUpperCase().padEnd(6, ' ');
    const logLevelColored = `\x1b[1m\u001b[${logLevelColor[0]}m${logLevelText}\u001b[${logLevelColor[1]}m\x1b[0m`;
    const dateColor = inspect.colors['gray'] ?? [0, 0];
    const dateColored = `\u001b[${dateColor[0]}m${this._currentDateString}\u001b[${dateColor[1]}m`;
    return `${dateColored} ${logLevelColored}`;
  }

  get _currentDateString() {
    const isoDateWithTimezone = new Date().toLocaleString('sv', { timeZoneName: 'short' });
    const [date, time] = isoDateWithTimezone.split(' ');
    return `${date} ${time}`;
  }

  _allowLogging(messageLogLevel: string) {
    switch (this.logLevel) {
      case 'error':
        return messageLogLevel === 'error';
      case 'warn':
        return messageLogLevel === 'error' || messageLogLevel === 'warn';
      case 'info':
        return (
          messageLogLevel === 'error' || messageLogLevel === 'warn' || messageLogLevel === 'info'
        );
      case 'debug':
        return (
          messageLogLevel === 'error' ||
          messageLogLevel === 'warn' ||
          messageLogLevel === 'info' ||
          messageLogLevel === 'debug'
        );
      default:
        return false;
    }
  }

  listen(listener: (message: string) => void) {
    this.addListener('log', listener);
  }
}

const logger = new Logger();

export type { LogLevel };
export { Logger, logger, LOG_DIR, LOG_PATH };
