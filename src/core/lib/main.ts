import { createStore } from './store';
import { StreamyxCore } from './plugin';
import { Http } from './http';
import { default as fs } from './fs';
import { logger as log } from './logger';
import { prompt } from './prompt';

export const create = (name: string): StreamyxCore => ({
  log,
  http: new Http(),
  prompt,
  fs,
  store: createStore(name),
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
