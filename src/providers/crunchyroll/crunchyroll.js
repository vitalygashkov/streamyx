'use strict';

const { logger } = require('../../logger');
const { Http, HTTP_METHOD } = require('../../network');
const { Provider } = require('../provider');
const { CrunchyrollAuth } = require('./crunchyroll.auth');
const { CrunchyrollApi } = require('./crunchyroll.api');

class Crunchyroll extends Provider {
  #args;
  #http;
  #auth;
  #api;

  constructor(args) {
    super();
    this.#args = args;
    this.#http = new Http();
    this.#auth = new CrunchyrollAuth();
    this.#api = new CrunchyrollApi(this.#http, this.#auth);
  }

  async init() {
    const response = await this.#auth.login();
    this.#http.setHeader('authorization', `Bearer ${response.accessToken}`);
    return response;
  }

  async getConfigList() {
    const { url } = this.#args;
    const episodeId = url.split('watch/')[1]?.split('/')[0];
    const showId = url.split('series/')[1]?.split('/')[0];
    const episodeIds = [];

    if (episodeId) episodeIds.push(episodeId);
    if (showId) {
      // TODO: Extract episode ids from show
    }

    const metadataQueue = [];
    for (const episodeId of episodeIds) metadataQueue.push(this.getMetadata(episodeId));
    const metadataList = await Promise.all(metadataQueue);

    this.#http.disconnect();
    return metadataList;
  }

  async getMetadata(episodeId) {
    const object = await this.#api.getObject(episodeId);
    const episode = object.items[0];
    const rawMetadata = episode.episode_metadata;

    if (!episode.playback && rawMetadata.is_premium_only) {
      logger.error(`Premium subscription required`);
      process.exit(1);
    }
    const playbackUrl = episode.playback;
    const response = await this.#http.request(playbackUrl, { http2: false });
    const playbackData = JSON.parse(response.body);

    // const isSubbed = rawMetadata.is_subbed;
    // const isDubbed = rawMetadata.is_dubbed;
    // const subtitleLocales = rawMetadata.subtitle_locales;
    const subtitles = [];
    for (const subtitle of Object.values(playbackData.subtitles)) {
      const containsSelectedSubtitles =
        !this.#args.subtitleLanguages?.length ||
        this.#args.subtitleLanguages?.some((lang) => subtitle.locale.includes(lang));
      if (!containsSelectedSubtitles) continue;
      subtitles.push({ url: subtitle.url, language: subtitle.locale, format: subtitle.format });
    }

    const streams = [];
    for (const streamType of Object.keys(playbackData.streams)) {
      if (streamType.includes('trailer')) continue;
      if (!streamType.includes('drm_adaptive_dash')) continue;
      const subStreams = Object.values(playbackData.streams[streamType]);
      const modifiedStreams = subStreams
        .filter((stream) => {
          const hasHardsub = !!stream.hardsub_locale;
          const needHardsub = !!this.#args.hardsub;
          const matchHardsubLang = this.#args.subtitleLanguages?.some((lang) =>
            stream.hardsub_locale.includes(lang)
          );
          if (needHardsub && hasHardsub && matchHardsubLang) return true;
          else return !needHardsub && !hasHardsub;
        })
        .map((stream) => ({ ...stream, type: streamType }));
      streams.push(...modifiedStreams);
    }

    const stream = streams[0];
    const manifestUrl = stream.url;

    const audioType = playbackData.audio_locale === 'ja-JP' ? 'JAPANESE' : 'DUBBED';

    const assetId = stream.url.split('assets/p/')[1]?.split('_,')[0];
    const drmParamsPayload = {
      user_id: this.#auth.accountId,
      session_id: Math.floor(Math.random() * 100000000000000).toString(),
      asset_id: assetId,
      accounting_id: 'crunchyroll',
    };
    const drmParamsResponse = await this.#http.request(`https://pl.crunchyroll.com/drm/v1/auth`, {
      method: HTTP_METHOD.POST,
      body: JSON.stringify(drmParamsPayload),
    });
    const drmParams = JSON.parse(drmParamsResponse.body);

    const drmConfig = {
      server: `https://lic.drmtoday.com/license-proxy-widevine/cenc/`,
      headers: {
        'dt-custom-data': drmParams.custom_data,
        'x-dt-auth-token': drmParams.token,
      },
    };

    const config = {
      provider: 'CR',
      manifestUrl,
      subtitles,
      drmConfig,
      audioType,
    };

    const isMovie = !rawMetadata.episode_number;
    if (isMovie) {
      config.movie = { title: this.sanitizeString(rawMetadata.series_title) };
    } else {
      config.show = { title: this.sanitizeString(rawMetadata.series_title) };
      config.season = { number: rawMetadata.season_number };
      config.episode = {
        number: rawMetadata.episode_number,
        title: this.sanitizeString(episode.title),
      };
    }

    return config;
  }

  sanitizeString(value) {
    return value?.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, '');
  }
}

module.exports = { Crunchyroll };
