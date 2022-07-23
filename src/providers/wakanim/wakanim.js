'use strict';

const { logger } = require('../../logger');
const { Http } = require('../../network');
const { Provider } = require('../provider');
const { WakanimAuth } = require('./wakanim.auth');
const { WakanimApi } = require('./wakanim.api');

class Wakanim extends Provider {
  #args;
  #http;
  #auth;
  #api;

  constructor(args) {
    super(args);
    this.#args = args;
    this.#http = new Http();
    this.#auth = new WakanimAuth();
    this.#api = new WakanimApi(this.#http);
  }

  async init() {
    const response = await this.#auth.login();
    this.#http.setHeader('authorization', `Bearer ${response.accessToken}`);
    return response;
  }

  async getConfigList() {
    const { url } = this.#args;
    const episodeId = parseInt(url.split('episode/')[1]?.split('/')[0]);
    const showId = parseInt(url.split('show/')[1]?.split('/')[0]);
    const seasonId = parseInt(url.split('season/')[1]?.split('/')[0]);
    const episodeIds = [];

    if (episodeId) episodeIds.push(episodeId);
    if (showId) {
      const show = await this.#api.getShow(showId);
      const seasons = seasonId ? [show.seasons.find((s) => s.idSeason === seasonId)] : show.seasons;
      episodeIds.push(...this.getEpisodeIdsBySeasons(seasons, show));
    }

    const metadataQueue = [];
    for (const episodeId of episodeIds) metadataQueue.push(this.getMetadata(episodeId));
    const metadataList = await Promise.all(metadataQueue);

    this.#http.disconnect();
    return metadataList;
  }

  async getMetadata(episodeId) {
    const episode = await this.#api.getEpisodeStreamingInfo(episodeId);
    const subtitles = episode.subtitles?.map((subtitle) => ({
      url: subtitle.url,
      language: subtitle.lang,
      format: subtitle.format,
      isDefault: subtitle.isDefault,
    }));

    const manifestUrl = new URL(episode.episodeSVODStreaming);
    const kid = manifestUrl.searchParams.get('kid');
    const token = manifestUrl.searchParams.get('token').replace('Bearer=', '');
    const drmConfig = {
      server: `https://wakatest.keydelivery.northeurope.media.azure.net/Widevine/?kid=${kid}&token=${token}`,
    };

    const { audioLanguage } = this.getSeasonLanguages(episode.season);
    const audioType = audioLanguage === 'jp' ? 'Japanese' : 'Dubbing';

    return {
      provider: 'WKN',
      show: { title: this.getShowName(episode.show) },
      season: { number: this.getSeasonNumber(episode.season) },
      episode: { number: this.getEpisodeNumber(episode), title: this.getEpisodeTitle(episode) },
      manifestUrl,
      subtitles,
      drmConfig,
      audioType,
    };
  }

  getEpisodeIdsBySeasons(seasons, show) {
    const episodeIds = [];
    const selectedSeasonNumbers = this.#args.seasons || null;
    const selectedEpisodeNumbers = this.#args.episodes || null;
    const selectedAudioLanguages = this.#args.audioLanguage || null;

    for (const season of seasons) {
      const seasonNumber = this.getSeasonNumber(season, false);
      const seasonPart = this.getSeasonPart(season);

      const containsSelectedSeason =
        !selectedSeasonNumbers || selectedSeasonNumbers.some((s) => s === seasonNumber);
      if (!containsSelectedSeason) continue;

      const containsSelectedEpisodes =
        !selectedEpisodeNumbers ||
        season.episodes.some((e) => selectedEpisodeNumbers.includes(e.numero));
      if (!containsSelectedEpisodes) continue;

      const { audioLanguage } = this.getSeasonLanguages(season);
      const containsSelectedAudioLanguages =
        !selectedAudioLanguages || selectedAudioLanguages.includes(audioLanguage);
      if (!containsSelectedAudioLanguages) continue;

      const selectedEpisodes = season.episodes.filter((e) =>
        selectedEpisodeNumbers.includes(e.numero)
      );

      episodeIds.push(...selectedEpisodes.map((e) => e.id));
    }

    const total = episodeIds.length;
    if (total) logger.info(`${this.getShowName(show)} • ${total} Episode${total !== 1 && 's'}`);
    else logger.info(`No item matches found`);

    return episodeIds;
  }

  getShowName(show) {
    const rawShowName = show.internalName || show.seoOtherNames?.split(', ')[0] || show.name;
    return rawShowName
      .replace(/[/\\#,+$~% "`:;*?<>{}|^@']/g, ' ')
      .replace(/ +(?= )/g, '')
      .replace(' S2 ', ' ')
      .replace(' S3 ', ' ')
      .replace(' S4 ', ' ')
      .replace(' S5 ', ' ')
      .trim();
  }

  getSeasonNumber(season, twoDigit = false) {
    let seasonNumber = season.name.split(' ')[1].trim();
    if (isNaN(parseInt(seasonNumber)) && season.name.match(/Saison|Season|Staffel|Сезон/))
      seasonNumber = season.name.split(' - ')[0].trim();
    if (isNaN(parseInt(seasonNumber))) seasonNumber = season.name.split(' ')[0].trim();
    if (isNaN(parseInt(seasonNumber))) seasonNumber = '';
    if (seasonNumber && twoDigit)
      seasonNumber = seasonNumber.length === 1 ? `0${seasonNumber}` : seasonNumber;
    return twoDigit ? seasonNumber : parseInt(seasonNumber);
  }

  getSeasonPart(season) {
    const hasSeasonPart = season.name.match(/часть|Cour/);
    const seasonPart = season.name?.split(/часть |Cour /)?.[1]?.split(/[ )]/)?.[0];
    return hasSeasonPart && seasonPart ? parseInt(seasonPart) : null;
  }

  getEpisodeNumber(episode, twoDigit = false) {
    if (!twoDigit) return episode.numero;
    return episode.numero.toString().length === 1
      ? `0${episode.numero}`
      : episode.numero.toString();
  }

  getEpisodeTitle(episode) {
    return !episode.title.match(/Episode|Серия/) ? episode.title : null;
  }

  getSeasonLanguages(season) {
    const seasonName = season.name;
    let audioLanguage = 'xx';
    let subtitleLanguage = 'xx';
    if (seasonName.includes('VF')) {
      audioLanguage = 'fr';
      subtitleLanguage = 'fr';
    } else if (seasonName.includes('VOSTFR')) {
      audioLanguage = 'jp';
      subtitleLanguage = 'fr';
    } else if (seasonName.includes('sub')) {
      audioLanguage = 'jp';
      subtitleLanguage = 'en';
    } else if (seasonName.includes('dub')) {
      audioLanguage = 'en';
      subtitleLanguage = 'en';
    } else if (seasonName.includes('Dt.')) {
      audioLanguage = 'de';
      subtitleLanguage = 'de';
    } else if (seasonName.includes('OmU.')) {
      audioLanguage = 'jp';
      subtitleLanguage = 'de';
    } else if (seasonName.includes('суб')) {
      audioLanguage = 'jp';
      subtitleLanguage = 'ru';
    } else if (seasonName.match(/озв|дуб/)) {
      audioLanguage = 'ru';
      subtitleLanguage = 'ru';
    }
    return { audioLanguage, subtitleLanguage };
  }
}

module.exports = { Wakanim };
