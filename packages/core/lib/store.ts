import { join } from 'node:path';
import { renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fs, initDir } from './fs';
import { http } from './http';
import { getSettings } from './settings';
import { importCookies } from './cookies';
import { logger } from './log';

const createStorePath = (name: string) => {
  const dir = initDir(join(getSettings().servicesDir, name));
  return join(dir, 'config.json');
};

const getCookiesFromTxt = async (dir: string) => {
  const cookiesTxtPath = fs.join(dir, 'cookies.txt');
  const cookies = await importCookies(cookiesTxtPath);
  if (cookies.length) await fs.delete(cookiesTxtPath);
  return cookies;
};

export const createStorage = async (name: string) => {
  const storagePath = createStorePath(name);

  const serializable = (obj: any) => {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value !== 'function') result[key] = value;
    }
    return result;
  };

  const clear = (obj: any) => {
    for (const [key, value] of Object.entries(obj)) {
      const isFn = typeof value === 'function';
      if (!isFn) delete obj[key];
    }
    return obj;
  };

  const storage: Record<string, any> = {
    async load() {
      const data = (await fs.readJson<any>(storagePath).catch(() => {})) || {};
      for (const [key, value] of Object.entries(data)) storage[key] = value;
      // Automatically load cookies from cookies.txt
      const cookies = await getCookiesFromTxt(storagePath);
      if (!!cookies.length) await storage.set('cookies', cookies);
    },
    async get(key: string) {
      const data = (await fs.readJson<any>(storagePath).catch(() => {})) || {};
      return data[key];
    },
    async set(key: string, value: any) {
      storage[key] = value;
      await fs.writeJson(storagePath, serializable(storage));
    },
    async delete(key: string) {
      delete storage[key];
      await fs.writeJson(storagePath, serializable(storage));
    },
    async clear() {
      clear(storage);
      await fs.writeJson(storagePath, {});
    },
    async append(items: Record<string, any>) {
      for (const [key, value] of Object.entries(items)) storage[key] = value;
      await fs.writeJson(storagePath, serializable(storage));
    },
    items() {
      return serializable(storage);
    },
    async save(items?: Record<string, any>) {
      clear(storage);
      const data = items || serializable(storage);
      for (const [key, value] of Object.entries(data)) storage[key] = value;
      await fs.writeJson(storagePath, data);
    },
  };

  const localStorage = new LocalStorage(storagePath);
  await localStorage.load();

  return { storage, localStorage };
};

export const createStore = (name: string) => {
  const storePath = createStorePath(name);
  logger.debug(`Store path: ${storePath}`);
  const state = {} as Record<string, any>;
  const getState = async <T = any>(cookiesKey: string | null = 'cookies') => {
    const data = (await fs.readJson<any>(storePath).catch(() => {})) || {};
    Object.assign(state, data);
    const cookies = await getCookiesFromTxt(storePath);
    const hasCookiesInTxt = !!cookies.length;
    const hasCookiesInState = cookiesKey && data[cookiesKey];
    if (hasCookiesInTxt) http.setCookies(cookies);
    else if (hasCookiesInState) http.setCookies(data[cookiesKey]);
    return state as T;
  };
  const setState = async <T = Record<string, any>>(data?: T) => {
    Object.assign(state, data || {});
    logger.debug(`Saving state...`);
    logger.debug(data || state);
    await fs.writeJson(storePath, data || state);
  };
  return { state, getState, setState };
};
