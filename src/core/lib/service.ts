import { RunArgs } from './args';
import { IHttp } from './http';
import { IPrompt } from './prompt';
import { createStore } from './store';
import { Http } from './http';
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
  fetchMediaInfo: (url: string, args: RunArgs) => Promise<MediaInfo[]>;
}

export type Plugin<T = unknown> = (streamyx: StreamyxCore) => PluginInstance<T>;

export const create = (name: string): StreamyxCore => ({
  log,
  http: new Http(),
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
  core.store = createStore(name);
  core.log.debug(`Service registered: ${name}`);
  instance.core = core;
  return instance as ServiceInstance<ReturnType<ReturnType<T>>['api']> & {
    api: ReturnType<ReturnType<T>>['api'];
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
}

export interface DrmConfig {
  server: string;
  headers: Record<string, string>;
  params?: object;
  template?: string;
  http2?: boolean;
}
