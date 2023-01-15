import path from 'node:path';
import { arch, platform } from 'node:process';
import { getContentKeys, getSegmentDecrypter, setLogger } from '../packages/keystone/keystone';
import { logger } from './logger';
import fs from './fs';

const DEVICES_DIR = fs.join(fs.appDir, 'files', 'cdm');

const getRequestBodyFilter =
  (params: Record<string, string | number>) => (requestBody: Buffer | string) => {
    return params
      ? JSON.stringify({
          rawLicenseRequestBase64: Buffer.isBuffer(requestBody)
            ? requestBody.toString('base64')
            : requestBody,
          ...params,
        })
      : requestBody;
  };

const responseDataFilter = (responseData: Buffer) => {
  if (responseData[0] === /* '{' */ 0x7b) {
    const dataObject = JSON.parse(responseData.toString('utf8'));
    return Buffer.from(dataObject.license || dataObject.payload || dataObject, 'base64');
  }
  return responseData;
};

const getDecryptionKeys = async (pssh: string, drmConfig: any) => {
  setLogger(logger);
  if (!fs.exists(DEVICES_DIR)) return [];
  const devicesDirNames = await fs.readDir(DEVICES_DIR);
  const deviceDir = devicesDirNames.length ? fs.join(DEVICES_DIR, devicesDirNames.pop()!) : null;
  try {
    const contentKeys = await getContentKeys(pssh, {
      ...drmConfig,
      deviceDir,
      requestBodyFilter: getRequestBodyFilter(drmConfig.params),
      responseDataFilter,
    });
    return contentKeys;
  } catch (e) {
    logger.debug(String(e));
    return [];
  }
};

const OS_ROOT = path.parse(fs.appDir).root;

const CDM_DIRS = {
  win: [
    `${OS_ROOT}Program Files\\Google\\Chrome\\Application\\$browserVersion\\WidevineCdm\\_platform_specific\\$platform\\`,
    `${OS_ROOT}Program Files (x86)\\Google\\Chrome\\Application\\$browserVersion\\WidevineCdm\\_platform_specific\\$platform\\`,
    `${OS_ROOT}Program Files\\Microsoft\\Edge\\Application\\$browserVersion\\WidevineCdm\\_platform_specific\\$platform\\`,
    `${OS_ROOT}Program Files (x86)\\Microsoft\\Edge\\Application\\$browserVersion\\WidevineCdm\\_platform_specific\\$platform\\`,
  ],
  mac: [
    `/Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.framework/Libraries/WidevineCdm/_platform_specific/$platform/`,
    `/Applications/Google Chrome.app/Contents/Frameworks/Google Chrome Framework.framework/Versions/$browserVersion/Libraries/WidevineCdm/_platform_specific/$platform/`,
    `/Applications/Microsoft Edge.app/Contents/Frameworks/Microsoft Edge Framework.framework/Libraries/WidevineCdm/_platform_specific/$platform/`,
    `/Applications/Microsoft Edge.app/Contents/Frameworks/Microsoft Edge Framework.framework/Versions/$browserVersion/Libraries/WidevineCdm/_platform_specific/$platform/`,
  ],
  linux: ['/opt/google/chrome/WidevineCdm/_platform_specific/$platform/'],
};

const parseCdmDir = async (dir: string, { platform = '' }) => {
  let parsedDir = dir.replace('$platform', platform);
  if (dir.includes('$browserVersion')) {
    const browserDir = dir.split('$browserVersion')[0];
    if (!fs.exists(browserDir)) return parsedDir;
    const entries = await fs.readDir(browserDir);
    const versions = entries.filter(parseFloat).map(parseFloat).sort();
    const latestVersion = Math.max(...versions);
    const browserVersion = entries.find((entry) => parseFloat(entry) === latestVersion) ?? '';
    parsedDir = parsedDir.replace('$browserVersion', browserVersion);
  }
  return parsedDir;
};

const getOS = () => {
  switch (platform) {
    case 'win32':
      return 'win';
    case 'darwin':
      return 'mac';
    case 'linux':
      return 'linux';
    default:
      throw new Error('Unknown platform');
  }
};

const getCdmDir = async (defaultDir: string) => {
  const os = getOS();
  const platform = `${os}_${arch}`;
  for (const dir of CDM_DIRS[os]) {
    const parsedDir = await parseCdmDir(dir, { platform });
    if (fs.exists(parsedDir)) return parsedDir;
  }
  return defaultDir;
};

const getDecryptersPool = async (pssh: string, drmConfig: any, count = 1) => {
  setLogger(logger);
  const addonDir = fs.join(fs.appDir, 'packages', 'keystone', 'build', 'Release');
  const cdmDir = await getCdmDir(fs.join(fs.appDir, 'files', 'cdm'));
  const params = {
    ...drmConfig,
    requestBodyFilter: getRequestBodyFilter(drmConfig.params),
    responseDataFilter,
    cdmDir,
    addonDir,
  };
  const decryptersPool = [];
  for (let i = 0; i < count; i++) decryptersPool.push(getSegmentDecrypter(pssh, params));
  return Promise.all(decryptersPool);
};

export { getDecryptionKeys, getDecryptersPool };
