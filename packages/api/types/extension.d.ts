export interface Extension {
  /**
   * Extension name (e.g. Netflix, Prime Video, Apple TV+, etc.)
   */
  name: string;

  /**
   * Short tag which will be used in filename (e.g. NF, AMZN, ATVP, etc.)
   */
  tag?: string;

  /**
   * Logo icon URL
   */
  icon?: string;

  /**
   * Substring pattern to match URL host handled by this plugin
   */
  match?: string;

  /**
   * Performs initialization of extension (e.g. loading auth data from storage or token refresh)
   */
  init?: () => void | Promise<void>;

  /**
   * Fetches content metadata from URL
   */
  fetchContentMetadata: (
    url: string,
    options: Options,
  ) => Promise<ContentMetadata[]>;

  /**
   * Fetches data about content source (e.g. manifest URL, external subtitles, etc.)
   */
  fetchContentSource?: (
    contentId: string,
    options: Options,
  ) => Promise<ContentSource | null>;

  /**
   * Fetches just content DRM config (e.g. license server URL, request headers, etc.)
   */
  fetchContentDrm?: (payload: any, options: Options) => Promise<DrmConfig>;
}

export interface CommonContentMetadata {
  tag?: string;
  /**
   * Required if no `fetchContentSource` method is provided
   */
  source?: ContentSource;
}

export interface MovieMetadata extends CommonContentMetadata {
  id?: string;
  title?: string;
}

export interface EpisodeMetadata extends CommonContentMetadata {
  id?: string;
  title?: string;
  episodeNumber: number;
  seasonNumber?: number;
  episodeTitle?: string;
}

export type ContentMetadata = MovieMetadata | EpisodeMetadata;

export type ContentSource = {
  /**
   * URL of the content: manifest URL / playlist URL / direct link to media file
   */
  url: string;
  headers?: Record<string, string>;
  http2?: boolean;
  type?: 'video' | 'audio' | 'subtitle' | 'any';
  audioLanguage?: string;
  audioType?: string;
  subtitles?: any[];
  drm?: DrmConfig;
};

export type DrmConfig =
  | {
      server: string;
      headers?: Record<string, string>;
      params?: object;
      template?: string;
      http2?: boolean;
    }
  | { payload: any };
