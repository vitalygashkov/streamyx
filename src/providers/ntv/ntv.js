const { Provider } = require('../provider');
const { Http } = require('../../network');
const { logger } = require('../../logger');

class Ntv extends Provider {
  #args;
  #http;

  constructor(args) {
    super(args);
    this.#args = args;
    this.#http = new Http();
  }

  async init() {}

  async getConfigList() {
    const configList = [];
    const { url } = this.#args;
    const pageResponse = await this.#http.request(url);
    const videoFrameLink = pageResponse.body
      .split(`<meta property="og:video:iframe" content="`)[1]
      ?.split(`">`)[0]
      ?.split(`" />`)[0];
    const videoId = videoFrameLink.split(`embed/`)[1]?.split(`/`)[0];
    const xmlResponse = await this.#http.request(`https://www.ntv.ru/vi${videoId}/`);
    const fileLink = xmlResponse.body
      .split(`<file>`)[1]
      ?.split(`</file>`)[0]
      ?.split(`DATA[`)[1]
      ?.split(`]`)[0];
    const hqFileLink = fileLink.replace(`vod/`, `vod/hd/`).replace(`_lo.mp4`, `.mp4`);
    logger.info(`File: ${hqFileLink}`);

    // TODO: Improve downloader to handle non-chunked files
    logger.error(`Can't download this file`);
    process.exit(1);

    return configList;
  }
}

module.exports = { Ntv };
