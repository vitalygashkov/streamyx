'use strict';

const PROVIDER_TAG = 'KP';
const API_VERSION = 12;
const SERVICE_ID = 25;

const DOMAINS = {
  default: 'https://hd.kinopoisk.ru',
  passport: 'https://passport.yandex.ru',
  api: 'https://api.ott.kinopoisk.ru',
};

const API_ROUTES = {
  preAuth: `${DOMAINS.passport}/auth`,
  loginAuth: `${DOMAINS.passport}/registration-validations/auth/multi_step/start`,
  passwordAuth: `${DOMAINS.passport}/registration-validations/auth/multi_step/commit_password`,
  challengeSubmit: `${DOMAINS.passport}/registration-validations/auth/challenge/submit`,
  validatePhoneById: `${DOMAINS.passport}/registration-validations/auth/validate_phone_by_id`,
  phoneConfirmCodeSubmit: `${DOMAINS.passport}/registration-validations/phone-confirm-code-submit`,
  phoneConfirmCode: `${DOMAINS.passport}/registration-validations/phone-confirm-code`,
  challengeCommit: `${DOMAINS.passport}/registration-validations/auth/challenge/commit`,
};

const USER_AGENTS = {
  tizen:
    'Mozilla/5.0 (Linux; U; Tizen 2.0; en-us) AppleWebKit/537.1 (KHTML, like Gecko) Mobile TizenBrowser/2.0',
};

module.exports = {
  PROVIDER_TAG,
  API_VERSION,
  SERVICE_ID,
  DOMAINS,
  API_ROUTES,
  USER_AGENTS,
};
