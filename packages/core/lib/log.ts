import { join } from 'node:path';
import { promises as fsp } from 'node:fs';
import { createLogger } from '@streamyx/logger';
import { BaseDirectory } from './fs';
import { isExecutable } from './utils';

const logger = createLogger({ dir: BaseDirectory.AppLog, writeToFile: isExecutable });

const showLogsList = async (dir: string) => {
  const files = await fsp.readdir(dir);
  const toPath = (name: string) => join(dir, name);
  for (const file of files) console.log(toPath(file));
};

export { logger, showLogsList };
