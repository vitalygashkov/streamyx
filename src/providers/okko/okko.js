'use strict';

const { Provider } = require('../provider');
const { Http } = require('../../network');
const { OkkoAuth } = require('./okko.auth');

class Okko extends Provider {
  #args;
  #http;
  #auth;
  #api;

  constructor(args) {
    super(args);
    this.#args = args;
    this.#http = new Http();
    this.#auth = new OkkoAuth();
  }

  api() {
    return this.#api;
  }

  async init() {
    const response = await this.#auth.login();
    // this.#http.setCookies(response.cookies);
    return response;
  }
}

module.exports = { Okko };
