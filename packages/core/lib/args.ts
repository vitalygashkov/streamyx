import { AudioCodec, DynamicRange, VideoCodec } from 'dasha';

export type RunArgs = {
  urls: string[];

  videoQuality?: string;
  videoCodecs?: VideoCodec[];
  videoRange?: DynamicRange;
  videoBitrate?: number;
  videoDimension?: '2D' | '3D';

  audioCodecs?: AudioCodec[];
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
    set: (episode?: number | undefined, season?: number | undefined) => number;
    has: (episode?: number | undefined, season?: number | undefined) => boolean;
    getMin: () => number;
    getMax: () => number;
  };
  retry: number;
  connections: number;
  proxy: string | null;
  proxyMeta: string | null;
  proxyMedia: string | null;

  movieTemplate: string;
  episodeTemplate: string;
  hardsub: boolean;
  trimBegin?: string;
  trimEnd?: string;
  pssh?: string;
  header?: Record<string, string>;
  http2: boolean;
  keys?: { kid: string; key: string }[];
  debug: boolean;
  version: boolean;
  help: boolean;
};
