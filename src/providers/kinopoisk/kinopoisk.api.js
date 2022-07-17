'use strict';

const { logger } = require('../../logger');
const { DOMAINS, USER_AGENTS, API_VERSION, SERVICE_ID } = require('./kinopoisk.constants');

class KinopoiskApi {
  #http;

  constructor(http) {
    this.#http = http;
    this.#http.setHeader('User-Agent', USER_AGENTS.tizen);
  }

  async fetchMe() {
    return this.#getData(`${DOMAINS.api}/v${API_VERSION}/profiles/me?serviceId=${SERVICE_ID}`);
  }

  async fetchMetadata(contentId) {
    return this.#getData(`${DOMAINS.api}/v${API_VERSION}/hd/content/${contentId}/metadata`);
  }

  async fetchChildren(contentId) {
    return this.#getData(`${DOMAINS.api}/v${API_VERSION}/hd/content/${contentId}/children`);
  }

  async fetchStreamsMetadata(contentId) {
    return this.#getData(
      `${DOMAINS.api}/v${API_VERSION}/hd/content/${contentId}/streams/metadata?serviceId=${SERVICE_ID}`
    );
  }

  async fetchStreams(contentId) {
    return this.#getData(
      `${DOMAINS.api}/v${API_VERSION}/hd/content/${contentId}/streams?serviceId=${SERVICE_ID}`
    );
  }

  async #getData(route, json = true) {
    logger.debug(`Getting data from ${route}...`);
    let data = '';
    const url = this.#isFullUrl(route) ? route : DOMAINS.api + route;
    const { body, statusCode } = await this.#http.request(url);
    data = body || '';

    const isSuccess = statusCode === 200;
    if (isSuccess) {
      try {
        return json ? JSON.parse(data) : data;
      } catch (e) {
        logger.error(`Parsing JSON response failed. Route: ${route}`);
        process.exit(1);
      }
    }

    statusCode === 401 && logger.error(`Unauthorized: ${route}`);
    statusCode === 400 && logger.error(`Bad Request: ${route}`);
    logger.debug(`Request failed. Route: ${route}. Code ${statusCode}. ${data}`);
    process.exit(1);
  }

  #isFullUrl(value) {
    try {
      return !!new URL(value);
    } catch (e) {
      return false;
    }
  }
}

module.exports = { KinopoiskApi };
