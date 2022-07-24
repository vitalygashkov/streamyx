'use strict';

const crypto = require('node:crypto');
const { join } = require('path');
const { logger } = require('../../logger');
const { Http, HTTP_METHOD } = require('../../network');
const { Files } = require('../../files');
const { getRandomElements, question } = require('../../utilities');
const {
  API_ROUTES,
  USER_AGENT,
  DEVICE_SOFTWARE,
  CLIENT_ID,
  DEVICE_MANUFACTURER,
  DEVICE_MODEL,
  DEVICE_KEY,
  APP_VERSION,
  TOKEN_TYPE,
  SECRET,
} = require('./okko.constants');

const WORK_DIR = join(process.cwd(), 'files', 'providers', 'okko');
const CONFIG_NAME = 'auth.json';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '1234567890';
const LETTERS_AND_DIGITS = LETTERS + DIGITS;

class OkkoAuth {
  #http;
  #files;
  #config;

  #deviceId;
  #softwareId;
  #deviceSoftware;

  constructor(http = new Http()) {
    this.#files = new Files();
    this.#files.setWorkDir(WORK_DIR);
    this.#http = http;
    this.#http.setHeader('User-Agent', USER_AGENT);
    this.#config = {};

    this.#deviceId = Array(26).fill('a').join('');
    this.#deviceId += getRandomElements(LETTERS_AND_DIGITS, 5).join('');
    this.#deviceId = Buffer.from(this.#deviceId, 'utf-8').toString('base64').replace(/=+$/, '');
    this.#softwareId = crypto.randomUUID();
    this.#deviceSoftware = DEVICE_SOFTWARE.replaceAll('{softwareId}', this.#softwareId);
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
    if (
      this.#config.persistentToken &&
      this.#config.sessionToken &&
      this.#config.accessKey &&
      this.#config.cookies
    )
      return {
        persistentToken: this.#config.persistentToken,
        sessionToken: this.#config.sessionToken,
        accessKey: this.#config.accessKey,
        cookies: this.#config.cookies,
      };

    logger.debug(`Logging`);
    const initToken = await this.#getInitToken();
    const tempTokens = await this.#getAuthTokens(initToken, TOKEN_TYPE.temporary);
    const pin = await this.#getPin(tempTokens.accessKey, tempTokens.sessionToken);
    logger.info(`Go to https://okko.tv/settings/devices#pin and enter: ${pin}`);
    await question('Code entered?', 'confirm');
    const authTokens = await this.#getAuthTokens(initToken, TOKEN_TYPE.persistent);

    this.#config.persistentToken = authTokens.persistentToken;
    this.#config.sessionToken = authTokens.sessionToken;
    this.#config.accessKey = authTokens.accessKey;
    this.#config.cookies = this.#http.headers.cookie;
    // this.#http.setHeader('authorization', `Bearer ${this.#config.accessToken}`);
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

  async #getInitToken() {
    const timestamp = Date.now();
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      device_id: this.#deviceId,
      device_manufacturer: DEVICE_MANUFACTURER,
      device_model: DEVICE_MODEL,
      device_secure_id: this.#generateDeviceSecureId(timestamp),
      device_software: this.#deviceSoftware,
      device_type: 'tv',
      mac_address: '02:00:00:00:00:00',
      redirect_uri: 'http://androidyotavideo',
      timestamp,
    });
    const response = await this.#http.request(API_ROUTES.authDevice, {
      method: HTTP_METHOD.POST,
      body: params.toString(),
      maxRedirections: 0,
      headers: {
        'User-Agent': 'okhttp/4.9.0',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
    });
    return new URLSearchParams(new URL(response.headers.location).search).get('code');
  }

  async #getAuthTokens(initToken, tokenType = TOKEN_TYPE.temporary) {
    const deviceExtras = {
      appVersion: APP_VERSION,
      sdkVersion: 28,
      supportedDrm: 'CENC,NO_DRM',
      drmSoftware: 'CENC,NO_DRM (L1)',
      advertisingId: '38999198-6b85-48d3-8e2a-0fd14b608a2e',
      supportHd: true,
      supportFullHd: true,
      supportUltraHd: true,
      supportHdr: true,
      support3d: false,
      supportDolby: true,
      supportDolbyAtmos: true,
      supportMultiAudio: true,
      supportSubtitles: true,
      supportFeaturedSubscriptions: true,
      supportMultiSubscriptions: true,
      notSupportMultiresolution: false,
      availableServices: 'Google',
      preinstalled: false,
      appStore: '',
    };

    const query = new URLSearchParams({
      deviceExtras: JSON.stringify(deviceExtras),
      deviceId: this.#deviceId,
      deviceManufacturer: DEVICE_MANUFACTURER,
      deviceModel: DEVICE_MODEL,
      deviceSoftware: this.#deviceSoftware,
      deviceType: 'TV',
      token: initToken,
      tokenType: tokenType,
    });

    const timestamp = Date.now();
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-SCRAPI-CLIENT-TS': timestamp,
      'X-SCRAPI-SIGNATURE': this.generateSignature(SECRET, timestamp, query),
    };

    const response = await this.#http.request(API_ROUTES.authToken, {
      method: HTTP_METHOD.POST,
      body: query.toString(),
      headers,
    });

    const data = JSON.parse(response.body);
    const persistentToken = data.authInfo.persistentToken;
    const sessionToken = data.authInfo.sessionToken;
    const accessKey = data.authInfo.accessKey;
    return { persistentToken, sessionToken, accessKey };
  }

  async #getPin(accessKey, sessionToken) {
    const query = new URLSearchParams({ sid: sessionToken });
    const timestamp = Date.now();
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-SCRAPI-CLIENT-TS': timestamp,
      'X-SCRAPI-SIGNATURE': this.generateSignature(accessKey, timestamp, query),
    };
    const url = API_ROUTES.authPin + '?' + query.toString();
    const response = await this.#http.request(url, { headers });
    return JSON.parse(response.body)?.pinInfo?.pin || null;
  }

  #generateDeviceSecureId(timestamp = Date.now()) {
    let value = `client_id${CLIENT_ID}device_id${this.#deviceId}`;
    value += `device_manufacturer${DEVICE_MANUFACTURER}`;
    value += `device_model${DEVICE_MODEL}`;
    value += `device_software${this.#deviceSoftware}device_typetv`;
    value += `key${DEVICE_KEY}mac_address02:00:00:00:00:00`;
    value += `timestamp${timestamp}`;
    return crypto.createHash('sha1').update(Buffer.from(value, 'utf-8')).digest('hex');
  }

  generateSignature(secret, timestamp, data) {
    let rawData = `${secret}${timestamp}`;
    for (const key of Object.keys(data)) rawData += `${key}${data[key]}`;
    return crypto.createHash('md5').update(rawData).digest('hex');
  }
}

module.exports = { OkkoAuth };
