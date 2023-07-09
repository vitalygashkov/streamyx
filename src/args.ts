import { platform, arch, version } from 'node:process';
import { parseArgs, ParseArgsConfig } from 'node:util';
import packageInfo from '../package.json';
import { parseArrayFromString, parseHeadersFromString, parseNumberRange } from './utils';

interface Option {
  type: 'string' | 'boolean';
  multiple?: boolean | undefined;
  short?: string | undefined;
  default?: string | boolean | string[] | boolean[] | undefined;
  description?: string;
}

interface ParseArgsConfigWithDescriptions extends ParseArgsConfig {
  options: Record<string, Option>;
}

const positionals = {
  URL: {
    description:
      'Content URL like movie, season, series, etc. (use quotes "..." if URL includes specific symbols, like &)',
  },
};

const config: ParseArgsConfigWithDescriptions = {
  allowPositionals: true,
  options: {
    'video-quality': {
      short: 'q',
      type: 'string',
      description: 'sets video quality; example: 1080p',
    },
    'audio-quality': { short: 'a', type: 'string', description: 'sets audio quality' },
    episodes: {
      short: 'e',
      type: 'string',
      description: 'sets episode numbers; example: 1,4-10,16,17',
    },
    seasons: { short: 's', type: 'string', description: 'sets season numbers; example: 1,4,5-8' },
    template: {
      short: 't',
      type: 'string',
      description: 'filename template; example: "{title} - S{s}E{e} [{quality} {translation}]"',
    },
    'movie-template': {
      type: 'string',
      description: 'movie filename template',
      default: '{title}.{audioType}.{quality}.{provider}.{format}.{codec}',
    },
    'episode-template': {
      type: 'string',
      description: 'episode filename template',
      default: '{show}.S{s}E{e}.{title}.{audioType}.{quality}.{provider}.{format}.{codec}',
    },
    connections: {
      short: 'c',
      type: 'string',
      default: '16',
      description: 'number of parallel http connections per download (default: 16)',
    },
    hdr: { type: 'boolean', description: 'select high dynamic range video track if available' },
    '3d': { type: 'boolean', description: 'select 3D video track if available' },
    hardsub: { type: 'boolean', description: 'download hardsubbed video if available' },
    'subs-lang': {
      type: 'string',
      description: 'download subtitles by language tag (en, ru, etc.)',
    },
    'audio-lang': { type: 'string', description: 'download audio by language tag (en, ru, etc.)' },
    'skip-subs': { type: 'boolean', description: 'do not download subtitles' },
    'skip-audio': { type: 'boolean', description: 'do not download audio' },
    'skip-video': { type: 'boolean', description: 'do not download video' },
    'skip-mux': {
      type: 'boolean',
      description: 'do not mux tracks like video, audio and subtitles',
    },
    'trim-begin': { type: 'string', description: 'trim video at the beginning; example: 00:00:06' },
    'trim-end': { type: 'string', description: 'trim video at the end; example: 00:01:30' },
    pssh: {
      type: 'string',
      description:
        'widevine PSSH from MPD manifest (print decryption keys only; url argument should be license url)',
    },
    headers: {
      type: 'string',
      description:
        'headers for license request (--pssh argument required; example: "Content-Type:application/json|Cookie:SessionID=yIz9I")',
    },
    debug: { short: 'd', type: 'boolean', description: 'debug mode', default: false },
    version: { short: 'v', type: 'boolean', description: 'print version', default: false },
    help: { short: 'h', type: 'boolean', description: 'print help', default: false },
  },
};

export const getProcessedArgs = () => {
  const args = parseArgs(config);
  const { values, positionals } = args;
  return {
    urls: positionals,
    videoHeight: parseInt(String(values['video-quality'] || '').replaceAll('p', '')),
    audioQuality: values['audio-quality'],
    episodes: parseNumberRange(String(values.episodes || '')),
    seasons: parseNumberRange(String(values.seasons || '')),
    movieTemplate:
      values['movie-template'] || '{title}.{audioType}.{quality}.{provider}.{format}.{codec}',
    episodeTemplate:
      values['episode-template'] ||
      '{show}.S{s}E{e}.{title}.{audioType}.{quality}.{provider}.{format}.{codec}',
    connections: parseInt(String(values.connections)),
    subtitleLanguages: parseArrayFromString(String(values['subs-lang'] || '')),
    audioLanguages: parseArrayFromString(String(values['audio-lang'] || '')),
    pssh: String(values.pssh || ''),
    headers: parseHeadersFromString(String(values.headers || '')),
    skipSubtitles: values['skip-subs'],
    debug: values.debug,
    version: values.version,
    help: values.help,
  };
};

export const printVersion = () => {
  console.log(`\x1b[1mVERSION\x1b[0m`);
  console.log(`  ${packageInfo.name}/${packageInfo.version} ${platform}-${arch} node-${version}\n`);
};

const printDescription = () => console.log(`${packageInfo.name}: ${packageInfo.description}\n`);

const printUsage = (options: any, args: { name: string }[]) => {
  console.log(`\x1b[1mUSAGE\x1b[0m`);
  let message = `  $ ${packageInfo.name} `;
  if (Object.keys(options).length) message += `[OPTIONS] `;
  if (args.length) message += args.map((a) => a.name).join(' ');
  console.log(`${message}\n`);
};

const printArguments = (data: Record<string, { description: string }> = {}) => {
  if (!Object.keys(data).length) return;
  console.log(`\x1b[1mARGUMENTS\x1b[0m`);
  for (const [name, argument] of Object.entries(data))
    console.log(`  ${name}  ${argument.description}\n`);
};

const printOptions = (options?: Record<string, Option>) => {
  if (options) {
    console.log(`\x1b[1mOPTIONS\x1b[0m`);
    for (const [name, option] of Object.entries(options)) {
      const flags = [option.short ? '-' + option.short : '', '--' + name]
        .filter(Boolean)
        .join(', ');
      console.log(`  ${flags.padEnd(20)} ${option.description}`);
    }
  }
};

export const printHelp = () => {
  printDescription();
  printVersion();
  printUsage(config.options, []);
  printArguments(positionals);
  printOptions(config.options);
};
