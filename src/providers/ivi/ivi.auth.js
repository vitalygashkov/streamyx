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

    logger.debug(`Checking auth`);
    if (!this.#config.userUid) this.#config.userUid = this.getUserUid();
    if (!this.#config.session) this.#config.session = await this.userRegister();
    const { actualAppVersion, userAbBucket } = await this.geoCheck();
    if (this.#config.appVersion !== actualAppVersion) this.#config.appVersion = actualAppVersion;
    if (this.#config.userAbBucket !== userAbBucket) this.#config.userAbBucket = userAbBucket;
    const { subsiteId } = await this.appVersionInfo();
    if (this.#config.subsiteId !== subsiteId) this.#config.subsiteId = subsiteId;

    logger.debug(`Logging`);
    let session = '';
    const { action, what } = await this.userValidate();
    if (action === 'login') {
      if (what === 'email') {
        session = await this.userLoginIvi();
      } else if (what === 'phone') {
        const success = await this.userRegisterPhone();
        if (!success) return;
        const code = await question('Enter code');
        session = await this.userLoginPhone(code);
      }
    } else if (action === 'register') {
      logger.error(`Sign up is not possible`);
      process.exit(1);
    }

    this.#config.session = session;
    this.#config.cookies = this.#http.headers.cookie;
    await this.#files.write(CONFIG_NAME, this.#config);
    return this.#config;
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

  async getUserUid() {
    return (1e6 * Math.random() + Math.random()).toString().slice(0, 15);
  }

  async userValidate(username) {
    const params = new URLSearchParams({
      value: username || this.#config.username,
      user_ab_bucket: this.#config.userAbBucket,
      session: this.#config.session,
    });
    const response = await this.#http.request(API_ROUTES.userValidate, {
      method: HTTP_METHOD.POST,
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: params.toString(),
    });
    const data = JSON.parse(response.body);
    const { action, what } = data.result;
    return { action, what };
  }

  async userLoginIvi(email, password) {
    const params = new URLSearchParams({
      email: email || this.#config.username,
      password: password || this.#config.password,
      session: this.#config.session,
    });
    const response = await this.#http.request(API_ROUTES.userLoginIvi, {
      method: HTTP_METHOD.POST,
      headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: params.toString(),
    });
    const data = JSON.parse(response.body);
    const { session } = data.result;
    return session;
  }

  async userRegisterPhone(phone) {
    const params = new URLSearchParams({
      phone: phone || this.#config.username,
      session: this.#config.session,
    });
    const response = await this.#http.request(API_ROUTES.userRegisterPhone, {
      method: HTTP_METHOD.POST,
      headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: params.toString(),
    });
    const data = JSON.parse(response.body);
    const { success } = data.result;
    return success;
  }

  async userLoginPhone(code, phone) {
    const params = new URLSearchParams({
      code,
      phone: phone || this.#config.username,
      session: this.#config.session,
    });
    const response = await this.#http.request(API_ROUTES.userRegisterPhone, {
      method: HTTP_METHOD.POST,
      headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: params.toString(),
    });
    const data = JSON.parse(response.body);
    const { session } = data.result;
    return session;
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

  async appVersionInfo() {
    const response = await this.#http.request(API_ROUTES.appVersionInfo);
    const data = JSON.parse(response.body);
    const { result } = data;
    return {
      lastVersionId: result['last_version_id'],
      applicationId: result['application_id'],
      description: result['description'],
      subsiteId: result['subsite_id'],
      subsiteTitle: result['subsite_title'],
      id: result['id'],
    };
  }
}

module.exports = { IviAuth };
