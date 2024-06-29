import { AudioCodec, DynamicRange, VideoCodec } from 'dasha';

export type RunArgs = {
  urls: string[];

  videoQuality?: string;
  videoCodec?: VideoCodec;
  videoRange?: DynamicRange;
  videoBitrate?: number;
  videoDimension?: '2D' | '3D';

  audioCodec?: AudioCodec;
  audioChannels?: number;
  audioBitrate?: number;

  subtitleFormat: string;
  subtitleLanguages: string[];

  languages: string[];

  skipVideo: boolean;
  skipAudio: boolean;
  skipSubtitles: boolean;
  skipMux: boolean;

  episodes: {
    values: [season: number, episode: number][];
    size: number;
    set: (episode?: number, season?: number) => number;
    has: (episode?: number, season?: number) => boolean;
  };
  retry: number;
  connections: number;

  movieTemplate: string;
  episodeTemplate: string;
  hardsub: boolean;
  trimBegin?: string;
  trimEnd?: string;
  pssh?: string;
  header?: Record<string, string>;
  http2: boolean;
  debug: boolean;
  version: boolean;
  help: boolean;
};
