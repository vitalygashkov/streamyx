'use strict';

const PROVIDER_TAG = 'OKKO';

const DOMAINS = {
  auth: `https://auth.playfamily.ru`,
  ctx: `https://ctx.playfamily.ru`,
};

const API_ROUTES = {
  authDevice: `${DOMAINS.auth}/dev_login`,
  authUser: `${DOMAINS.auth}/play_login`,
  authToken: `${DOMAINS.ctx}/screenapi/v1/login/android/2`,
  mergeProfiles: `${DOMAINS.ctx}/screenapi/v1/mergeprofiles/android/2`,
  profile: `${DOMAINS.ctx}/screenapi/v3/profile/android/3`,
};

module.exports = { PROVIDER_TAG, DOMAINS, API_ROUTES };
