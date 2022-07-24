'use strict';

const { Provider } = require('../provider');
const { Http } = require('../../network');
const { IviApi } = require('./ivi.api');

class Ivi extends Provider {
  #args;
  #http;
  #api;

  constructor(args) {
    super(args);
    this.#args = args;
    this.#http = new Http();
    this.#api = new IviApi(this.#http);
  }

  get api() {
    return this.#api;
  }

  async init() {
    await this.#api.auth();
  }

  async getConfigList() {
    return [];
  }
}

module.exports = { Ivi };
