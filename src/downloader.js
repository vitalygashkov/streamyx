'use strict';

const { join } = require('path');
const { parseManifest, CONTENT_TYPE } = require('dasha');
const { download } = require('segasync');
const { logger } = require('./logger');
const { Http } = require('./network');
const { Files } = require('./files');
const { getDecryptionKeys, decryptFile } = require('./drm');
const { mux } = require('./muxer');

class Downloader {
  #args;
  #config;
  #http;
  #files;

  constructor(args) {
    this.#args = args;
    this.#http = new Http();
    this.#files = new Files();
  }

  async start(config) {
    this.#config = config;
    const manifest = await this.getManifest();
    const tracks = this.getTracks(manifest);
    this.setWorkDir();
    this.outputInfo(tracks);

    await this.#downloadSubtitles();
    await this.download(tracks);

    const { drmConfig } = this.#config;
    if (drmConfig) {
      logger.info(`Starting decryption`);
      const pssh = manifest.getPssh();
      const keys = await getDecryptionKeys(pssh, drmConfig);
      const hasDecryptionKeys = keys.some((key) => !!key.key);
      const decryptQueue = [];
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track.type === 'text' || !hasDecryptionKeys) continue;
        const key = keys[0].key;
        const kid = keys[0].kid;
        const input = this.getFilepath(this.getTrackFilename(track.type, track.id, 'enc'));
        const output = this.getFilepath(this.getTrackFilename(track.type, track.id, 'dec'));
        decryptQueue.push(decryptFile(key, kid, input, output, true));
      }
      await Promise.all(decryptQueue);
      logger.info(`Decrypted successfully`);
    }

    logger.info('Muxing');
    const inputs = [];
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const isSubtitle = track.type === 'text';
      inputs.push({
        ...track,
        path: this.getFilepath(
          this.getTrackFilename(
            isSubtitle ? `${track.type}.${track.language}` : track.type,
            track.id,
            isSubtitle ? '' : drmConfig ? 'dec' : 'enc',
            track.format
          )
        ),
      });
    }
    const output = this.getFilepath(this.getTrackFilename('', '', '', 'mkv'));
    const { trimBegin, trimEnd } = this.#args;
    await mux({ inputs, output, trimBegin, trimEnd, cleanup: true });
    logger.info(`Muxed successfully`);

    this.#http.disconnect();
  }

  async getManifest() {
    const response = await this.#http.request(this.#config.manifestUrl);
    const manifest = parseManifest(response.body);
    if (!manifest) {
      logger.error(`Unable to parse manifest`);
      process.exit(1);
    }
    if (!manifest.baseUrls?.length)
      manifest.addBaseUrl(this.#config.manifestUrl.replace('Manifest.mpd', ''));
    return manifest;
  }

  getTracks(manifest) {
    const height = parseInt(this.#args.videoHeight);
    const video = manifest.getVideoTrack(height);
    const audios = manifest.getAudioTracks(this.#args.audioLanguages);
    const subtitles = manifest.getSubtitleTracks(this.#args.subtitleLanguages);
    this.#args.videoHeight = this.calculateHeightByWidth(video.width);
    return [video, ...audios, ...subtitles].filter((track) => {
      if (track.type === 'video' && this.#args.skipVideo) return false;
      if (track.type === 'audio' && this.#args.skipAudio) return false;
      if (track.type === 'text' && this.#args.skipSubtitles) return false;
      return true;
    });
  }

  calculateHeightByWidth(width) {
    switch (width) {
      case 7680:
        return 4320;
      case 4096:
      case 3840:
        return 2160;
      case 1920:
        return 1080;
      case 1280:
        return 720;
      case 1024:
      case 720:
        return 576;
      case 854:
        return 480;
      case 640:
        return 360;
    }
  }

  setWorkDir() {
    const title = this.#config.show?.title || this.#config.movie?.title;
    let folderName = `${title.replaceAll(' ', '.')}`;
    if (this.#config.season?.number)
      folderName += `.S${this.#config.season.number.toString().padStart(2, '0')}`;
    if (this.#config.audioType) folderName += `.${this.#config.audioType.toUpperCase()}`;
    folderName += `.${this.#args.videoHeight}p`;
    folderName += `.${this.#config.provider}`;
    folderName += `.WEB-DL`;
    folderName += `.x264`;
    folderName = this.sanitizeFilename(folderName);
    const path = join(process.cwd(), 'downloads', folderName);
    this.#files.setWorkDir(path);
  }

  async download(tracks) {
    const queue = [];
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const isSubtitle = track.type === 'text';
      const filename = this.getTrackFilename(
        isSubtitle ? `${track.type}.${track.language}` : track.type,
        track.id,
        isSubtitle ? '' : 'enc',
        track.format
      );
      const filepath = join(this.#files.workDir, filename);
      const urls = track.segments.map((s) => s.url);
      const partSize = this.#args.partSize;
      const logPrefix = logger.getPrefix('info');
      queue.push(download(urls, { filepath, partSize, logger, logPrefix }));
    }
    try {
      await Promise.all(queue);
    } catch (e) {
      logger.error(`Download failed: ${e.message}`);
      process.exit(1);
    }
  }

  outputInfo(tracks) {
    const track = tracks[0];
    let msg = `${this.#config.show?.title || this.#config.movie?.title} • `;
    if (this.#config.season?.number) msg += `S${this.#config.season.number}:`;
    if (this.#config.episode?.number) msg += `E${this.#config.episode.number}`;
    if (this.#config.episode?.title) msg += ` • ${this.#config.episode.title}`;
    if (track.quality) msg += ` • ${track.quality}`;
    if (track.hdr) msg += ` • HDR`;
    msg += ` • ${track.size} MB`;
    msg = msg.replaceAll(' •  • ', ' • ');
    logger.info(msg);
  }

  async #downloadSubtitles() {
    const allowSubtitles = !this.#args.skipSubtitles;
    const hasSubtitles = this.#config.subtitles?.length;
    if (!allowSubtitles || !hasSubtitles) return;
    const { subtitles } = this.#config;
    for (const subtitle of subtitles) {
      const { url, language, format } = subtitle;
      try {
        const response = await this.#http.request(url, { http2: false });
        const content = response.body;
        const filename = this.getTrackFilename('', '', language, format);
        await this.#files.write(filename, content);
      } catch (e) {
        logger.error(`Failed to download subtitles`);
        logger.debug(e.message);
      }
    }
  }

  get filename() {
    const { movie, show, season, episode, provider, audioType } = this.#config;
    const { movieTemplate, episodeTemplate, videoHeight } = this.#args;
    let filename = '';
    if (movie)
      filename = movieTemplate
        .replace('{title}', movie.title.replaceAll(' ', '.'))
        .replace('{audioType}.', audioType ? audioType.toUpperCase() + '.' : '');
    else
      filename = episodeTemplate
        .replace('{show}', show.title.replaceAll(' ', '.'))
        .replace('S{s}', season?.number ? 'S' + season.number.toString().padStart(2, '0') : '')
        .replace('{s}', season?.number ? season.number.toString().padStart(2, '0') : '')
        .replace('{e}', episode?.number ? episode.number.toString().padStart(2, '0') : '')
        .replace('{title}', episode?.title ? episode.title.replaceAll(' ', '.') : '')
        .replace('{audioType}.', audioType ? audioType.toUpperCase() + '.' : '');
    filename = filename
      .replace('{quality}', videoHeight + 'p')
      .replace('{provider}', provider || 'UND')
      .replace('{format}', 'WEB-DL')
      .replace('{codec}', 'x264')
      .replaceAll('..', '.')
      .replaceAll('  ', ' ');
    filename = this.sanitizeFilename(filename);
    return filename;
  }

  sanitizeFilename(text) {
    return text.replaceAll(':', '');
  }

  getTrackFilename(type, id, suffix = '', format) {
    let filename = this.filename + '.';
    if (type) filename += type + '.';
    if (id) filename += id + '.';
    if (suffix) filename += suffix + '.';
    filename += format || this.getExtensionByContent(type);
    return filename;
  }

  getFilepath(filename) {
    return join(this.#files.workDir, filename);
  }

  getExtensionByContent(type) {
    switch (type) {
      case CONTENT_TYPE.text:
        return 'vtt';
      case CONTENT_TYPE.audio:
        return 'm4a';
      case CONTENT_TYPE.video:
      default:
        return 'mp4';
    }
  }
}

module.exports = { Downloader };
