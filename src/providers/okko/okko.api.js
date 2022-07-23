'use strict';

const { Http } = require('../../network');
const { OkkoAuth } = require('./okko.auth');
const { API_ROUTES, SECRET } = require('./okko.constants');

class OkkoApi {
  #http;
  #auth;

  constructor(http = new Http()) {
    this.#http = http;
    this.#auth = new OkkoAuth(http);
  }

  async auth(username, password) {
    await this.#auth.login(username, password);
  }

  async fetchItem(alias, type) {
    const info = this.movieCard(alias, type);
    const { id } = info.element;
    const playbackInfo = this.preparePlayback([{ id, type }]);
    const item = playbackInfo.elements.items[0];
    return item;
  }

  async preparePlayback(elements) {
    const timestamp = Date.now();
    const params = new URLSearchParams({
      elements: JSON.stringify(elements),
      sid: this.#auth.config.sessionToken,
    });
    const url = API_ROUTES.preparePlayback + '?' + params.toString();
    const response = await this.#http.request(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-SCRAPI-CLIENT-TS': timestamp,
        'X-SCRAPI-SIGNATURE': this.#auth.generateSignature(SECRET, timestamp, params),
      },
    });
    return JSON.parse(response.body);
  }

  async movieCard(elementAlias, elementType) {
    const timestamp = Date.now();
    const params = new URLSearchParams({
      elementAlias,
      elementType,
      sid: this.#auth.config.sessionToken,
    });
    const url = API_ROUTES.movieCard + '?' + params.toString();
    const response = await this.#http.request(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-SCRAPI-CLIENT-TS': timestamp,
        'X-SCRAPI-SIGNATURE': this.#auth.generateSignature(SECRET, timestamp, params),
      },
    });
    return JSON.parse(response.body);
  }
}

module.exports = { OkkoApi };
