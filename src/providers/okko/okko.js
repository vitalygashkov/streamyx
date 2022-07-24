'use strict';

const { Provider } = require('../provider');
const { Http } = require('../../network');
const { OkkoApi } = require('./okko.api');
const { ELEMENT_TYPE, QUALITY, PROVIDER_TAG } = require('./okko.constants');

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
    const urlElements = url.split('/');
    const alias = urlElements.pop();
    const type = urlElements.pop().toUpperCase();

    const movieCard = await this.#api.movieCard(alias, type);

    if (type === ELEMENT_TYPE.MOVIE) {
      const { id } = movieCard.element;

      const playbackInfo = await this.#api.preparePlayback([{ id, type }]);
      const item = playbackInfo.elements.items[0];

      const assetItems = item.assets.items;
      const assets = assetItems.filter(({ media }) => !media.drmType || media.drmType === 'CENC');

      const manifestUrl = assets[0].url;
      const drmConfig = {
        server: item.licenses.items[0].licenseServerUrls.CENC_WIDEVINE,
        http2: true,
      };

      const config = {
        provider: PROVIDER_TAG,
        movie: { title: item.originalName },
        manifestUrl,
        drmConfig,
      };
      configList.push(config);
    } else if (type === ELEMENT_TYPE.FRANCHISE) {
      const episodes = movieCard.element.children.items
        .map((item) => item.element)
        .filter(({ seqNo }) => !this.#args.episodes || this.#args.episodes.includes(seqNo));
      const configs = await this.#getEpisodeConfigs(episodes);
      configList.push(...configs);
    } else if (type === ELEMENT_TYPE.TV) {
      const seasons = movieCard.element.children.items.map((item) => item.element);
    }

    return configList;
  }

  async #getEpisodeConfigs(episodes) {
    const configs = [];
    const elements = episodes.map(({ id, type }) => ({ id, type }));
    for (const element of elements) {
      const playbackInfo = await this.#api.preparePlayback([element]);
      const item = playbackInfo.elements.items[0];
      const assetItems = item.assets.items;
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
        const showTitle = item.originalName.replace(`. Серия ${item.seqNo}`, '');
        const episodeTitle = episodes.find((ep) => ep.id === item.id)?.title;
        config.show = { title: showTitle };
        config.season = { number: null };
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
