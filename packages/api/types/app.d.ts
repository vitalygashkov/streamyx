import type { AppLogger } from './logger';
import type { AppPrompt } from './prompt';
import type { AppUtils } from './utils';

export type App = {
  log: AppLogger;
  prompt: AppPrompt;
  utils: AppUtils;
};
