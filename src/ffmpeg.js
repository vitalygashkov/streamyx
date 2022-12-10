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

const mux = async ({ inputs, output, trimBegin, trimEnd, cleanup }) => {
  const exeName = 'ffmpeg';
  const exePath = await findPath(exeName);
  if (!exePath) {
    logger.error(`Muxing failed. Required package is missing: ${exeName}`);
    return;
  }
  const args = ['-y', '-hide_banner', '-loglevel', '8'];
  for (const input of inputs) args.push('-i', `${input.path}`);
  if (trimBegin) args.push('-ss', trimBegin);
  const getTrackTypeSymbol = (track) => (track.type[0] === 't' ? 's' : track.type[0]);
  for (let i = 0; i < inputs.length; i++)
    args.push(`-map`, `${i}:${getTrackTypeSymbol(inputs[i])}`);
  for (const input of inputs) {
    if (input.type === 'text') {
      args.push(`-metadata:s:s:${input.id}`, `language=${input.language?.slice(0, 3)}`);
      args.push(`-metadata:s:s:${input.id}`, `title="${input.label}"`);
    }
    if (input.type === 'audio') {
      args.push(`-metadata:s:a:${input.id}`, `language=${input.language?.slice(0, 3)}`);
      args.push(`-metadata:s:a:${input.id}`, `title="${input.label}"`);
    }
  }

  // args.push('-bsf:a', 'aac_adtstoasc'); // Fix for "Error parsing AAC extradata, unable to determine samplerate"
  args.push('-c:v', 'copy');
  args.push('-c:a', 'copy');
  args.push('-c:s', 'srt');
  args.push(output);

  const ffmpeg = spawn(exePath, args);

  let error = '';
  ffmpeg.stderr.setEncoding('utf8');
  ffmpeg.stderr.on('data', (d) => (error += d)).on('end', () => logger.error(error));
  let data = '';
  ffmpeg.stdout.setEncoding('utf8');
  ffmpeg.stderr.on('data', (d) => (data += d)).on('end', () => logger.debug(data));

  await new Promise((resolve) => ffmpeg.on('close', resolve));
  ffmpeg.kill('SIGINT');
  if (cleanup) for (const input of inputs) await fs.delete(input.path);
};

module.exports = { mux };
