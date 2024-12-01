import type { AppHttp } from './http';
import type { AppLogger } from './logger';
import type { AppPrompt } from './prompt';
import type { AppStorage } from './storage';
import type { AppUtils } from './utils';

export type App = {
  log: AppLogger;
  http: AppHttp;
  prompt: AppPrompt;
  store: AppStorage;
  utils: AppUtils;
};
