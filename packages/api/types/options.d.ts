import type { VideoCodec, DynamicRange, AudioCodec } from 'dasha';

export type Options = {
  videoQuality?: string;
  videoCodecs?: VideoCodec[];
  videoRange?: DynamicRange;
  videoBitrate?: number;
  videoDimension?: '2D' | '3D';

  audioCodecs?: AudioCodec[];
  audioChannels?: number;
  audioBitrate?: number;

  subtitleFormat?: string;
  subtitleLanguages?: string[];

  languages?: string[];

  skipVideo?: boolean;
  skipAudio?: boolean;
  skipSubtitles?: boolean;
  skipMux?: boolean;

  experimentalSelectTracks?: boolean;

  episodes?: Map<number, Set<number>>;
  retry?: number;
  connections?: number;
  proxy?: string | null;
  proxyMeta?: string | null;
  proxyMedia?: string | null;

  movieTemplate?: string;
  episodeTemplate?: string;
  hardsub?: boolean;
  trimBegin?: string;
  trimEnd?: string;

  pssh?: string;
  drmTemplate?: string;
  header?: Record<string, string>;

  http2?: boolean;
  keys?: { kid: string; key: string }[];
  debug?: boolean;
};
