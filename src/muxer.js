'use strict';

const childProcess = require('node:child_process');
const { platform } = require('node:process');
const { logger } = require('./logger');
const { Files } = require('./files');
const { join } = require('path');

const FFMPEG_NAME = 'ffmpeg' + (platform === 'win32' ? '.exe' : '');
const FFMPEG_PATH = join(process.cwd(), 'files', 'bin', FFMPEG_NAME);

const files = new Files();

const mux = async ({ inputs, output, trimBegin, trimEnd, cleanup }) => {
  const isExecutableExists = files.exists(FFMPEG_PATH);
  if (!isExecutableExists) {
    logger.error(`Muxing failed. Required package is missing: ${FFMPEG_PATH}`);
    return;
  }
  const args = ['-y'];
  for (const input of inputs) args.push('-i', `${input.path}`);
  if (trimBegin) args.push('-ss', trimBegin);
  for (let i = 0; i < inputs.length; i++) args.push(`-map`, `${i}`);
  for (const input of inputs) {
    if (input.type === 'text') {
      args.push(`-metadata:s:s:${input.id}`, `language=${input.language}`);
      args.push(`-metadata:s:s:${input.id}`, `title=${input.label}`);
    }
    if (input.type === 'audio') {
      args.push(`-metadata:s:a:${input.id}`, `language=${input.language}`);
      args.push(`-metadata:s:a:${input.id}`, `title=${input.label}`);
    }
  }
  args.push('-c:v', 'copy');
  args.push('-c:a', 'copy');
  args.push('-c:s', 'srt');
  args.push(`${output}`);
  const ffmpeg = childProcess.spawn(FFMPEG_PATH, args);
  ffmpeg.stdout.setEncoding('utf8');
  ffmpeg.stdout.on('data', (data) => logger.debug(data));
  ffmpeg.stderr.setEncoding('utf8');
  ffmpeg.stderr.on('error', (data) => logger.error(data));
  await new Promise((resolve) =>
    ffmpeg.on('close', () => {
      ffmpeg.kill('SIGINT');
      resolve();
    })
  );
  if (cleanup) for (const input of inputs) await files.delete(input.path, true);
};

module.exports = { mux };
