import packageInfo from './package.json';
import { Args } from './src/args';
import { logger } from './src/logger';
import {
  parseArrayFromString,
  parseHeadersFromString,
  parseNumberRange,
  prompt,
} from './src/utils';
import { getDecryptionKeys } from './src/drm';
import { findProviderByUrl } from './src/providers';
import { Downloader } from './src/downloader';

process.title = 'streamyx';

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
    'Widevine PSSH from MPD manifest (to get decryption keys without downloading; url argument should be widevine license url)'
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

const parseUrl = async (url: string) => {
  let isValid = false;
  let currentUrl: string | null = url;
  do {
    try {
      if (currentUrl) {
        const urlObject = new URL(currentUrl);
        isValid = !!urlObject;
      } else {
        currentUrl = await prompt('URL');
      }
    } catch (e) {
      currentUrl = await prompt('URL');
    }
  } while (!isValid);
  return currentUrl!;
};

const extractDecryptionKeys = async (
  licenseUrl: string,
  pssh: string,
  headers?: Record<string, string>
) => {
  const drmConfig = { server: licenseUrl, individualizationServer: licenseUrl, headers };
  const keys = await getDecryptionKeys(pssh, drmConfig);
  if (!keys?.length) logger.error('Decryption keys not found');
  else for (const key of keys) logger.info(`KID:KEY -> ${key.kid}:${key.key}`);
};

const run = async () => {
  const parsedArgs: Record<string, any> = parseArgs(args);

  const urls = (parsedArgs.urls as Array<string>) ?? [''];
  for (const urlString of urls) {
    const url = await parseUrl(urlString);
    parsedArgs.url = url;
    logger.setLogLevel(parsedArgs.debug ? 'debug' : 'info');

    if (parsedArgs.pssh) {
      await extractDecryptionKeys(url, parsedArgs.pssh as string, parsedArgs.headers);
      process.exit();
    }

    const provider = findProviderByUrl(url, parsedArgs);
    if (!provider) {
      logger.error(`Provider not found`);
      process.exit(1);
    }
    await provider.init();
    logger.info(`Fetching metadata and generate download configs...`);
    const configs = await provider.getConfigList();
    const downloader = new Downloader(parsedArgs);
    for (const config of configs) await downloader.start(config);
  }

  process.exit();
};

(async () => {
  await run();
})();
