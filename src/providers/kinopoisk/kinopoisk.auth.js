'use strict';

const { join } = require('path');
const crypto = require('crypto');
const { Http, HTTP_METHOD } = require('../../network');
const { logger } = require('../../logger');
const { Files } = require('../../files');
const { question } = require('../../utilities');
const { API_ROUTES } = require('./kinopoisk.constants');

const WORK_DIR = join(process.cwd(), 'files', 'providers', 'kinopoisk');
const CONFIG_NAME = 'auth.json';

class KinopoiskAuth {
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
    logger.debug(`Requesting credentials`);
    if (!this.#config.username || !this.#config.password) await this.#requestCredentials();
    logger.debug(`Checking auth config`);
    if (this.#config.csrfToken && this.#config.cookies)
      return {
        cookies: this.#config.cookies,
        csrfToken: this.#config.csrfToken,
        trackId: this.#config.trackId,
      };

    logger.debug(`Logging`);
    const uuid = crypto.randomUUID();
    const { container } = await this.#ssoPassportPull(uuid);
    await this.#ssoPassportLog(uuid, { action: 'start', result: 'timeout' });
    await this.#ssoInject(uuid, { container });
    await this.#ssoPassportLog(uuid, { action: 'finish', result: 'synchronized' });

    const { origin, retpath, csrfToken, processUuid } = await this.#preAuth(uuid);
    try {
      const loginParams = new URLSearchParams({
        csrf_token: csrfToken,
        login: this.#config.username,
        process_uuid: processUuid,
        origin,
        retpath,
      });
      const loginResponse = await this.#http.request(API_ROUTES.loginAuth, {
        method: HTTP_METHOD.POST,
        body: loginParams.toString(),
      });
      await this.#saveResponseToConfig(loginResponse);
      const passwordParams = new URLSearchParams({
        csrf_token: csrfToken,
        track_id: this.#config.trackId,
        password: this.#config.password,
        retpath,
      });
      const passwordResponse = await this.#http.request(API_ROUTES.passwordAuth, {
        method: HTTP_METHOD.POST,
        body: passwordParams.toString(),
      });
      const passwordObject = JSON.parse(passwordResponse.body);
      if (passwordObject.state === 'auth_challenge') {
        const challengeSubmitParams = new URLSearchParams({
          csrf_token: csrfToken,
          track_id: this.#config.trackId,
        });
        const challengeResponse = await this.#http.request(API_ROUTES.challengeSubmit, {
          method: HTTP_METHOD.POST,
          body: challengeSubmitParams.toString(),
        });
        const challenge = JSON.parse(challengeResponse.body)?.challenge;

        const validatePhoneParams = new URLSearchParams({
          csrf_token: csrfToken,
          phoneId: challenge.phoneId,
          track_id: this.#config.trackId,
        });
        const validatePhoneResponse = await this.#http.request(API_ROUTES.validatePhoneById, {
          method: HTTP_METHOD.POST,
          body: validatePhoneParams.toString(),
        });

        const phoneConfirmParams = new URLSearchParams({
          csrf_token: csrfToken,
          phone_id: challenge.phoneId,
          confirm_method: 'by_sms',
          track_id: this.#config.trackId,
          isCodeWithFormat: true,
        });

        const phoneConfirmResponse = await this.#http.request(API_ROUTES.phoneConfirmCodeSubmit, {
          method: HTTP_METHOD.POST,
          body: phoneConfirmParams.toString(),
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });

        const code = await question(`Enter a verification code sent to ${challenge.hint}`);

        const confirmCodeParams = new URLSearchParams({
          csrf_token: csrfToken,
          track_id: this.#config.trackId,
          code,
        });
        const confirmCodeResponse = await this.#http.request(API_ROUTES.phoneConfirmCode, {
          method: HTTP_METHOD.POST,
          body: confirmCodeParams.toString(),
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });

        const challengeCommitParams = new URLSearchParams({
          csrf_token: csrfToken,
          track_id: this.#config.trackId,
          challenge: challenge.challengeType,
        });
        const challengeCommitResponse = await this.#http.request(API_ROUTES.challengeCommit, {
          method: HTTP_METHOD.POST,
          body: challengeCommitParams.toString(),
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
      }
      await this.#saveResponseToConfig(passwordResponse);
      await this.#ssoInstall(uuid, retpath);
      await this.#saveCookiesToConfig();
      return {
        cookies: this.#config.cookies,
        csrfToken: this.#config.csrfToken,
        trackId: this.#config.trackId,
      };
    } catch (e) {
      logger.debug(`Login request failed: ${e.message}`);
      console.log(e);
      process.exit(1);
    }
  }

  async #preAuth(uuid) {
    const origin = 'kinopoisk';
    const retpath = `https://sso.passport.yandex.ru/push?retpath=https%3A%2F%2Fwww.kinopoisk.ru%2Fapi%2Fprofile-pending%2F%3Fretpath%3Dhttps%253A%252F%252Fhd.kinopoisk.ru%252F&uuid=${uuid}`;
    const params = new URLSearchParams({ origin, retpath });
    const { body } = await this.#http.request(`${API_ROUTES.preAuth}?${params.toString()}`);
    const csrfToken = body.split('csrf_token" value="')?.[1]?.split('"')?.[0];
    const processUuid = body.split('process_uuid=')?.[1]?.split('"')?.[0];
    return { origin, retpath, csrfToken, processUuid };
  }

  async #ssoPassportPull(uuid) {
    const params = new URLSearchParams({ origin: 'https://hd.kinopoisk.ru/', uuid });
    const url = `https://sso.passport.yandex.ru/pull?${params.toString()}`;
    const response = await this.#http.request(url, {
      headers: {
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        Referer: 'https://hd.kinopoisk.ru/',
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36',
      },
    });
    const container = response.body.split(`element1.value = '`)?.[1]?.split(`';`)?.[0];
    return { container };
  }

  async #ssoPassportLog(uuid, { action = 'start', result = 'timeout' }) {
    const params = new URLSearchParams({
      uuid,
      event: 'pull',
      action,
      status: 'ok',
      target: 'hd.kinopoisk.ru',
      origin: 'sso.passport.yandex.ru',
      result,
    });
    await this.#http.request(`https://sso.passport.yandex.ru/log?${params.toString()}`);
  }

  async #ssoInject(uuid, { container }) {
    const params = new URLSearchParams({
      retpath: 'https://hd.kinopoisk.ru/',
      container,
    });
    const url = `https://sso.kinopoisk.ru/inject?uuid=${uuid}`;
    const response = await this.#http.request(url, {
      method: HTTP_METHOD.POST,
      body: params.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  async #ssoInstall(uuid, retpath) {
    const retpathResponse = await this.#http.request(retpath);
    const container = retpathResponse.body.split(`element2.value = '`)[1].split(`';`)[0];
    const params = new URLSearchParams({
      retpath: `https://www.kinopoisk.ru/api/profile-pending/?retpath=https%3A%2F%2Fhd.kinopoisk.ru%2F`,
      container,
    });
    const url = `https://sso.kinopoisk.ru/install?uuid=${uuid}`;
    const response = await this.#http.request(url, {
      method: HTTP_METHOD.POST,
      body: params.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  async #loadConfig(username, password) {
    try {
      this.#config = await this.#files.read(CONFIG_NAME, true);
      this.#config.username = username || this.#config.username;
      this.#config.password = password || this.#config.password;
    } catch (e) {
      this.#config = { username, password };
    }
  }

  async #requestCredentials() {
    const hasCredentials = this.#config.username && this.#config.password;
    if (hasCredentials) return { username: this.#config.username, password: this.#config.password };
    this.#config.username = await question('Username');
    this.#config.password = await question('Password');
  }

  async #saveResponseToConfig(response) {
    const data = JSON.parse(response?.body);
    const isOk = data.status === 'ok';
    if (!isOk) {
      logger.debug(`Auth error: ${data.errors?.[0]}`);
      process.exit(1);
    }
    const info = {
      primaryAliasType: data.primary_alias_type,
      magicLinkEmail: data.magic_link_email,
      csrfToken: data.csrf_token,
      useNewSuggestByPhone: data.use_new_suggest_by_phone,
      trackId: data.track_id,
      canAuthorize: data.can_authorize,
      preferredAuthMethod: data.preferred_auth_method,
      authMethods: data.auth_methods,
    };
    for (const key of Object.keys(info)) if (info[key]) this.#config[key] = info[key];
    await this.#files.write(CONFIG_NAME, this.#config);
  }

  async #saveCookiesToConfig() {
    this.#config.cookies = this.#http.cookies;
    await this.#files.write(CONFIG_NAME, this.#config);
  }
}

module.exports = { KinopoiskAuth };
