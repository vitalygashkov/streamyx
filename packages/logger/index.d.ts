import { Logger } from 'pino';

type CreateLoggerOptions = {
  dir?: string;
  writeToFile?: boolean;
};

export function createLogger(
  options?: LaunchBrowserOptions,
): Logger<never, boolean>;
