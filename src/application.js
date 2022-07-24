'use strict';

const { logger, LOG_LEVEL } = require('./logger');
const { parseNumberRange, parseArrayFromString, question } = require('./utilities');
const { Downloader } = require('./downloader');
const { Kinopoisk, Ivi, Okko, Crunchyroll, Wakanim } = require('./providers');

class Application {
  #rawArgs;
  #args;
  #provider;

  constructor() {
    this.#rawArgs = {};
    this.#args = {};
    this.#provider = null;
  }

  async init(args) {
    this.#rawArgs = args;
    this.#processArgs();
    await this.#checkUrl();
    logger.setLogLevel(this.#args.debug ? LOG_LEVEL.debug : LOG_LEVEL.info);
    this.#provider = await this.#getProvider();
  }

  async start() {
    await this.#provider.init();
    logger.info(`Fetching metadata and generate download configs...`);
    const configs = await this.#provider.getConfigList();
    const downloader = new Downloader(this.#args);
    for (const config of configs) await downloader.start(config);
    logger.info(`Done!`);
  }

  #processArgs() {
    if (!this.#rawArgs.parsed) this.#rawArgs.parse();
    this.#args = {
      url: this.#rawArgs._?.[0],
      videoHeight: parseInt((this.#rawArgs.q || this.#rawArgs.videoQuality || '').replace('p', '')),
      audioQuality: this.#rawArgs.a || this.#rawArgs.audioQuality,
      episodes: parseNumberRange(this.#rawArgs.e || this.#rawArgs.episodes),
      seasons: parseNumberRange(this.#rawArgs.s || this.#rawArgs.seasons),
      force: this.#rawArgs.f || this.#rawArgs.force,
      movieTemplate:
        this.#rawArgs.movieTemplate || '{title}.{audioType}.{quality}.{provider}.{format}.{codec}',
      episodeTemplate:
        this.#rawArgs.episodeTemplate ||
        '{show}.S{s}E{e}.{title}.{audioType}.{quality}.{provider}.{format}.{codec}',
      proxy: this.#rawArgs.p || this.#rawArgs.proxy,
      partSize: parseInt(this.#rawArgs.partSize) || this.#rawArgs.partSize || 24,
      hardsub: this.#rawArgs.hardsub,
      subtitleLanguages: parseArrayFromString(this.#rawArgs.subsLang),
      audioLanguages: parseArrayFromString(this.#rawArgs.audioLang),
      skipSubtitles: this.#rawArgs.skipSubs,
      skipAudio: this.#rawArgs.skipAudio,
      skipVideo: this.#rawArgs.skipVideo,
      skipMux: this.#rawArgs.skipMux,
      trimBegin: this.#rawArgs.trimBegin,
      trimEnd: this.#rawArgs.trimEnd,
      debug: this.#rawArgs.d ?? this.#rawArgs.debug,
    };
  }

  async #checkUrl() {
    let isUrlValid = false;
    do {
      try {
        const url = new URL(this.#args.url);
        isUrlValid = !!url;
      } catch (e) {
        logger.warn('Invalid URL');
        this.#rawArgs.outputUsage();
        this.#args.url = await question('URL');
      }
    } while (!isUrlValid);
  }

  async #getProvider(name) {
    const providerName = name || this.#args.url;
    let Provider;
    if (providerName.includes('kinopoisk')) Provider = Kinopoisk;
    else if (providerName.includes('ivi')) Provider = Ivi;
    else if (providerName.includes('okko')) Provider = Okko;
    else if (providerName.includes('crunchyroll')) Provider = Crunchyroll;
    else if (providerName.includes('wakanim')) Provider = Wakanim;
    else {
      logger.error(`Provider not found`);
      process.exit(1);
    }
    return new Provider(this.#args);
  }
}

module.exports = { Application };
