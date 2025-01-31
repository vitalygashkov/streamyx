import { Options } from './args';
import { IHttp } from './http';
import { IPrompt } from './prompt';
import { createStore } from './store';
import { Http, http } from './http';
import { fs } from './fs';
import { logger as log } from './log';
import { prompt } from './prompt';
import { execUrlPatterns, sanitizeString, safeEval, extendEpisodes } from './utils';

const coreUtils = { sanitizeString, execUrlPatterns, safeEval, extendEpisodes };

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
  utils: typeof coreUtils;
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
   * Fetches content metadata from URL
   */
  fetchContentMetadata: (url: string, options: Options) => Promise<ContentMetadata[]>;

  /**
   * Fetches data about content source (e.g. manifest URL, external subtitles, etc.)
   */
  fetchContentSource?: (contentId: string, options: Options) => Promise<ContentSource | null>;

  /**
   * Fetches just content DRM config (e.g. license server URL, request headers, etc.)
   */
  fetchContentDrm?: (payload: any, options: Options) => Promise<DrmConfig>;
}

export interface CommonContentMetadata {
  tag?: string;
  /**
   * Required if no `fetchContentSource` method is provided
   */
  source?: ContentSource;
}

export interface MovieMetadata extends CommonContentMetadata {
  id?: string;
  title?: string;
}

export interface EpisodeMetadata extends CommonContentMetadata {
  id?: string;
  title?: string;
  episodeNumber: number;
  seasonNumber?: number;
  episodeTitle?: string;
}

export type ContentMetadata = MovieMetadata | EpisodeMetadata;

export type ContentSource = {
  /**
   * URL of the content: manifest URL / playlist URL / direct link to media file
   */
  url: string;
  headers?: Record<string, string>;
  http2?: boolean;
  type?: 'video' | 'audio' | 'subtitle' | 'any';
  audioLanguage?: string;
  audioType?: string;
  subtitles?: any[];
  drm?: DrmConfig;
};

export type Plugin<T = unknown> = (streamyx: StreamyxCore) => PluginInstance<T>;

export const create = (name: string): StreamyxCore => ({
  log,
  http,
  prompt,
  fs,
  store: createStore(name),
  utils: coreUtils,
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

export type Service<T = undefined, K = any> = (options: T) => (core: StreamyxCore) => ServiceInstance<K>;

export type RegisterService<T extends Service> = Service<Parameters<T>[0], ReturnType<ReturnType<T>>['api']>;

export const registerService = <T extends RegisterService<T>>(service: T, options?: Parameters<T>[0]) => {
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

export type DrmConfig =
  | {
      server: string;
      headers?: Record<string, string>;
      params?: object;
      template?: string;
      http2?: boolean;
    }
  | { payload: any }
  | { keys: { kid: string; key: string }[] };
