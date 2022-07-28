'use strict';

const { Provider } = require('../provider');
const { Http } = require('../../network');
const { OkkoApi } = require('./okko.api');
const { ELEMENT_TYPE, QUALITY, PROVIDER_TAG } = require('./okko.constants');
const { logger } = require('../../logger');

class Okko extends Provider {
  #args;
  #http;
  #api;

  constructor(args) {
    super(args);
    this.#args = args;
    this.#http = new Http();
    this.#api = new OkkoApi(this.#http);
  }

  get api() {
    return this.#api;
  }

  async init() {
    await this.#api.auth();
  }

  async getConfigList() {
    const configList = [];
    const { url } = this.#args;
    const urlObject = new URL(url);
    const { pathname } = urlObject;
    const pathElements = pathname.split('/');
    const type = pathElements[1].toUpperCase();
    const alias = pathElements[2];
    const seasonNumber = pathname.includes('season/') ? Number(pathElements[4]) : null;

    const movieCard = await this.#api.movieCard(alias, type);
    const show = movieCard.element;

    if (type === ELEMENT_TYPE.MOVIE) {
      const playbackInfo = await this.#api.preparePlayback([{ id: show.id, type }]);
      const item = playbackInfo.elements.items[0];
      const assetItems = item.assets.items;
      const assets = assetItems.filter(({ media }) => !media.drmType || media.drmType === 'CENC');
      const config = {
        provider: PROVIDER_TAG,
        movie: { title: item.originalName },
        manifestUrl: assets[0].url,
        drmConfig: {
          server: item.licenses.items[0].licenseServerUrls.CENC_WIDEVINE,
          http2: true,
        },
      };
      configList.push(config);
    } else if (type === ELEMENT_TYPE.FRANCHISE) {
      const episodes = movieCard.element.children.items
        .map((item) => item.element)
        .filter(({ seqNo }) => !this.#args.episodes || this.#args.episodes.includes(seqNo));
      const configs = await this.#getEpisodeConfigs(episodes);
      configList.push(...configs);
    } else if (type === ELEMENT_TYPE.TV) {
      const seasons = movieCard.element.children.items
        .map((item) => item.element)
        .filter(
          ({ seqNo }) =>
            (!this.#args.seasons || this.#args.seasons.includes(seqNo)) &&
            (!seasonNumber || seasonNumber === seqNo)
        );
      for (const season of seasons) {
        const episodes = season.children.items
          .map((item) => item.element)
          .filter(({ seqNo }) => !this.#args.episodes || this.#args.episodes.includes(seqNo));
        const configs = await this.#getEpisodeConfigs(episodes, season, show);
        configList.push(...configs);
      }
    }

    return configList;
  }

  async #getEpisodeConfigs(episodes, season, show) {
    if (!episodes?.length) return [];
    const configs = [];
    const elements = episodes.map(({ id, type }) => ({ id, type }));
    for (const element of elements) {
      const playbackInfo = await this.#api.preparePlayback([element]);
      const item = playbackInfo.elements.items[0];
      const assetItems = item.assets.items;
      if (!assetItems.length) {
        logger.error(`No streams available`);
        process.exit(1);
      }
      const assets = assetItems.filter(({ media }) => !media.drmType || media.drmType === 'CENC');
      const config = {
        provider: PROVIDER_TAG,
        manifestUrl: assets[0].url,
        drmConfig: {
          server: item.licenses.items[0].licenseServerUrls.CENC_WIDEVINE,
          http2: true,
        },
      };
      if (item.type === ELEMENT_TYPE.MOVIE) config.movie = { title: item.originalName };
      if (item.type === ELEMENT_TYPE.EPISODE) {
        const showTitle = show.originalName;
        const episodeTitle = episodes.find((ep) => ep.id === item.id)?.originalName;
        config.show = { title: showTitle };
        config.season = { number: season.seqNo };
        config.episode = {
          number: item.seqNo,
          title: showTitle === episodeTitle ? null : episodeTitle,
        };
      }
      configs.push(config);
    }
    return configs;
  }
}

module.exports = { Okko };
