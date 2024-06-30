import { RunArgs } from './args';
import { logger } from './logger';
import { IHttp } from './http';
import { IPrompt } from './prompt';
import fs from './fs';

export interface StreamyxInstance {
  log: typeof logger;
  fs: typeof fs;
  http: IHttp;
  prompt: IPrompt;
}

export type Plugin<T = unknown> = (streamyx: StreamyxInstance) => PluginInstance;

export interface PluginInstance<T = unknown> {
  name: string;
  api: T;

  /**
   * Performs initialization of the plugin (e.g. loading auth data from storage or token refresh)
   */
  init?: () => Promise<void>;

  /**
   * Checks if this plugin can handle the specified URL
   */
  checkUrl: (url: string) => boolean;

  /**
   * Fetches media info list from the specified URL
   */
  fetchMediaInfo: (url: string, args: RunArgs) => Promise<MediaInfo[]>;
}

export interface MediaInfo {
  provider: string;
  movie?: { title: string };
  show?: { title: string };
  season?: { number: number };
  episode?: { number: number; title?: string };
  manifestUrl: string;
  headers?: Record<string, string>;
  drmConfig: DrmConfig | (() => Promise<DrmConfig>);
  subtitles?: any[];
  audioType?: string;
  audioLanguage?: string[];
  http2?: boolean;
}

export interface DrmConfig {
  server: string;
  headers: Record<string, string>;
  params?: object;
}
