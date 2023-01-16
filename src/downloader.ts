import { AudioTrack, CONTENT_TYPE, Manifest, parseManifest, VideoTrack } from 'dasha';
import { download } from './download';
import { logger } from './logger';
import { Http } from './http';
import fs from './fs';
import { getDecryptersPool, getDecryptionKeys } from './drm';
import { decrypt } from './mp4decrypt';
import { mux } from './ffmpeg';

class Downloader {
  private http: Http;
  _params: any;
  _config: any;
  _workDir = fs.join(fs.appDir, 'downloads');

  constructor(params: any) {
    this._params = params;
    this.http = new Http();
  }

  async start(config: any) {
    this._config = config;
    const manifest = await this.getManifest();
    const tracks = this.getTracks(manifest);
    this.setWorkDir();
    this.outputInfo();

    const pssh = manifest.getPssh();
    const { drmConfig } = this._config;

    let contentKeys = [];
    let decryptersPool: any = [];
    if (drmConfig) {
      if (pssh) {
        contentKeys = await getDecryptionKeys(pssh, drmConfig);
        if (!contentKeys.length) {
          logger.error(`Decryption keys could not be obtained`);
          process.exit(1);
          logger.debug(`Trying to decrypt through a CDM adapter (slower process)`);
          decryptersPool = await getDecryptersPool(pssh, drmConfig, this._params.connections);
        }
      } else {
        logger.warn('PSSH not found');
      }
    }

    await this.download(tracks, decryptersPool);

    if (contentKeys.length) {
      logger.info(`Starting decryption`);
      const decryptQueue = [];
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i] as any;
        if (track.type === 'text') continue;
        const key = contentKeys[0].key;
        const kid = contentKeys[0].kid;
        const input = this.getFilepath(this.getTrackFilename(track.type, track.id, 'enc'));
        const output = this.getFilepath(this.getTrackFilename(track.type, track.id, 'dec'));
        decryptQueue.push(decrypt(key, kid, input, output, true));
      }
      await Promise.all(decryptQueue);
      logger.info(`Decrypted successfully`);
    }

    if (!this._params.skipMux) {
      logger.info('Muxing');
      const inputs: any[] = [];
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i] as any;
        const isSubtitle = track.type === 'text';
        inputs.push({
          ...track,
          id: track.id || i,
          path: this.getFilepath(
            this.getTrackFilename(
              isSubtitle ? `${track.type}.${track.language}` : track.type,
              track.id,
              isSubtitle ? '' : 'dec',
              track.format
            )
          ),
        });
      }
      const output = this.getFilepath(this.getTrackFilename('', '', '', 'mkv'));
      const { trimBegin, trimEnd } = this._params;
      await mux({ inputs, output, trimBegin, trimEnd, cleanup: true });
      logger.info(`Muxed successfully`);
    }

    if (this.http.hasSessions) await this.http.destroySessions();
  }

  async getManifest() {
    const response = await this.http.fetch(this._config.manifestUrl);
    const text = await response.text();
    const manifest: any = parseManifest(text);
    if (!manifest) {
      logger.error(`Unable to parse manifest`);
      process.exit(1);
    }
    const url = new URL(response.url);
    const manifestUrl = url.origin + url.pathname;
    if (!manifest.baseUrls?.length) manifest.addBaseUrl(manifestUrl);
    return manifest;
  }

  getTracks(manifest: Manifest) {
    const height = this._params.videoHeight;
    const video = manifest.getVideoTrack(height);
    const audios = manifest.getAudioTracks(this._params.audioLanguages).map((audio) => ({
      ...audio,
      language: (audio as any).language || this._config.audioLanguage,
    }));
    const subtitles = manifest.getSubtitleTracks(this._params.subtitleLanguages);
    if (this._config.subtitles) {
      subtitles.push(
        ...this._config.subtitles.map((subtitle: any) => ({
          type: 'text',
          label: subtitle.label,
          language: subtitle.language,
          format: subtitle.format,
          segments: [{ url: subtitle.url }],
        }))
      );
    }
    this._params.videoHeight = (video as any).qualityLabel.replace('p', '');
    return [video, ...audios, ...subtitles].filter((track: any) => {
      if (track.type === 'video' && this._params.skipVideo) return false;
      if (track.type === 'audio' && this._params.skipAudio) return false;
      if (track.type === 'text' && this._params.skipSubtitles) return false;
      return true;
    });
  }

  setWorkDir() {
    const title = this._config.show?.title || this._config.movie?.title;
    let folderName = `${title.replaceAll(' ', '.')}`;
    if (this._config.season?.number)
      folderName += `.S${this._config.season.number.toString().padStart(2, '0')}`;
    if (this._config.audioType) folderName += `.${this._config.audioType.toUpperCase()}`;
    folderName += `.${this._params.videoHeight}p`;
    folderName += `.${this._config.provider}`;
    folderName += `.WEB-DL`;
    folderName += `.x264`;
    folderName = this.sanitizeFilename(folderName).replaceAll('..', '.');
    this._workDir = fs.join(fs.appDir, 'downloads', folderName);
  }

  async download(tracks: any[], decryptersPool: any[]) {
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      const isSubtitle = track.type === 'text';
      const filename = this.getTrackFilename(
        isSubtitle ? `${track.type}.${track.language}` : track.type,
        track.id,
        isSubtitle ? '' : decryptersPool.length ? 'dec' : 'enc',
        track.format
      );
      const filepath = this.getFilepath(filename);
      const urls = track.segments.map((s: any) => s.url);
      const connections = this._params.connections;

      let trackInfo = '';
      if (track.type === 'text') trackInfo += 'SUBTITLES';
      else trackInfo += track.type.toUpperCase();
      if (track.type === 'video') {
        trackInfo += ` ∙ ${track.width}x${track.height}`;
        trackInfo += ` ∙ ${track.bitrate} Mbps`;
      }
      if (track.type === 'audio') {
        trackInfo += ` ∙ ${track.language?.toUpperCase()}`;
        if (track.label) trackInfo += ` (${track.label})`;
        trackInfo += ` ∙ ${track.audioSamplingRate} kHz`;
        trackInfo += ` ∙ ${track.bitrate} Kbps`;
      }
      if (track.type === 'text') {
        trackInfo += ` ∙ ${track.language.toUpperCase()}`;
        if (track.label) trackInfo += ` (${track.label})`;
      }
      if (track.type === 'video' || track.type === 'audio') trackInfo += ` ∙ ${track.size} MiB`;
      logger.info(trackInfo);
      const logPrefix = logger.getPrefix('info');

      try {
        await download(urls, {
          filepath,
          connections,
          headers: this._config.headers,
          http2: this._config.http2,
          logger,
          logPrefix,
          decryptersPool,
          codec: track.codecs?.split('.')?.[0],
          contentType: track.type,
        });
      } catch (e: any) {
        logger.error(`Download failed: ${e.message}`);
        process.exit(1);
      }
    }
  }

  outputInfo() {
    let msg = `${this._config.show?.title || this._config.movie?.title} ∙ `;
    if (this._config.season?.number) msg += `S${this._config.season.number}, `;
    if (this._config.episode?.number) msg += `E${this._config.episode.number}`;
    if (this._config.episode?.title) msg += ` ∙ ${this._config.episode.title}`;
    msg = msg.replaceAll(' ∙  ∙ ', ' ∙ ');
    logger.info(msg);
  }

  async #downloadSubtitles() {
    const allowSubtitles = !this._params.skipSubtitles;
    const hasSubtitles = this._config.subtitles?.length;
    if (!allowSubtitles || !hasSubtitles) return;
    const { subtitles } = this._config;
    for (const subtitle of subtitles) {
      const { url, language, format } = subtitle;
      try {
        const response = await this.http.fetch(url);
        const content = await response.text();
        const filename = this.getTrackFilename('', '', language, format);
        await fs.writeText(this.getFilepath(filename), content);
      } catch (e: any) {
        logger.error(`Failed to download subtitles`);
        logger.debug(e.message);
      }
    }
  }

  get filename() {
    const { movie, show, season, episode, provider, audioType } = this._config;
    const { movieTemplate, episodeTemplate, videoHeight } = this._params;
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
      .replaceAll('  ', ' ');
    filename = this.sanitizeFilename(filename).replaceAll('..', '.');
    return filename;
  }

  sanitizeFilename(text: string) {
    return text.replace(/[^a-zа-я0-9.-]/gi, '');
  }

  getTrackFilename(type: string, id: number | string, suffix = '', format?: string) {
    let filename = this.filename + '.';
    if (type) filename += type + '.';
    if (id) filename += id + '.';
    if (suffix) filename += suffix + '.';
    filename += format || this.getExtensionByContent(type);
    return filename;
  }

  getFilepath(filename: string) {
    return fs.join(this._workDir, filename);
  }

  getExtensionByContent(type: string) {
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

export { Downloader };
