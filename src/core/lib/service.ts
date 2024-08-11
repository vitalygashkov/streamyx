import { RunArgs } from './args';
import { logger } from './logger';
import { IHttp } from './http';
import { IPrompt } from './prompt';
import fs from './fs';
import { createStore } from './store';
import { execUrlPatterns, sanitizeString } from './utils';

export interface StreamyxCore {
  /**
   * Basic logger
   */
  log: typeof logger;

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

export type ServiceInstance<T> = PluginInstance<T>;

export const defineService = <T = undefined, K = undefined>(
  service: (options: T) => (core: StreamyxCore) => ServiceInstance<K>
) => {
  return service;
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
