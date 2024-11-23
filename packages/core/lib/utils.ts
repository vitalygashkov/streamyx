// @ts-ignore
import 'urlpattern-polyfill';
import { logger } from './logger';

export const sanitizeString = (text: string) => {
  const forbidden = ['}', '{', '%', '>', '<', '^', ';', '`', '$', '"', '@', '='];
  let result = text;
  for (const i in forbidden) result = result.replaceAll('/', '_').replaceAll(forbidden[i], '');
  return result;
};

export const execUrlPatterns = (url: string, patterns: string[], baseUrls: string[]) => {
  const pathname: Record<string, string | undefined> = {};
  const search: Record<string, string | undefined> = {};
  for (const baseUrl of baseUrls) {
    for (const path of patterns) {
      const pattern = new URLPattern(path, baseUrl);
      const patternResult = pattern.exec(url);
      if (patternResult) {
        Object.assign(pathname, patternResult.pathname.groups);
        Object.assign(search, patternResult.search.groups);
      }
    }
  }
  return { pathname, search };
};

// Like eval but just for JS objects
export const safeEval = <T = any>(jsObjectString: string): T | null => {
  try {
    return new Function('return ' + jsObjectString)();
  } catch (e) {
    logger.error('Evaluation JS object failed. Input:');
    logger.debug(jsObjectString);
    logger.debug(e);
    return null as T;
  }
};

export const extendEpisodes = (episodesBySeasons: Map<number, Set<number>> = new Map()) => {
  const has = (episode?: number, season?: number) => {
    for (const s of episodesBySeasons.keys()) {
      for (const e of episodesBySeasons.get(s) || []) {
        const seasonEmpty = season === undefined || isNaN(season);
        const episodeEmpty = episode === undefined || isNaN(episode);
        let hasMatch = false;
        if (episodeEmpty) hasMatch = s === season;
        else hasMatch = (seasonEmpty ? isNaN(s) : s === season) && e === episode;
        if (hasMatch) return true;
      }
    }
    return false;
  };
  const set = (episode?: number, season?: number) => {
    const s = season || NaN;
    const e = episode || NaN;
    if (episodesBySeasons.has(s)) episodesBySeasons.get(s)?.add(e);
    else episodesBySeasons.set(s, new Set([e]));
  };
  const getAllEpisodeNumbers = () =>
    Array.from(episodesBySeasons.values()).flatMap((value) => Array.from(value)) as number[];
  const seasonsCount = episodesBySeasons.size;
  const episodes = getAllEpisodeNumbers();
  const episodesCount = episodes.length;
  const getMin = () => Math.min(...episodes);
  const getMax = () => Math.max(...episodes);
  return { items: episodesBySeasons, has, set, getMin, getMax, seasonsCount, episodesCount };
};

// Check if app is packed to executable (pkg or electron)
export const isExecutable = 'pkg' in process && process.pkg !== undefined;

export const parseUrlFromResource = (resource: string | URL | Request) =>
  resource instanceof Request ? new URL(resource.url) : typeof resource === 'string' ? new URL(resource) : resource;
