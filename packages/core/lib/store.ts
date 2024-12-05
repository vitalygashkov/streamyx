import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
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

class LocalStorage implements Storage {
  items: Map<string, any>;
  filePath: string;

  constructor(filePath: string) {
    this.items = new Map();
    this.filePath = filePath;

    process.on('SIGINT', () => {
      this.save();
      process.exit(0); // Ensure the app exits
    });

    process.on('SIGTERM', () => {
      this.save();
      process.exit(0);
    });

    // Catch uncaught exceptions
    process.on('uncaughtException', () => {
      this.save();
      process.exit(1);
    });

    // Optional: Catch exit event (not ideal for async operations)
    process.on('exit', () => this.save());
  }

  async load() {
    try {
      const data = await readFile(this.filePath, { encoding: 'utf8' });
      this.items = this.parse(data);
    } catch (e) {
      this.items = new Map();
    }
    // Automatically load cookies from cookies.txt
    // const cookies = await getCookiesFromTxt(this.filePath);
    // if (!!cookies.length) this.setItem('cookies', cookies);
  }

  get length(): number {
    return this.items.size;
  }

  clear() {
    this.items.clear();
  }

  getItem(key: string): string | null {
    return this.items.get(key) || null;
  }

  key(index: number) {
    return Array.from(this.items.keys())[index];
  }

  removeItem(key: string) {
    this.items.delete(key);
  }

  setItem(key: string, value: string) {
    this.items.set(key, value);
  }

  parse(text: string) {
    const items = JSON.parse(text);
    const entries = Object.entries(items);
    return new Map(entries);
  }

  stringify() {
    const data = Object.fromEntries(this.items.entries());
    return JSON.stringify(data);
  }

  save() {
    writeFileSync(this.filePath, this.stringify());
  }
}

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

  const localStorage = new LocalStorage(storagePath);
  await localStorage.load();

  return { storage, localStorage };
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
