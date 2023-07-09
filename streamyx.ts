process.title = 'streamyx';

import packageInfo from './package.json';
import { Args } from './src/args';
import { logger } from './src/logger';
import {
  parseArrayFromString,
  parseHeadersFromString,
  parseMainDomain,
  parseNumberRange,
  validateUrl,
} from './src/utils';
import { printDecryptionKeys } from './src/drm';
import { createProvider } from './src/providers';
import { Downloader } from './src/downloader';

const args = new Args()
  .setName(packageInfo.name)
  .setVersion(packageInfo.version)
  .setDescription(packageInfo.description)
  .setArgument(
    'URL',
    'Content URL like movie, season, series, etc. (use quotes "..." if URL includes specific symbols, like &)'
  )
  .setOption('-q, --video-quality', 'sets video quality; example: 1080p')
  .setOption('-a, --audio-quality', 'sets audio quality')
  .setOption('-e, --episodes', 'sets episode numbers; example: 1,4-10,16,17')
  .setOption('-s, --seasons', 'sets season numbers; example: 1,4,5-8')
  // .setOption('-f, --force', 'overwrite output files without asking')
  .setOption(
    '-t, --template',
    'filename template; example: "{title} - S{s}E{e} [{quality} {translation}]"'
  )
  .setOption('--movie-template', 'movie filename template')
  .setOption(
    '--episode-template',
    'episode filename template; example: "{show}.S{s}E{e}.{title}.{quality}.{provider}.{format}.{codec}"'
  )
  // .setOption('-p, --proxy', 'set http(s)/socks proxy (WHATWG URL standard)')
  .setOption('-c, --connections', 'number of parallel http connections per download (default: 16)')
  .setOption('--hdr', 'select high dynamic range video track if available')
  .setOption('--3d', 'select 3D video track if available')
  .setOption('--hardsub', 'download hardsubbed video if available')
  .setOption('--subs-lang', 'download subtitles by language tag (en, ru, etc.)')
  .setOption('--audio-lang', 'download audio by language tag (en, ru, etc.)')
  .setOption('--skip-subs', 'do not download subtitles')
  .setOption('--skip-audio', 'do not download audio')
  .setOption('--skip-video', 'do not download video')
  .setOption('--skip-mux', 'do not mux tracks like video, audio and subtitles')
  .setOption('--trim-begin', 'trim video at the beginning; example: 00:00:06')
  .setOption('--trim-end', 'trim video at the end; example: 00:01:30')
  .setOption(
    '--pssh',
    'Widevine PSSH from MPD manifest (print decryption keys only; url argument should be license url)'
  )
  .setOption(
    '--headers',
    'Headers for license request (--pssh argument required; example: "Content-Type:application/json|Cookie:SessionID=yIz9I")'
  )
  .setOption('-d, --debug', 'debug mode')
  .setOption('-v, --version', 'output version')
  .setOption('-h, --help', 'output help')
  .parse();

const parseArgs = (args: any) => ({
  ...args,
  urls: args._,
  videoHeight: parseInt(String(args.q || args.videoQuality || '').replaceAll('p', '')),
  audioQuality: args.a || args.audioQuality,
  episodes: parseNumberRange(args.e || args.episodes),
  seasons: parseNumberRange(args.s || args.seasons),
  force: args.f || args.force,
  movieTemplate: args.movieTemplate || '{title}.{audioType}.{quality}.{provider}.{format}.{codec}',
  episodeTemplate:
    args.episodeTemplate ||
    '{show}.S{s}E{e}.{title}.{audioType}.{quality}.{provider}.{format}.{codec}',
  proxy: args.p || args.proxy,
  connections: parseInt(String(args.c || args.connections)) || args.c || args.connections || 16,
  subtitleLanguages: parseArrayFromString(args.subsLang),
  audioLanguages: parseArrayFromString(args.audioLang),
  headers: parseHeadersFromString(args.headers),
  skipSubtitles: args.skipSubs,
  debug: args.d ?? args.debug,
});

const streamyx: any = {
  logger,
  downloader: null,
  providers: new Map(),
};

const startDownload = async (config: any) => {
  if (!streamyx.downloader) return;
  if (typeof config.drmConfig === 'function') config.drmConfig = await config.drmConfig();
  await streamyx.downloader.start(config);
};

const loadProvider = async (name: string, args: any) => {
  const provider = streamyx.providers.get(name) ?? createProvider(name, args);
  if (provider) {
    await provider.init();
    const hasProvider = streamyx.providers.has(provider.name);
    if (!hasProvider) streamyx.providers.set(provider.name, provider);
    const configs = await provider.getConfigList();
    for (const config of configs) await startDownload(config);
  } else {
    streamyx.logger.error(`Provider <${name}> not found`);
  }
};

const loadProviders = async () => {
  const parsedArgs: Record<string, any> = parseArgs(args);
  streamyx.logger.setLogLevel(parsedArgs.debug ? 'debug' : 'info');
  streamyx.downloader = new Downloader(parseArgs);
  const urls: string[] = parsedArgs.urls ?? [''];
  for (const url of urls) {
    if (parsedArgs.pssh) {
      await printDecryptionKeys(url, parsedArgs.pssh, parsedArgs.headers);
      break;
    }
    const domain = parseMainDomain(await validateUrl(url));
    if (domain) await loadProvider(domain, parsedArgs);
  }
};

loadProviders();
