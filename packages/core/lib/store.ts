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
    return data as T;
  };
  const setState = async <T = Record<string, any>>(data?: T) => {
    Object.assign(state, data || {});
    await fs.writeJson(storePath, data || state);
  };
  return { state, getState, setState };
};
