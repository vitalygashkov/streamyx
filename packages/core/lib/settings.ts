import { join } from 'node:path';
import { fs, BaseDirectory, initDir } from './fs';
import { logger } from './logger';

export type VideoQuality = (typeof VIDEO_QUALITY)[keyof typeof VIDEO_QUALITY];
export const VIDEO_QUALITY = {
  lowest: 'lowest',
  hd1080p: '1080p',
  hd720p: '720p',
  sd576p: '576p',
  sd480p: '480p',
  sd360p: '360p',
  sd240p: '240p',
  sd144p: '144p',
  sd80p: '80p',
  highest: 'highest',
} as const;

export type VideoDynamicRange = (typeof VIDEO_DYNAMIC_RANGE)[keyof typeof VIDEO_DYNAMIC_RANGE];
export const VIDEO_DYNAMIC_RANGE = { high: 'HDR', standart: 'SDR' } as const;

export type AudioQuality = (typeof AUDIO_QUALITY)[keyof typeof AUDIO_QUALITY];
export const AUDIO_QUALITY = { lowest: 'lowest', highest: 'highest' } as const;

export type SubtitleStoreType = (typeof SUBTITLE_STORE_TYPE)[keyof typeof SUBTITLE_STORE_TYPE];
export const SUBTITLE_STORE_TYPE = { embedded: 'embedded', external: 'external' } as const;

export type Theme = (typeof THEME)[keyof typeof THEME];
export const THEME = { dark: 'dark', light: 'light', system: 'system' } as const;

export interface Settings {
  // askForOptionsBeforeDownload: boolean;
  downloadDir: string;
  servicesDir: string;
  binariesDir: string;
  drmDir: string;
  tempDir: string;
  language: string;
  theme: Theme;
  // preferredVideoQuality: VideoQuality;
  // preferredAudioQuality: string;
  // preferredAudioLanguages: string[];
  // preferredSubtitleLanguages: string[];
  // preferHdr: boolean;
  // prefer3d: boolean;
  preferHardsub: boolean;
  retry: number;
  connections: number;
  proxy: string | null;
  proxyMeta: string | null;
  proxyMedia: string | null;
  // storeSubtitlesAs: SubtitleStoreType;
  movieFilenameTemplate: string;
  seriesFilenameTemplate: string;
  chromePath: string | null;
  bounds?: { x: number; y: number; width: number; height: number };
  services: Record<string, string>;
}

const getDefaultLanguage = () => {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  if (locale.startsWith('ru')) return 'ru';
  else return 'en';
};

export const defaultSettings: Settings = {
  // askForOptionsBeforeDownload: true,
  downloadDir: BaseDirectory.Download,
  servicesDir: initDir(join(BaseDirectory.AppData, 'services')),
  binariesDir: initDir(join(BaseDirectory.AppData, 'bin')),
  drmDir: initDir(join(BaseDirectory.AppData, 'drm')),
  tempDir: BaseDirectory.Temp,
  language: getDefaultLanguage(),
  theme: THEME.system,
  // preferredVideoQuality: VIDEO_QUALITY.highest,
  // preferredAudioQuality: AUDIO_QUALITY.highest,
  // preferredAudioLanguages: [],
  // preferredSubtitleLanguages: [],
  // preferHdr: true,
  // prefer3d: false,
  preferHardsub: false,
  retry: 5,
  connections: 16,
  proxy: null,
  proxyMeta: null,
  proxyMedia: null,
  // storeSubtitlesAs: SUBTITLE_STORE_TYPE.embedded,
  movieFilenameTemplate: '{title}.{audioType}.{quality}.{tag}.{format}.{codec}',
  seriesFilenameTemplate: '{title}.S{s}E{e}.{episodeTitle}.{audioType}.{quality}.{tag}.{format}.{codec}',
  chromePath: null,
  bounds: undefined,
  services: {},
};

const getSettingsPath = async () => {
  const settingsPath = join(BaseDirectory.AppData, 'settings.json');
  if (!fs.exists(settingsPath)) await fs.writeJson(settingsPath, defaultSettings);
  return settingsPath;
};

const settings = defaultSettings;

export const getSettings = (): Readonly<Settings> => settings;

const validateSettings = (values: Partial<Settings>) => {
  const isInvalid = Object.keys(values).length !== Object.keys(defaultSettings).length;
  for (const [key, value] of Object.entries(defaultSettings)) {
    if (!(key in values) || values[key as keyof Settings] === undefined) values[key as keyof Settings] = value;
  }
  for (const key of Object.keys(values)) {
    if (!(key in defaultSettings)) delete values[key as keyof Settings];
  }
  if (isInvalid) saveSettings(values);
  return values as Settings;
};

export const loadSettings = async (customPath?: string): Promise<Settings> => {
  const settingsPath = customPath || (await getSettingsPath());
  const exists = fs.exists(settingsPath);
  if (!exists) logger.info('Settings file not found');
  const newSettings = await fs.readJson<Settings>(settingsPath).catch((e) => {
    logger.error('Failed to load settings');
    logger.warn('Fallback to default settings...');
    logger.debug(e.message);
    return defaultSettings;
  });
  Object.assign(settings, newSettings);
  return validateSettings(settings);
};

export const saveSettings = async (settings: Partial<Settings>, customPath?: string) => {
  const settingsPath = customPath || (await getSettingsPath());
  const currentSettings = await loadSettings();
  return fs.writeJson(settingsPath, {
    ...currentSettings,
    ...settings,
  });
};

const printObject = (obj: any, depth = 0) => {
  for (const [key, value] of Object.entries(obj)) {
    const keyString = ('    '.repeat(depth) + key).padEnd(30);
    if (typeof value === 'object' && value !== null) {
      console.log(keyString);
      printObject(value, depth + 1);
    } else {
      const valueString = typeof value === 'string' ? `"${value}"` : JSON.stringify(value || '').replace('""', '');
      console.log(`${keyString} ${valueString}`);
    }
  }
};

export const showSettings = async () => {
  const settings = await loadSettings();
  printObject(settings);
  console.log(`\nEdit settings.json here: ${BaseDirectory.AppData}`);
  return settings;
};

export const setParameter = async (parameter: string) => {
  const [key, value] = parameter.split('=');
  await saveSettings({ [key]: value });
  console.log('Settings updated');
};
