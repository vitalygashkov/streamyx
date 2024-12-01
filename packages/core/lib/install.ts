import path from 'node:path';
import { load } from '@streamyx/loader';
import { createStorage } from './store';
import { Http } from './http';
import { execUrlPatterns, extendEpisodes, safeEval, sanitizeString } from './utils';
import { logger } from './log';
import { PluginInstance } from './service';

export const install = async (pluginPath: string): Promise<PluginInstance> => {
  const pluginName = path.parse(pluginPath).name;
  const pluginDir = path.dirname(pluginPath);

  const app = { version: process.version };
  const storage = await createStorage(pluginName);
  const http = new Http();
  const common = { sanitizeString, execUrlPatterns, safeEval, extendEpisodes };
  const context = { app, storage, http, logger, question: prompt, common };

  const script = await load(pluginPath, { dirname: pluginDir, context });

  return script.exports;
};
