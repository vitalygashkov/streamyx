import { join } from 'path';
import fs from './fs';

export enum SettingsVideoQuality {
  Lowest = 'lowest',
  HD1080p = '1080p',
  HD720p = '720p',
  SD576p = '576p',
  SD480p = '480p',
  SD360p = '360p',
  SD240p = '240p',
  SD144p = '144p',
  SD80p = '80p',
  Highest = 'highest',
}

export enum SettingsVideoDynamicRange {
  High = 'HDR',
  Standart = 'SDR',
}

export enum SettingsAudioQuality {
  Lowest = 'lowest',
  Highest = 'highest',
}

export enum SubtitleStoreType {
  Embedded = 'embedded',
  External = 'external',
}

export interface Settings {
  askForOptionsBeforeDownload: boolean;
  defaultDownloadPath: string;
  preferredVideoQuality: SettingsVideoQuality;
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
}

const defaultSettings: Settings = {
  askForOptionsBeforeDownload: true,
  defaultDownloadPath: join(fs.homeDir, 'Downloads'),
  preferredVideoQuality: SettingsVideoQuality.Highest,
  preferredAudioQuality: SettingsAudioQuality.Highest,
  preferredAudioLanguages: [],
  preferredSubtitleLanguages: [],
  preferHdr: true,
  prefer3d: false,
  preferHardsub: false,
  downloadProxy: null,
  metadataProxy: null,
  numberOfConnections: 16,
  storeSubtitlesAs: SubtitleStoreType.Embedded,
  movieFilenameTemplate: '{title}.{audioType}.{quality}.{provider}.{format}.{codec}',
  seriesFilenameTemplate:
    '{show}.S{s}E{e}.{title}.{audioType}.{quality}.{provider}.{format}.{codec}',
};

export const getSettingsPath = async () => {
  const configDir = join(process.cwd(), '.config');
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
