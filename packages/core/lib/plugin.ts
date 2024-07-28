import { RunArgs } from './args';
import { logger } from './logger';
import { IHttp } from './http';
import { IPrompt } from './prompt';
import fs from './fs';
import { createStore } from './store';

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
}

/**
 * @deprecated Use `StreamyxCore` instead
 */
export type StreamyxInstance = StreamyxCore;

export type Plugin<T = unknown> = (streamyx: StreamyxInstance) => PluginInstance;

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
  pattern?: string;

  api: T;

  /**
   * Performs initialization of the plugin (e.g. loading auth data from storage or token refresh)
   */
  init?: () => void | Promise<void>;

  /**
   * Checks if this plugin can handle the specified URL
   *
   * @deprecated Use `pattern` instead
   */
  checkUrl: (url: string) => boolean;

  /**
   * Fetches media info list from the specified URL
   */
  fetchMediaInfo: (url: string, args: RunArgs) => Promise<MediaInfo[]>;
}

export interface MediaInfo {
  url: string;
  provider?: string;
  movie?: { title: string };
  show?: { title: string };
  season?: { number: number };
  episode?: { number: number; title?: string };
  headers?: Record<string, string>;
  drmConfig?: DrmConfig | (() => Promise<DrmConfig>);
  subtitles?: any[];
  audioType?: string;
  audioLanguage?: string;
  http2?: boolean;
}

export interface DrmConfig {
  server: string;
  headers: Record<string, string>;
  params?: object;
}
