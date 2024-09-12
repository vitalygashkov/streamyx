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

// Like global eval but just for JS objects
export const safeEval = <T = any>(jsObjectString: string): T | null => {
  const jsonString = jsObjectString
    .trim()
    .replace(/(\w+):/g, '"$1":')
    .replace(/'/g, '"');
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    logger.error('JSON parsing failed');
    logger.debug(jsonString);
    logger.debug(e);
    return null as T;
  }
};
