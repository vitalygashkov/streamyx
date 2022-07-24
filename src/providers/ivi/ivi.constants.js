'use strict';

const APP_VERSION = 870;

const DOMAINS = {
  default: 'https://www.ivi.ru',
};

const API_ROUTES = {
  userRegister: `${DOMAINS.default}/mobileapi/user/register/storageless/v5/`,
  geoCheck: `${DOMAINS.default}/mobileapi/geocheck/whoami/v6/`,
};

module.exports = { APP_VERSION, DOMAINS, API_ROUTES };
