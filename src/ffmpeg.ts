import { spawn } from 'node:child_process';
import { platform } from 'node:process';
import { logger } from './logger';
import fs from './fs';
import { findExecutable } from './utils';

const findPath = async (exeName: string) => {
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

interface MuxOptions {
  inputs: { id: number; language?: string; label?: string; type: string; path: string }[];
  output: string;
  trimBegin?: string;
  trimEnd?: string;
  cleanup?: boolean;
}

const mux = async ({ inputs, output, trimBegin, trimEnd, cleanup }: MuxOptions) => {
  const exeName = 'ffmpeg';
  const exePath = await findPath(exeName);
  if (!exePath) {
    logger.error(`Muxing failed. Required package is missing: ${exeName}`);
    return;
  }
  const args = ['-y', '-hide_banner', '-loglevel', '8'];
  for (const input of inputs) args.push('-i', `${input.path}`);
  if (trimBegin) args.push('-ss', trimBegin);
  const getTrackTypeSymbol = (track: { type: string }) =>
    track.type[0] === 't' ? 's' : track.type[0];
  for (let i = 0; i < inputs.length; i++)
    args.push(`-map`, `${i}:${getTrackTypeSymbol(inputs[i])}`);
  for (const input of inputs) {
    // TODO: Make FFMPEG-supported language code: ISO 639-1 (alpha-2 code)
    if (input.type === 'text') {
      if (input.language)
        args.push(
          `-metadata:s:s:${input.id}`,
          `language=${input.language?.slice(0, 3)?.replace('-', '')}`
        );
      if (input.label) args.push(`-metadata:s:s:${input.id}`, `title="${input.label}"`);
    }
    if (input.type === 'audio') {
      if (input.language)
        args.push(
          `-metadata:s:a:${input.id}`,
          `language=${input.language?.slice(0, 3)?.replace('-', '')}`
        );
      if (input.label) args.push(`-metadata:s:a:${input.id}`, `title="${input.label}"`);
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

export { mux };
