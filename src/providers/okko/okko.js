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
    }

    return configList;
  }
}

module.exports = { Okko };
