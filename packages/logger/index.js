const { pid } = require('node:process');
const { join } = require('node:path');
const { createWriteStream } = require('node:fs');
const { readdir, stat, unlink } = require('node:fs/promises');
const pino = require('pino');
const pretty = require('pino-pretty');

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

const getCurrentDateTimeString = () => {
  const date = new Date();
  const formatted = dateTimeFormatter.format(date);
  return formatted.replaceAll('/', '-').replace(', ', '_').replaceAll(':', '-');
};

const MAX_LOGS_COUNT = 50;

const createLogger = (options = {}) => {
  const dateTimeString = getCurrentDateTimeString();
  const logDir = options.dir || process.cwd();
  const logPath = join(logDir, `${dateTimeString}_${pid}.log`);

  // Enable debug mode if needed
  if (
    process.argv.includes('-d') ||
    process.argv.includes('--debug') ||
    process.env.NODE_ENV_ELECTRON_VITE === 'development' ||
    !!process.env.ELECTRON_CLI_ARGS
  ) {
    process.env.DEBUG = 'streamyx:*';
  }

  // https://github.com/pinojs/pino/issues/1722
  // Use native Node.js streams on Windows due to lack of Cyrillic support in pino's sonic-boom
  const isWindows = process.platform === 'win32';
  const prettyDestination = isWindows ? process.stdout : undefined;

  const level = process.env.DEBUG?.startsWith('streamyx') ? 'debug' : 'info';

  const streams = [
    {
      level,
      stream: pretty({
        colorize: true,
        sync: true,
        translateTime: 'SYS:HH:MM:ss.l',
        customPrettifiers: {
          time: (timestamp) => `${timestamp}`,
          level: (_logLevel, _key, _log, { labelColorized }) =>
            `${labelColorized}`.padEnd(15, ' '),
        },
        destination: prettyDestination,
        messageFormat: (log, messageKey, _levelLabel, { colors }) => {
          const message = log[messageKey];
          if (typeof message === 'string') return colors.whiteBright(message);
          else return message;
        },
      }),
    },
  ];

  const clearOutdatedLogs = async () => {
    const files = await readdir(logDir);
    const toPath = (name) => join(logDir, name);
    const statsQueue = files.map((name) =>
      stat(toPath(name))
        .catch(() => null)
        .then((stats) => ({ stats, path: toPath(name) })),
    );
    const results = await Promise.all(statsQueue);
    const stats = results.filter(Boolean);
    stats.sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());
    const oldLogs = stats.slice(MAX_LOGS_COUNT);
    const deleteQueue = oldLogs.map((log) => unlink(log.path));
    await Promise.allSettled(deleteQueue).catch(logger.error);
  };

  if (options.writeToFile) {
    clearOutdatedLogs();

    const fileStream = isWindows
      ? createWriteStream(logPath, { flags: 'a' })
      : pino.destination({ dest: logPath, append: true, mkdir: true });

    streams.unshift({ level: 'debug', stream: fileStream });
  }

  const logger = pino(
    {
      level: 'debug',
      formatters: {
        bindings: () => ({}),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    pino.multistream(streams),
  );

  return logger;
};

module.exports = { createLogger };
