process.title = 'streamyx';

import { RunArgs, loadArgs } from './src/args';
import { logger } from './src/logger';
import { validateUrl, useCliPrompt } from './src/utils';
import { printDecryptionKeys } from './src/drm';
import { downloader } from './src/downloader';
import { loadSettings } from './src/settings';
import { getProviderByUrl } from './src/providers';
import { Provider } from './src/providers/provider';

const initializeProvider = async (url: string, args: RunArgs) => {
  const provider = getProviderByUrl(url, args);
  if (!provider) {
    logger.error(`Suitable provider not found`);
    process.exit(1);
  }
  await provider.init();
  return provider;
};

const download = async (url: string, provider: Provider, args: RunArgs) => {
  const configs = await provider.getConfigList(url);
  for (const config of configs) {
    if (typeof config.drmConfig === 'function') config.drmConfig = await config.drmConfig();
    await downloader.start(args, config);
  }
};

export const startWithArgs = async (args: RunArgs) => {
  await loadSettings();
  logger.setLogLevel(args.debug ? 'debug' : 'info');
  const urls = args.urls.length ? args.urls : [''];
  for (const rawUrl of urls) {
    if (args.pssh) {
      await printDecryptionKeys(rawUrl, args.pssh, args.headers);
      break;
    }

    const url = await validateUrl(rawUrl);
    const provider = await initializeProvider(url, args);
    await download(url, provider, args);
  }
};

export const checkIfCalledViaCLI = (args: string[]) => !!args && args.length > 2;

const isCLI = checkIfCalledViaCLI(process.argv);
if (isCLI) {
  useCliPrompt();
  startWithArgs(loadArgs());
}
