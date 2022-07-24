'use strict';

const { join } = require('path');
const { Files } = require('../../files');
const { Http, HTTP_METHOD } = require('../../network');
const { logger } = require('../../logger');
const { question } = require('../../utilities');
const { DOMAINS, API_ROUTES } = require('./ivi.constants');

const WORK_DIR = join(process.cwd(), 'files', 'providers', 'ivi');
const CONFIG_NAME = 'auth.json';

class IviAuth {
  #http;
  #files;
  #config;

  constructor(http = new Http()) {
    this.#files = new Files();
    this.#files.setWorkDir(WORK_DIR);
    this.#http = http;
    // this.#http.setHeader('User-Agent', '');
    this.#config = {};
  }

  get config() {
    return this.#config;
  }

  async login(username, password) {
    logger.debug(`Loading auth config`);
    await this.#loadConfig(username, password);
    logger.debug(`Requesting credentials`);
    if (!this.#config.username || !this.#config.password) await this.#requestCredentials();
    logger.debug(`Checking auth config`);
    // ...

    logger.debug(`Logging`);
  }

  async #loadConfig(username, password) {
    try {
      this.#config = await this.#files.read(CONFIG_NAME, true);
      this.#config.username = username || this.#config.username;
      this.#config.password = password || this.#config.password;
    } catch (e) {
      this.#config = {};
    }
  }

  async #requestCredentials() {
    const hasCredentials = this.#config.username && this.#config.password;
    if (hasCredentials) return { username: this.#config.username, password: this.#config.password };
    this.#config.username = await question('Username');
    this.#config.password = await question('Password');
  }

  async #getSession() {
    const response = await this.#http.request(DOMAINS.default, {
      method: HTTP_METHOD.GET,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.114 Safari/537.36 Edg/103.0.1264.62',
      },
    });

    let session = '';
    let sessionData = '';
    let userAbBucket = '';
    for (const cookie of response.headers['set-cookie']) {
      if (cookie.includes('sessivi')) session = cookie.split('sessivi=')[1].split(';')[0];
      if (cookie.includes('session_data'))
        sessionData = cookie.split('session_data=')[1].split(';')[0];
      if (cookie.includes('user_ab_bucket'))
        userAbBucket = cookie.split('user_ab_bucket=')[1].split(';')[0];
    }

    return { session, sessionData, userAbBucket };
  }

  async userRegister() {
    const response = await this.#http.request(API_ROUTES.userRegister, {
      method: HTTP_METHOD.POST,
    });
    const data = JSON.parse(response.body);
    const { session } = data.result;
    return session;
  }

  async geoCheck() {
    const response = await this.#http.request(API_ROUTES.geoCheck);
    const { result } = JSON.parse(response.body);
    return {
      countryCode: result['country_code'],
      countryName: result['country_name'],
      timestamp: result['timestamp'],
      countryPlaceId: result['country_place_id'],
      userAbBucket: result['user_ab_bucket'],
      actualAppVersion: result['actual_app_version'],
    };
  }
}

module.exports = { IviAuth };
