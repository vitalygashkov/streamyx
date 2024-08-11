// @ts-ignore
import 'urlpattern-polyfill';

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
