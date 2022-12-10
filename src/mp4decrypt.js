'use strict';

const { spawn } = require('node:child_process');
const { platform } = require('node:process');
const { logger } = require('./logger');
const fs = require('./fs');
const { findExecutable } = require('./utils');

const findPath = async (exeName) => {
  const globalPath = await findExecutable(exeName);
  const localPath = fs.join(
    fs.appDir,
    'files',
    'bin',
    exeName + (platform === 'win32' ? '.exe' : '')
  );
  const path = globalPath || localPath;
  return fs.exists(path) ? path : null;
};

const decrypt = async (key, kid, input, output, cleanup) => {
  const exeName = 'mp4decrypt';
  const exePath = await findPath(exeName);
  if (!exePath) {
    logger.error(`Decryption failed. Required package is missing: ${exeName}`);
    return;
  }
  const args = ['--key', `${kid}:${key}`, input, output];
  const mp4decrypt = spawn(exePath, args);
  mp4decrypt.stdout.setEncoding('utf8');
  mp4decrypt.stdout.on('data', (data) => logger.debug(data));
  mp4decrypt.stderr.setEncoding('utf8');
  mp4decrypt.stderr.on('error', (data) => logger.error(data));
  await new Promise((resolve) =>
    mp4decrypt.on('close', () => {
      mp4decrypt.kill('SIGINT');
      resolve();
    })
  );
  if (cleanup) await fs.delete(input, true);
};

module.exports = { decrypt };
