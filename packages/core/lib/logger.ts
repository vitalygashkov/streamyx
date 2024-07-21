import { pid } from 'node:process';
import { inspect } from 'node:util';
import fsp from 'node:fs/promises';
import { Stats, mkdirSync, existsSync } from 'node:fs';
import koffi from 'koffi';
import pino from 'pino';
import pretty from 'pino-pretty';
import fs from './fs';

const MAX_LOGS_COUNT = 50;

const CURRENT_DATETIME = new Date()
  .toISOString()
  .replace('T', '_')
  .replace('Z', '')
  .replaceAll(':', '-')
  .split('.')[0];
const LOG_DIR = fs.logsDir;
const LOG_PATH = fs.join(LOG_DIR, `streamyx_${CURRENT_DATETIME}_${pid}.log`);

if (!existsSync(LOG_DIR)) mkdirSync(LOG_DIR, { recursive: true });

const clearLogs = async () => {
  const files = await fs.readDir(LOG_DIR);
  const toPath = (name: string) => fs.join(LOG_DIR, name);
  const statsQueue = files.map((name: string) =>
    fsp
      .stat(toPath(name))
      .catch(() => null)
      .then((stats) => ({ stats, path: toPath(name) }))
  );
  const results = await Promise.all(statsQueue);
  const stats = results.filter(Boolean) as { stats: Stats; path: string }[];
  stats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
  const oldLogs = stats.slice(MAX_LOGS_COUNT);
  const deleteQueue = oldLogs.map((log) => fs.delete(log.path));
  await Promise.allSettled(deleteQueue).catch(logger.error);
};

clearLogs();

// https://github.com/pinojs/pino/issues/1722
if (process.platform === 'win32') {
  const CP_UTF8 = 65001;
  const kernel32 = koffi.load('Kernel32');
  const setConsoleOutputCP = kernel32.func('SetConsoleOutputCP', 'bool', ['int']);
  const setConsoleCP = kernel32.func('SetConsoleCP', 'bool', ['int']);
  setConsoleOutputCP(CP_UTF8);
  setConsoleCP(CP_UTF8);
}

// Enable debug mode if needed
if (
  process.argv.includes('-d') ||
  process.argv.includes('--debug') ||
  process.env.NODE_ENV_ELECTRON_VITE === 'development' ||
  !!process.env.ELECTRON_CLI_ARGS
) {
  process.env.DEBUG = 'streamyx:*';
}

const streams = [
  {
    level: 'debug',
    stream: pino.destination({ dest: LOG_PATH, append: true }),
  },
  {
    level: process.env.DEBUG?.startsWith('streamyx') ? 'debug' : 'info',
    stream: pretty({
      colorize: true,
      sync: true,
      translateTime: 'SYS:HH:MM:ss.l',
      customPrettifiers: {
        time: (timestamp) => `${timestamp}`,
        level: (_logLevel, _key, _log, { labelColorized }: any) =>
          `${labelColorized}`.padEnd(15, ' '),
      },
      messageFormat: (log, messageKey, _levelLabel, { colors }) => {
        const message = log[messageKey];
        if (typeof message === 'string') return colors.whiteBright(message);
        else return message as string;
      },
    }),
  },
];

const logger = pino(
  {
    level: 'debug',
    formatters: {
      bindings: () => ({}),
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream(streams)
);

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const logLevelsColors: Record<LogLevel, string> = {
  debug: 'blue',
  info: 'green',
  warn: 'yellow',
  error: 'red',
};

const getCurrentTimeString = () => {
  return new Date().toISOString().split('T')[1].replace('Z', '');
};

export const getLogPrefix = (logLevel: LogLevel) => {
  const logLevelColor = inspect.colors[logLevelsColors[logLevel]] ?? [0, 0];
  const logLevelText = logLevel.toUpperCase();
  const [start, end] = logLevelColor;
  const logLevelColored = `\x1B[${start}m${logLevelText}\x1B[${end}m`;
  return `${getCurrentTimeString()} ${logLevelColored.padEnd(15, ' ')}:`;
};

export type { LogLevel };
export { logger, LOG_DIR, LOG_PATH };
