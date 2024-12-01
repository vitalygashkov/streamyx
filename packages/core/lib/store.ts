import { join } from 'node:path';
import { fs, initDir } from './fs';
import { http } from './http';
import { getSettings } from './settings';
import { importCookies } from './cookies';

const createStorePath = (name: string) => {
  // TODO: Make new store filename format
  // const storePath = join(getSettings().servicesDir, `${name}.json`);
  // if (fs.exists(storePath)) return storePath;

  // Old store support
  const oldStoreDir = initDir(join(getSettings().servicesDir, name));
  const oldStorePath = join(oldStoreDir, 'config.json');
  // Migrate from old store to new store
  // if (fs.exists(oldStorePath)) {
  //   fs.readText(oldStorePath).then((data) => fs.writeText(storePath, data));
  // }
  return oldStorePath;
};

const getCookiesFromTxt = async (dir: string) => {
  const cookiesTxtPath = fs.join(dir, 'cookies.txt');
  const cookies = await importCookies(cookiesTxtPath);
  if (cookies.length) await fs.delete(cookiesTxtPath);
  return cookies;
};

export const createStorage = async (name: string) => {
  const storageDir = initDir(join(getSettings().servicesDir, name));
  const storagePath = join(storageDir, `${name}.storage.json`);

  const configPath = join(storageDir, 'config.json');
  if (fs.exists(configPath)) await fs.rename(configPath, storagePath);

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

  return storage;
};

export const createStore = (name: string) => {
  const storePath = createStorePath(name);
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
    await fs.writeJson(storePath, data || state);
  };
  return { state, getState, setState };
};
