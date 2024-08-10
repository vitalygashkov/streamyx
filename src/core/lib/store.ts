import { join } from 'node:path';
import fs from './fs';
import { http, importCookies } from './http';

const createStorePath = (name: string) => join(process.cwd(), 'config', name, 'config.json');

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
    const data = await fs.readJson<any>(storePath).catch(() => null);
    if (data) Object.assign(state, data);
    const cookies = await getCookiesFromTxt(storePath);
    const hasCookiesInTxt = !!cookies.length;
    const hasCookiesInState = cookiesKey && data?.[cookiesKey];
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
