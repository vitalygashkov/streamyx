import { RunArgs } from './args';
import { IHttp } from './http';
import { IPrompt } from './prompt';
import { createStore } from './store';
import { Http, http } from './http';
import { default as fs } from './fs';
import { logger as log } from './logger';
import { prompt } from './prompt';
import { execUrlPatterns, sanitizeString } from './utils';

export interface StreamyxCore {
  /**
   * Basic logger
   */
  log: typeof log;

  /**
   * Common file system utilities
   */
  fs: typeof fs;

  /**
   * Basic HTTP client
   */
  http: IHttp;

  /**
   * Prompt for user input (e.g. login/password)
   */
  prompt: IPrompt;

  /**
   * Store for persistent data (e.g. cookies, tokens, etc.)
   */
  store: ReturnType<typeof createStore>;

  /**
   * Utility functions
   */
  utils: {
    sanitizeString: typeof sanitizeString;
    execUrlPatterns: typeof execUrlPatterns;
  };
}

export interface PluginInstance<T = unknown> {
  /**
   * Streaming service name (e.g. Netflix, Prime Video, Apple TV+, etc.)
   */
  name: string;

  /**
   * Short tag (e.g. NF, AMZN, ATVP, etc.)
   */
  tag?: string;

  /**
   * Logo icon URL
   */
  icon?: string;

  /**
   * Substring pattern to match URL host handled by this plugin
   */
  match?: string;

  api?: T;

  /**
   * Performs initialization of the plugin (e.g. loading auth data from storage or token refresh)
   */
  init?: () => void | Promise<void>;

  /**
   * Fetches media info list from the specified URL
   */
  fetchMediaInfo: (url: string, args: RunArgs) => Promise<(MediaInfo | AsyncMediaInfo)[]>;
}

export type Plugin<T = unknown> = (streamyx: StreamyxCore) => PluginInstance<T>;

export const create = (name: string): StreamyxCore => ({
  log,
  http,
  prompt,
  fs,
  store: createStore(name),
  utils: { sanitizeString, execUrlPatterns },
});

export type ServiceInstance<T> = PluginInstance<T>;

export const defineService = <T = undefined, K = undefined>(
  service: (options: T) => (core: StreamyxCore) => ServiceInstance<K>
) => {
  return service;
};

export type RegisteredService<A = unknown> = {
  name: string;
  instance: ServiceInstance<A>;
  core: StreamyxCore;
};

export type Service<T = undefined, K = any> = (
  options: T
) => (core: StreamyxCore) => ServiceInstance<K>;

export type RegisterService<T extends Service> = Service<
  Parameters<T>[0],
  ReturnType<ReturnType<T>>['api']
>;

export const registerService = <T extends RegisterService<T>>(
  service: T,
  options?: Parameters<T>[0]
) => {
  const core = create('streamyx');
  const instance = service(options)(core) as ServiceInstance<ReturnType<ReturnType<T>>['api']> & {
    core: StreamyxCore;
  };
  const name = instance.name;
  core.http = new Http();
  core.store = createStore(name);
  instance.core = core;
  return instance as ServiceInstance<ReturnType<ReturnType<T>>['api']> & {
    api: NonNullable<ReturnType<ReturnType<T>>['api']>;
    core: StreamyxCore;
  };
};

export const withDefaultArgs = (args: Partial<RunArgs>): RunArgs => {
  return {
    urls: args.urls || [],

    subtitleFormat: args.subtitleFormat || '',
    subtitleLanguages: args.subtitleLanguages || [],

    languages: args.languages || [],

    skipVideo: args.skipVideo || false,
    skipAudio: args.skipAudio || false,
    skipSubtitles: args.skipSubtitles || false,
    skipMux: args.skipMux || false,

    episodes: args.episodes || {
      values: [],
      size: NaN,
      set: (episode?: number | undefined, season?: number | undefined) => NaN,
      has: (episode?: number | undefined, season?: number | undefined) => false,
      getMin: () => NaN,
      getMax: () => NaN,
    },
    retry: args.retry || NaN,
    connections: args.connections || NaN,
    proxy: args.proxy || null,
    proxyMeta: args.proxyMeta || null,
    proxyMedia: args.proxyMedia || null,

    movieTemplate: args.movieTemplate || '',
    episodeTemplate: args.episodeTemplate || '',
    hardsub: args.hardsub || false,
    http2: args.http2 || false,
    debug: args.debug || false,
    version: args.version || false,
    help: args.help || false,
  };
};

export interface MediaInfo {
  url: string;
  headers?: Record<string, string>;

  title?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  tag?: string;

  drmConfig?: DrmConfig | (() => Promise<DrmConfig>);

  type?: 'video' | 'audio' | 'subtitle' | 'any';
  subtitles?: any[];
  audioType?: string;
  audioLanguage?: string;
  http2?: boolean;

  onDownloadFinished?: () => Promise<void>;
}

export type AsyncMediaInfo = () => Promise<MediaInfo>;

export interface DrmConfig {
  server: string;
  headers: Record<string, string>;
  params?: object;
  template?: string;
  http2?: boolean;
}
