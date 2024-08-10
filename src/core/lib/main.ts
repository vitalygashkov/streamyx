import { createStore } from './store';
import { StreamyxCore } from './plugin';
import { Http } from './http';
import { default as fs } from './fs';
import { logger as log } from './logger';
import { prompt } from './prompt';
import { sanitizeString, execUrlPatterns } from './utils';

export const create = (name: string): StreamyxCore => ({
  log,
  http: new Http(),
  prompt,
  fs,
  store: createStore(name),
  utils: { sanitizeString, execUrlPatterns },
});

export { default as fs } from './fs';
export * from './http';
export * from './settings';
export * from './logger';
export * from './browser';
export * from './bin';
export * from './prompt';
export * from './spinner';

export * from './args';
export * from './plugin';
