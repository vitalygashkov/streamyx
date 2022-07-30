'use strict';

const APP_VERSION = 870;

const DOMAINS = {
  default: 'https://www.ivi.ru',
  api: 'https://api.ivi.ru',
  api2: 'https://api2.ivi.ru',
  drm: 'https://w.ivi.ru',
};

const API_ROUTES = {
  geoCheck: `${DOMAINS.api}/mobileapi/geocheck/whoami/v6/`,
  userRegister: `${DOMAINS.api}/mobileapi/user/register/storageless/v5/`,
  userValidate: `${DOMAINS.api}/mobileapi/user/validate/v5/`,
  userLoginIvi: `${DOMAINS.api}/mobileapi/user/login/ivi/v5/`,
  userLoginPhone: `${DOMAINS.api}/mobileapi/user/login/phone/v5/`,
  userRegisterPhone: `${DOMAINS.api}/mobileapi/user/register/phone/v6/`,
  userAuthCode: `${DOMAINS.api}/mobileapi/user/auth_code/v5/`,
  userAuthCodeCheck: `${DOMAINS.api}/mobileapi/user/auth_code/check/v5/`,
  userInfo: `${DOMAINS.api}/mobileapi/user/info/v5/`,
  userMerge: `${DOMAINS.api}/mobileapi/user/merge/v5/`,
  userLogout: `${DOMAINS.api}/mobileapi/user/logout/v5/`,
  appVersionInfo: `${DOMAINS.api}/mobileapi/appversioninfo/v5/`,
  license: `${DOMAINS.drm}/proxy/`,
  certificate: `${DOMAINS.drm}/certificate/`,
};

const SIGN_SUB_KEYS = {
  key: 'f10232b7bc5c7ae8f796c1332b27a18c',
  key1: 'e9044861170176cc',
  key2: 'd20890c22e02ed83',
};

module.exports = { APP_VERSION, DOMAINS, API_ROUTES, SIGN_SUB_KEYS };
