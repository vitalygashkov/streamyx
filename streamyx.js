'use strict';

process.title = 'streamyx';

const { arch } = require('node:process');
const { description, name, version } = require('./package.json');
const { Args, parse } = require('./src/args');
const { LOG_LEVEL, logger } = require('./src/logger');
const { prompt, parseNumberRange, parseArrayFromString, bold } = require('./src/utils');
const { getDecryptionKeys } = require('./src/drm');
const { findProviderByUrl } = require('./src/providers');
const { Downloader } = require('./src/downloader');

const args = new Args()
  .setName(name)
  .setVersion(version)
  .setDescription(description)
  .setArgument('URL', 'item link from a streaming service')
  .setOption('-q, --video-quality', 'sets video quality')
  .setOption('-a, --audio-quality', 'sets audio quality')
  .setOption('-e, --episodes', 'sets episode numbers')
  .setOption('-s, --seasons', 'sets season numbers')
  .setOption('-f, --force', 'overwrite output files without asking')
  .setOption('-t, --template', 'filename template ("{title} - S{s}E{e} [{quality} {translation}]")')
  .setOption('--movie-template', 'movie filename template')
  .setOption(
    '--episode-template',
    'episode filename template, example: "{show}.S{s}E{e}.{title}.{quality}.{provider}.{format}.{codec}"'
  )
  .setOption('-p, --proxy', 'set http(s)/socks proxy (WHATWG URL standard)')
  .setOption('-c, --connections', 'number of parallel http connections (default: 24)')
  .setOption('--hdr', 'select high dynamic range if available')
  .setOption('--hardsub', 'download hardsubbed video if available')
  .setOption('--subs-lang', 'download subtitles by language tag')
  .setOption('--audio-lang', 'download audio by language tag')
  .setOption('--skip-subs', 'skip downloading subtitles')
  .setOption('--skip-audio', 'skip downloading audio')
  .setOption('--skip-video', 'skip downloading video')
  .setOption('--skip-mux', 'skip muxing video, audio and subtitles')
  .setOption('--trim-begin', 'trim video at the beginning')
  .setOption('--trim-end', 'trim video at the end')
  .setOption(
    '--pssh',
    'Widevine PSSH from MPD manifest (to get decryption keys without downloading; url argument should be widevine license url)'
  )
  .setOption('-d, --debug', 'debug mode')
  .setOption('-v, --version', 'output version')
  .setOption('-h, --help', 'output help')
  .parse();

const parseOptions = (args) => ({
  ...args,
  urls: args._,
  videoHeight: parseInt((args.q || args.videoQuality || '').replaceAll('p', '')),
  audioQuality: args.a || args.audioQuality,
  episodes: parseNumberRange(args.e || args.episodes),
  seasons: parseNumberRange(args.s || args.seasons),
  force: args.f || args.force,
  movieTemplate: args.movieTemplate || '{title}.{audioType}.{quality}.{provider}.{format}.{codec}',
  episodeTemplate:
    args.episodeTemplate ||
    '{show}.S{s}E{e}.{title}.{audioType}.{quality}.{provider}.{format}.{codec}',
  proxy: args.p || args.proxy,
  connections: parseInt(args.c || args.connections) || args.c || args.connections || 24,
  subtitleLanguages: parseArrayFromString(args.subsLang),
  audioLanguages: parseArrayFromString(args.audioLang),
  skipSubtitles: args.skipSubs,
  debug: args.d ?? args.debug,
});

const parseUrl = async (url) => {
  let isValid = false;
  let currentUrl = url;
  do {
    try {
      const urlObject = new URL(currentUrl);
      isValid = !!urlObject;
    } catch (e) {
      currentUrl = await prompt('URL');
    }
  } while (!isValid);
  return currentUrl;
};

const extractDecryptionKeys = async (licenseUrl, pssh) => {
  const drmConfig = { server: licenseUrl, individualizationServer: licenseUrl };
  const keys = await getDecryptionKeys(pssh, drmConfig);
  if (!keys?.length) logger.error('Decryption keys not found');
  else for (const key of keys) logger.info(`KID:KEY -> ${key.kid}:${key.key}`);
};

const run = async () => {
  const options = parseOptions(args);

  for (const url of args._) {
    options.url = await parseUrl(url);
    logger.setLogLevel(options.debug ? LOG_LEVEL.debug : LOG_LEVEL.info);

    if (options.pssh) {
      await extractDecryptionKeys(options.url, options.pssh);
      process.exit();
    }

    const provider = findProviderByUrl(options.url, options);
    if (!provider) {
      logger.error(`Provider not found`);
      process.exit(1);
    }
    await provider.init();
    logger.info(`Fetching metadata and generate download configs...`);
    const configs = await provider.getConfigList();
    const downloader = new Downloader(options);
    for (const config of configs) await downloader.start(config);
  }

  process.exit();
};

(async () => {
  await run();
})();
