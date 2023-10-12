import { join } from 'path';
import fs from './fs';

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

export interface Settings {
  askForOptionsBeforeDownload: boolean;
  defaultDownloadPath: string;
  preferredVideoQuality: VideoQuality;
  preferredAudioQuality: string;
  preferredAudioLanguages: string[];
  preferredSubtitleLanguages: string[];
  preferHdr: boolean;
  prefer3d: boolean;
  preferHardsub: boolean;
  downloadProxy: string | null;
  metadataProxy: string | null;
  numberOfConnections: number;
  storeSubtitlesAs: SubtitleStoreType;
  movieFilenameTemplate: string;
  seriesFilenameTemplate: string;
  chromePath: string | null;
}

const defaultSettings: Settings = {
  askForOptionsBeforeDownload: true,
  defaultDownloadPath: join(fs.homeDir, 'Downloads'),
  preferredVideoQuality: VIDEO_QUALITY.highest,
  preferredAudioQuality: AUDIO_QUALITY.highest,
  preferredAudioLanguages: [],
  preferredSubtitleLanguages: [],
  preferHdr: true,
  prefer3d: false,
  preferHardsub: false,
  downloadProxy: null,
  metadataProxy: null,
  numberOfConnections: 16,
  storeSubtitlesAs: SUBTITLE_STORE_TYPE.embedded,
  movieFilenameTemplate: '{title}.{audioType}.{quality}.{provider}.{format}.{codec}',
  seriesFilenameTemplate:
    '{show}.S{s}E{e}.{title}.{audioType}.{quality}.{provider}.{format}.{codec}',
  chromePath: null,
};

export const getSettingsPath = async () => {
  const configDir = join(process.cwd(), 'config');
  await fs.createDir(configDir);
  const settingsPath = join(configDir, 'settings.json');
  if (!fs.exists(settingsPath)) await fs.writeJson(settingsPath, defaultSettings);
  return settingsPath;
};

export const loadSettings = async (): Promise<Settings> => {
  const settingsPath = await getSettingsPath();
  return fs.readJson(settingsPath);
};

export const saveSettings = async (settings: Partial<Settings>) => {
  const settingsPath = await getSettingsPath();
  const currentSettings = loadSettings();
  return fs.writeJson(settingsPath, {
    ...currentSettings,
    ...settings,
  });
};
