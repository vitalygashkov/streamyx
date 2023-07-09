import { getContentKeys, getSegmentDecrypter, setLogger } from '../packages/keystone/keystone';
import { logger } from './logger';
import fs from './fs';

const DEVICES_DIR = fs.join(fs.appDir, 'files', 'cdm');

const findCdmClientFolder = async () => {
  if (!fs.exists(DEVICES_DIR)) return null;
  const folders = await fs.readDir(DEVICES_DIR);
  const cdmClientFolder = folders.length ? fs.join(DEVICES_DIR, folders.pop() ?? '') : null;
  return cdmClientFolder;
};

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
    try {
      return Buffer.from(dataObject.license || dataObject.payload || dataObject, 'base64');
    } catch (e) {
      logger.error(`Can't recognize license response`);
      logger.error(`Response: ${JSON.stringify(dataObject)}`);
    }
  }
  return responseData;
};

const getDecryptionKeys = async (pssh: string, drmConfig: any) => {
  setLogger(logger);
  const deviceDir = await findCdmClientFolder();
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

const getDecryptersPool = async (pssh: string, drmConfig: any, count = 1, key?: Buffer) => {
  setLogger(logger);
  const addonDir = fs.join(fs.appDir, 'packages', 'keystone', 'build', 'Release');
  const cdmDir = fs.join(fs.appDir, 'files', 'cdm');
  const params = {
    ...drmConfig,
    key,
    requestBodyFilter: getRequestBodyFilter(drmConfig.params),
    responseDataFilter,
    cdmDir,
    addonDir,
  };
  const decryptersPool = [];
  for (let i = 0; i < count; i++) decryptersPool.push(getSegmentDecrypter(pssh, params));
  return Promise.all(decryptersPool);
};

const printDecryptionKeys = async (
  licenseUrl: string,
  pssh: string,
  headers?: Record<string, string>
) => {
  const drmConfig = { server: licenseUrl, individualizationServer: licenseUrl, headers };
  const keys = await getDecryptionKeys(pssh, drmConfig);
  if (!keys?.length) logger.error('Decryption keys not found');
  else for (const key of keys) logger.info(`KID:KEY -> ${key.kid}:${key.key}`);
};

export { getDecryptionKeys, getDecryptersPool, printDecryptionKeys };
