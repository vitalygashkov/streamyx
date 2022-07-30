'use strict';

const { Http, HTTP_METHOD } = require('../../network');
const { IviAuth } = require('./ivi.auth');
const { DOMAINS, API_ROUTES } = require('./ivi.constants');

class IviApi {
  #http;
  #auth;

  constructor(http = new Http()) {
    this.#http = http;
    this.#auth = new IviAuth(http);
  }

  async auth(username, password) {
    await this.#auth.login(username, password);
  }
}

module.exports = { IviApi };
