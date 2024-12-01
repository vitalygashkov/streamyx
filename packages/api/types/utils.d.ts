export type AppUtils = {
  sanitizeString: (text: string) => string;

  execUrlPatterns: (
    url: string,
    patterns: string[],
    baseUrls: string[]
  ) => {
    pathname: Record<string, string | undefined>;
    search: Record<string, string | undefined>;
  };

  safeEval: <T = any>(jsObjectString: string) => T | null;

  extendEpisodes: (episodesBySeasons?: Map<number, Set<number>>) => {
    items: Map<number, Set<number>>;
    has: (episode?: number, season?: number) => boolean;
    set: (episode?: number, season?: number) => void;
    getMin: () => number;
    getMax: () => number;
    seasonsCount: number;
    episodesCount: number;
  };
};
