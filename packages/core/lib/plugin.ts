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
  isValidUrl: (url: string) => boolean;
  init: () => Promise<void>;
  getConfigList: (url: string, args: RunArgs) => Promise<DownloadConfig[]>;
}

export interface DownloadConfig {
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
