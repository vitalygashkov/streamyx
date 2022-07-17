'use strict';

const { Provider } = require('../provider');
const { Http } = require('../../network');
const { logger } = require('../../logger');
const { KinopoiskAuth } = require('./kinopoisk.auth');
const { KinopoiskApi } = require('./kinopoisk.api');
const { DOMAINS, PROVIDER_TAG } = require('./kinopoisk.constants');

class Kinopoisk extends Provider {
  #args;
  #http;
  #auth;
  #api;

  constructor(args) {
    super(args);
    this.#args = args;
    this.#http = new Http();
    this.#auth = new KinopoiskAuth();
    this.#api = new KinopoiskApi(this.#http);
  }

  api() {
    return this.#api;
  }

  async init() {
    const response = await this.#auth.login();
    this.#http.setCookies(response.cookies);
    return response;
  }

  async getConfigList() {
    const configList = [];
    const { url } = this.#args;
    const id = url.split('film/')[1]?.split('?')[0] || url.split('rt=')[1]?.split('&')[0];
    const metadata = await this.#api.fetchMetadata(id);

    const isMovie = metadata.contentType.includes('movie');
    const isShow = metadata.contentType.includes('series');

    if (isMovie) {
      const movieConfig = await this.#getMovieConfig(id, metadata);
      configList.push(movieConfig);
    }

    if (isShow) {
      const seasonNumber = parseInt(url.split('season=')[1]?.split('&')[0]);
      const episodeNumber = parseInt(url.split('episode=')[1]?.split('&')[0]);
      const filteredEpisodes = await this.#filterEpisodes(id, seasonNumber, episodeNumber);
      const queue = [];
      for (const episode of filteredEpisodes) queue.push(this.#getEpisodeConfig(episode, metadata));
      const configs = await Promise.all(queue);
      configList.push(...configs);
    }

    return configList;
  }

  async #getMovieConfig(id, movie) {
    const { manifest, drmConfig } = await this.#getStreamConfig(id);
    return {
      provider: PROVIDER_TAG,
      movie: { title: movie.originalTitle },
      manifest,
      drmConfig,
    };
  }

  async #filterEpisodes(showId, seasonNumber, episodeNumber) {
    const children = await this.#api.fetchChildren(showId);
    const filteredSeasons = children.seasons.filter((season) => {
      if (seasonNumber) return season.number === seasonNumber;
      else if (this.#args.seasons) return this.#args.seasons?.includes(season.number);
      else return true;
    });
    const filteredEpisodes = filteredSeasons
      .map((season) =>
        season.episodes
          .filter((episode) => {
            if (episodeNumber) return episode.number === episodeNumber;
            else if (this.#args.episodes) return this.#args.episodes?.includes(episode.number);
            else return true;
          })
          .map((episode) => ({ ...episode, season }))
      )
      .flat();
    return filteredEpisodes;
  }

  async #getEpisodeConfig(episode, show) {
    const { contentId } = episode;
    const { manifest, drmConfig } = await this.#getStreamConfig(contentId);
    return {
      provider: PROVIDER_TAG,
      show: { title: show.originalTitle },
      season: { number: episode.season.number },
      episode: { number: episode.number, title: episode.originalTitle },
      manifest,
      drmConfig,
    };
  }

  async #getStreamConfig(contentId) {
    const streamsMetadata = await this.#api.fetchStreams(contentId);
    if (streamsMetadata.licenseStatus === 'REJECTED') {
      logger.error(`Can't fetch streams metadata. ${streamsMetadata.watchingRejection.details}`);
      process.exit(1);
    }
    const stream = streamsMetadata.streams.find((stream) => stream.streamType === 'DASH');
    if (!stream) {
      logger.error(`Can't find suitable stream`);
      process.exit(1);
    }
    const subtitles = stream.subtitles.map(({ url, language, title }) => ({
      url,
      language,
      title,
      format: url.includes('.ass') ? 'ass' : url.includes('.vtt') ? 'vtt' : 'srt',
    }));

    const response = await this.#http.request(stream.uri);
    const manifest = response.body;

    let drmConfig = null;
    if (streamsMetadata.drmRequirement === 'DRM_REQUIRED') {
      drmConfig = {
        server: stream.drmConfig.servers['com.widevine.alpha'],
        individualizationServer: stream.drmConfig.servers['com.widevine.alpha'],
        headers: {
          ...this.#http.headers,
          'Content-Type': 'application/json',
          Referer: DOMAINS.default,
        },
        params: stream.drmConfig.requestParams,
      };
    }

    return { manifest, drmConfig, subtitles };
  }
}

module.exports = { Kinopoisk };
