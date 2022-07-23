'use strict';

const PROVIDER_TAG = 'OKKO';
const USER_AGENT = 'Okko Android client';
const APP_VERSION = '3.7.6';
const CLIENT_ID = 'android_tv';
const DEVICE_MANUFACTURER = 'NVIDIA';
const DEVICE_MODEL = 'SHIELD Android TV';
const DEVICE_SOFTWARE =
  'Android 9 PPR1.180610.011 mobile-u64-80204 DID[{softwareId}|unknown|{softwareId}]';
const DEVICE_KEY = 'f2b5b09a-fc5d-11e7-8450-fea9aa178066';
const SECRET = '27051703';

const TOKEN_TYPE = {
  temporary: 'TEMP',
  persistent: 'PERSISTENT',
};

const DOMAINS = {
  auth: `https://auth.playfamily.ru`,
  ctx: `https://ctx.playfamily.ru`,
};

const API_ROUTES = {
  authDevice: `${DOMAINS.auth}/dev_login`,
  authUser: `${DOMAINS.auth}/play_login`,
  authToken: `${DOMAINS.ctx}/screenapi/v1/login/androidtv3/1`,
  authPin: `${DOMAINS.ctx}/screenapi/v1/pin/androidtv3/1`,
  mergeProfiles: `${DOMAINS.ctx}/screenapi/v1/mergeprofiles/android/2`,
  profile: `${DOMAINS.ctx}/screenapi/v3/profile/android/3`,
  movieCard: `${DOMAINS.ctx}/screenapi/v2/moviecard/web/1`,
  preparePlayback: `${DOMAINS.ctx}/screenapi/v2/prepareplayback/web/1`,
};

const ELEMENT_TYPE = {
  MOVIE: 'MOVIE',
  TV: 'SERIAL',
  FRANCHISE: 'MP_MOVIE',
  SEASON: 'SEASON',
  EPISODE: 'EPISODE',
};

const QUALITY = {
  FULL_HD: 'Q_FULL_HD',
  HD: 'Q_HD',
  SD: 'Q_SD',
};

module.exports = {
  PROVIDER_TAG,
  USER_AGENT,
  APP_VERSION,
  CLIENT_ID,
  DEVICE_MANUFACTURER,
  DEVICE_MODEL,
  DEVICE_SOFTWARE,
  DEVICE_KEY,
  SECRET,
  TOKEN_TYPE,
  DOMAINS,
  API_ROUTES,
  ELEMENT_TYPE,
  QUALITY,
};
