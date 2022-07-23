'use strict';

const crypto = require('node:crypto');
const { join } = require('path');
const { Http, HTTP_METHOD } = require('../../network');
const { Files } = require('../../files');
const {
  getRandomElements,
  getRandomInRange,
  generateMacAddress,
  question,
} = require('../../utilities');
const { API_ROUTES } = require('./okko.constants');
const { logger } = require('../../logger');

const WORK_DIR = join(process.cwd(), 'providers', 'okko');
const CONFIG_NAME = 'auth.json';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '1234567890';
const LETTERS_AND_DIGITS = LETTERS + DIGITS;

class OkkoAuth {
  #http;
  #files;
  #config;

  #deviceId;
  #deviceModel;
  #randomSystemId;
  #androidVersion;
  #randomUserId;
  #deviceSoftware;
  #macAddress;
  #userAgent;

  #deviceSecureId;

  constructor() {
    this.#http = new Http();
    this.#files = new Files();
    this.#files.setWorkDir(WORK_DIR);
    this.#config = {};

    this.#deviceId = crypto.randomUUID();
    this.#deviceModel = `SM-${getRandomElements(LETTERS_AND_DIGITS, 6).join('')}`;
    this.#randomSystemId = getRandomElements(LETTERS_AND_DIGITS, 6).join('');
    this.#androidVersion = `${getRandomInRange(4, 10)}.0`;
    this.#randomUserId = getRandomInRange(10000000, 40000000);
    this.#deviceSoftware = `Android ${this.#androidVersion} ${this.#randomSystemId} se.infra `;
    this.#deviceSoftware += `DID[${this.#deviceId}|${this.#randomUserId}|${this.#deviceId}]`;
    this.#macAddress = generateMacAddress();
    this.#userAgent = `Dalvik/2.1.0 (Linux; U; Android ${this.#androidVersion}; `;
    this.#userAgent += `${this.#deviceModel} Build/${this.#randomSystemId})`;
  }

  async login(username, password) {
    logger.debug(`Loading auth config`);
    await this.#loadConfig(username, password);
    logger.debug(`Requesting credentials`);
    if (!this.#config.username || !this.#config.password) await this.#requestCredentials();

    let timestamp = new Date().getTime();

    let deviceSecureIdRaw = `client_idandroiddevice_id${this.#deviceId}`;
    deviceSecureIdRaw += `device_manufacturersamsungdevice_model${this.#deviceModel}`;
    deviceSecureIdRaw += `device_software${this.#deviceSoftware}`;
    deviceSecureIdRaw += `device_typetabletkeyae307f3f-78ce-4389-8b35-200113d4bf4d`;
    deviceSecureIdRaw += `mac_address${this.#macAddress}timestamp${timestamp}`;

    this.#deviceSecureId = crypto.createHash('sha1').update(deviceSecureIdRaw).digest('hex');

    const payload = {
      client_id: 'android',
      device_id: this.#deviceId,
      device_manufacturer: 'samsung',
      device_model: this.#deviceModel,
      device_secure_id: this.#deviceSecureId,
      device_software: this.#deviceSoftware,
      device_type: 'tablet',
      mac_address: this.#macAddress,
      redirect_uri: 'http://androidyotavideo',
      timestamp,
    };

    const response = await this.#http.request(API_ROUTES.authDevice, {
      method: HTTP_METHOD.POST,
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(response.body);
    const tokenCode = '';

    timestamp = new Date().getTime();

    return {};
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
}

module.exports = { OkkoAuth };
