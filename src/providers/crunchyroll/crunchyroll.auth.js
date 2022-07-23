'use strict';

const { join } = require('path');
const { logger } = require('../../logger');
const { Http, HTTP_METHOD } = require('../../network');
const { Files } = require('../../files');
const { question } = require('../../utilities');
const { AUTH_TOKENS, API_ROUTES } = require('./crunchyroll.constants');

const WORK_DIR = join(process.cwd(), 'files', 'providers', 'crunchyroll');
const CONFIG_NAME = 'auth.json';
const SCOPE = 'offline_access';
const HEADERS = {
  authorization: AUTH_TOKENS.authBasicMob,
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
};

class CrunchyrollAuth {
  #http;
  #files;
  #config;

  constructor() {
    this.#http = new Http();
    this.#files = new Files();
    this.#files.setWorkDir(WORK_DIR);
    this.#config = {};
  }

  get accountId() {
    return this.#config.accountId;
  }

  get cmsToken() {
    return this.#config.cmsToken;
  }

  async login(username, password) {
    logger.debug(`Loading auth config`);
    await this.#loadConfig(username, password);
    logger.debug(`Checking token`);
    const { hasToken, isTokenExpired } = this.#checkToken();
    if (!hasToken) {
      logger.debug(`Requesting credentials`);
      await this.#requestCredentials();
      logger.debug(`Requesting token`);
      await this.#requestToken();
    } else if (isTokenExpired) {
      logger.debug(`Refreshing token`);
      await this.refreshToken();
    }
    this.#http.disconnect();
    return {
      accessToken: this.#config.accessToken,
      refreshToken: this.#config.refreshToken,
      expires: this.#config.expires,
      tokenType: this.#config.tokenType,
      scope: this.#config.scope,
      country: this.#config.country,
      accountId: this.#config.accountId,
      cmsToken: this.#config.cmsToken,
    };
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

  #checkToken() {
    const TIME_MARGIN = 60000;
    const hasToken = this.#config.accessToken && this.#config.refreshToken && this.#config.expires;
    const isTokenExpired = hasToken && this.#config.expires - TIME_MARGIN < new Date().getTime();
    return { hasToken, isTokenExpired };
  }

  async #requestCredentials() {
    const hasCredentials = this.#config.username && this.#config.password;
    if (hasCredentials) return { username: this.#config.username, password: this.#config.password };
    this.#config.username = await question('Username');
    this.#config.password = await question('Password');
  }

  async #requestToken() {
    const params = new URLSearchParams({
      grant_type: 'password',
      username: this.#config.username,
      password: this.#config.password,
      scope: SCOPE,
    });
    const payload = params.toString();
    const requestOptions = { method: HTTP_METHOD.POST, body: payload, headers: HEADERS };
    try {
      const response = await this.#http.request(API_ROUTES.betaAuth, requestOptions);
      await this.#saveResponseToConfig(response);
      await this.#requestCmsToken();
    } catch (e) {
      logger.debug(`Token request failed: ${e.message}`);
      process.exit(1);
    }
  }

  async #saveResponseToConfig(response) {
    const data = JSON.parse(response?.body);
    if (data.error || response.statusCode !== 200) {
      logger.debug(`Token request failed: ${data.error || response.statusCode}`);
      process.exit(1);
    }
    this.#config.accessToken = data.access_token;
    this.#config.refreshToken = data.refresh_token;
    this.#config.expires = new Date().getTime() + data.expires_in;
    this.#config.tokenType = data.token_type;
    this.#config.scope = data.scope;
    this.#config.country = data.country;
    this.#config.accountId = data.account_id;
    this.#config.cookies = this.#http.headers.cookie;
    this.#http.setHeader('authorization', `Bearer ${this.#config.accessToken}`);
    await this.#files.write(CONFIG_NAME, this.#config);
  }

  async refreshToken() {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.#config.refreshToken,
      scope: SCOPE,
    });
    const payload = params.toString();
    const requestOptions = {
      method: HTTP_METHOD.POST,
      body: payload,
      headers: HEADERS,
    };
    try {
      const response = await this.#http.request(API_ROUTES.betaAuth, requestOptions);
      await this.#saveResponseToConfig(response);
      await this.#requestCmsToken();
    } catch (e) {
      logger.debug(`Refresh token request failed: ${e.message}`);
      process.exit(1);
    }
  }

  async #requestCmsToken() {
    const requestOptions = {
      method: HTTP_METHOD.GET,
      headers: { authorization: `Bearer ${this.#config.accessToken}` },
    };
    const response = await this.#http.request(API_ROUTES.betaCmsToken, requestOptions);
    if (response.statusCode !== 200) {
      logger.error(`Can't get CMS token. Status code: ${response.statusCode}`);
      logger.debug(response.body);
      return null;
    }
    this.#config.cmsToken = JSON.parse(response.body);
    await this.#files.write(CONFIG_NAME, this.#config);
  }
}

module.exports = { CrunchyrollAuth };
