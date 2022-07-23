'use strict';

const { join } = require('path');
const { logger } = require('../../logger');
const { Http, HTTP_METHOD } = require('../../network');
const { Files } = require('../../files');
const { question } = require('../../utilities');
const { CLIENTS, API_ROUTES } = require('./wakanim.constants');

const WORK_DIR = join(process.cwd(), 'files', 'providers', 'wakanim');
const CONFIG_NAME = 'auth.json';
const CLIENT_ID = CLIENTS.windows.id;
const CLIENT_SECRET = CLIENTS.windows.secret;
const HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };

class WakanimAuth {
  #http;
  #files;
  #config;

  constructor() {
    this.#http = new Http();
    this.#files = new Files();
    this.#files.setWorkDir(WORK_DIR);
    this.#config = {};
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
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      response_type: 'code id_token token',
      username: this.#config.username,
      password: this.#config.password,
      nonce: Math.floor(Math.random() * 1000000000).toString(),
      state: Math.floor(Math.random() * 1000000000).toString(),
      scope: 'email openid profile offline_access read',
    });
    const payload = params.toString().replaceAll('%2520', '+');
    const requestOptions = { method: HTTP_METHOD.POST, body: payload, headers: HEADERS };
    try {
      const response = await this.#http.request(API_ROUTES.token, requestOptions);
      await this.#saveResponseToConfig(response);
    } catch (e) {
      logger.debug(`Token request failed: ${e.message}`);
      process.exit(1);
    }
  }

  async refreshToken() {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: this.#config.refreshToken,
    });
    const payload = params.toString();
    const requestOptions = { method: HTTP_METHOD.POST, body: payload, headers: HEADERS };
    try {
      const response = await this.#http.request(API_ROUTES.token, requestOptions);
      await this.#saveResponseToConfig(response);
    } catch (e) {
      logger.debug(`Refresh token request failed: ${e.message}`);
      process.exit(1);
    }
  }

  async #saveResponseToConfig(response) {
    const data = JSON.parse(response?.body);
    if (data.error) {
      logger.debug(`Token request failed: ${data.error}`);
      process.exit(1);
    }
    this.#config.accessToken = data.access_token;
    this.#config.refreshToken = data.refresh_token;
    this.#config.expires = new Date().getTime() + data.expires_in * 1000;
    this.#config.cookies = this.#http.headers.cookie;
    await this.#files.write(CONFIG_NAME, this.#config);
  }
}

module.exports = { WakanimAuth };
