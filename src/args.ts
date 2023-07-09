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
    hdr: {
      type: 'boolean',
      description: 'select high dynamic range video track if available',
      default: false,
    },
    '3d': { type: 'boolean', description: 'select 3D video track if available', default: false },
    hardsub: {
      type: 'boolean',
      description: 'download hardsubbed video if available',
      default: false,
    },
    'subs-lang': {
      type: 'string',
      description: 'download subtitles by language tag (en, ru, etc.)',
    },
    'audio-lang': { type: 'string', description: 'download audio by language tag (en, ru, etc.)' },
    'skip-subs': { type: 'boolean', description: 'do not download subtitles', default: false },
    'skip-audio': { type: 'boolean', description: 'do not download audio', default: false },
    'skip-video': { type: 'boolean', description: 'do not download video', default: false },
    'skip-mux': {
      type: 'boolean',
      description: 'do not mux tracks like video, audio and subtitles',
      default: false,
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

const getProcessedArgs = () => {
  const args = parseArgs(config);
  const { values, positionals } = args;
  return {
    urls: positionals,
    videoHeight: parseInt(String(values['video-quality'] || '').replaceAll('p', '')),
    audioQuality: values['audio-quality'],
    episodes: parseNumberRange(String(values['episodes'] || '')),
    seasons: parseNumberRange(String(values['seasons'] || '')),
    movieTemplate: values['movie-template'],
    episodeTemplate: values['episode-template'],
    connections: parseInt(String(values['connections'])),
    hdr: values['hdr'],
    '3d': values['3d'],
    hardsub: values['hardsub'],
    subtitleLanguages: parseArrayFromString(String(values['subs-lang'] || '')),
    audioLanguages: parseArrayFromString(String(values['audio-lang'] || '')),
    skipSubtitles: values['skip-subs'],
    skipAudio: values['skip-audio'],
    skipVideo: values['skip-video'],
    skipMux: values['skip-mux'],
    trimBegin: values['trim-begin'],
    trimEnd: values['trim-end'],
    pssh: String(values['pssh'] || ''),
    headers: parseHeadersFromString(String(values['headers'] || '')),
    debug: values['debug'],
    version: values['version'],
    help: values['help'],
  };
};

const printVersion = () => {
  console.log(`\x1b[1mVERSION\x1b[0m`);
  console.log(`  ${packageInfo.name}/${packageInfo.version} ${platform}-${arch} node-${version}\n`);
};

const printDescription = () => console.log(`${packageInfo.name}: ${packageInfo.description}\n`);

const printUsage = (options: Record<string, Option>, args: typeof positionals) => {
  console.log(`\x1b[1mUSAGE\x1b[0m`);
  let message = `  $ ${packageInfo.name} `;
  if (Object.keys(options).length) message += `[OPTIONS] `;
  if (Object.keys(args).length) message += Object.keys(args).join(' ');
  console.log(`${message}\n`);
};

const printArguments = (args: typeof positionals) => {
  if (!Object.keys(args).length) return;
  console.log(`\x1b[1mARGUMENTS\x1b[0m`);
  for (const [name, { description }] of Object.entries(args))
    console.log(`  ${name}  ${description}\n`);
};

const printOptions = (options: Record<string, Option> = {}) => {
  if (!Object.keys(options).length) return;
  console.log(`\x1b[1mOPTIONS\x1b[0m`);
  for (const [name, { short, description }] of Object.entries(options)) {
    const flags = [short ? '-' + short : '', '--' + name].filter(Boolean).join(', ');
    console.log(`  ${flags.padEnd(20)} ${description}`);
  }
};

const printHelp = () => {
  printDescription();
  printVersion();
  printUsage(config.options, positionals);
  printArguments(positionals);
  printOptions(config.options);
};

export { getProcessedArgs, printVersion, printHelp };
