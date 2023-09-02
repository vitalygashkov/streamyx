import { spawn } from 'node:child_process';
import { platform } from 'node:process';
import { logger } from './logger';
import fs from './fs';
import { findExecutable } from './utils';

const findPath = async (exeName: string) => {
  const globalPath = await findExecutable(exeName);
  const localPath = fs.join(fs.appDir, 'files', exeName + (platform === 'win32' ? '.exe' : ''));
  const path = globalPath || localPath;
  return fs.exists(path) ? path : null;
};

const decrypt = async (
  key: string,
  kid: string,
  input: string,
  output: string,
  cleanup?: boolean
) => {
  const exeName = 'mp4decrypt';
  const exePath = await findPath(exeName);
  if (!exePath) {
    logger.error(`Decryption failed. Required package is missing: ${exeName}`);
    return;
  }
  const args = ['--show-progress', '--key', `${kid}:${key}`, input, output];
  const mp4decrypt = spawn(exePath, args);
  mp4decrypt.stdout.setEncoding('utf8');
  mp4decrypt.stdout.on('data', (data) => logger.debug(data));
  mp4decrypt.stderr.setEncoding('utf8');
  mp4decrypt.stderr.on('error', (data) => logger.debug(String(data)));
  await new Promise<void>((resolve) =>
    mp4decrypt.on('close', () => {
      mp4decrypt.kill('SIGINT');
      resolve();
    })
  );
  if (cleanup) await fs.delete(input);
};

export { decrypt };
