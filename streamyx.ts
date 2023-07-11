process.title = 'streamyx';

import { getProcessedArgs, printHelp, printVersion } from './src/args';
import { logger } from './src/logger';
import { parseMainDomain, validateUrl } from './src/utils';
import { printDecryptionKeys } from './src/drm';
import { createProvider } from './src/providers';
import { Downloader } from './src/downloader';

const streamyx: any = {
  logger,
  downloader: null,
  providers: new Map(),
};

const startDownload = async (config: any) => {
  if (!streamyx.downloader) return;
  if (typeof config.drmConfig === 'function') config.drmConfig = await config.drmConfig();
  await streamyx.downloader.start(config);
};

const loadProvider = async (name: string, url: string, args: any) => {
  const provider = streamyx.providers.get(name) ?? createProvider(name, args);
  if (provider) {
    await provider.init();
    const hasProvider = streamyx.providers.has(provider.name);
    if (!hasProvider) streamyx.providers.set(provider.name, provider);
    const configs = await provider.getConfigList(url);
    for (const config of configs) await startDownload(config);
  } else {
    streamyx.logger.error(`Provider <${name}> not found`);
  }
};

const loadProviders = async () => {
  const args = getProcessedArgs();
  if (args.version) printVersion();
  if (args.help) printHelp();
  streamyx.logger.setLogLevel(args.debug ? 'debug' : 'info');
  streamyx.downloader = new Downloader(args);
  const urls: string[] = args.urls?.length ? args.urls : [''];
  for (const url of urls) {
    if (args.pssh) {
      await printDecryptionKeys(url, args.pssh, args.headers);
      break;
    }
    const domain = parseMainDomain(await validateUrl(url));
    if (domain) await loadProvider(domain, url, args);
  }
};

loadProviders();
