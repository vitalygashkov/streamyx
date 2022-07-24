'use strict';

const { Http, HTTP_METHOD } = require('../../network');
const { IviAuth } = require('./ivi.auth');
const { DOMAINS, API_ROUTES } = require('./ivi.constants');

class IviApi {
  #http;
  #auth;

  constructor(http = new Http()) {
    this.#http = http;
    this.#auth = new IviAuth(http);
  }

  async auth(username, password) {
    await this.#auth.login(username, password);
  }

  async userRegister() {
    const response = await this.#http.request(API_ROUTES.userRegister, {
      method: HTTP_METHOD.POST,
    });
    const data = JSON.parse(response.body);
    const { session } = data.result;
    return session;
  }

  async geoCheck() {
    const response = await this.#http.request(API_ROUTES.geoCheck);
    const { result } = JSON.parse(response.body);
    return {
      countryCode: result['country_code'],
      countryName: result['country_name'],
      timestamp: result['timestamp'],
      countryPlaceId: result['country_place_id'],
      userAbBucket: result['user_ab_bucket'],
      actualAppVersion: result['actual_app_version'],
    };
  }
}

module.exports = { IviApi };
