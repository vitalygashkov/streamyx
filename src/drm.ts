import { getContentKeys, getSegmentDecrypter, setLogger } from '@devi/core';
import { logger } from './logger';
import fs from './fs';

const FILES_DIR = fs.join(fs.appDir, 'files');

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
  try {
    const contentKeys = await getContentKeys(pssh, {
      ...drmConfig,
      deviceDir: FILES_DIR,
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
  const isCompiled = __dirname.includes('dist');
  // If executable, then go by one more step, from `dist` folder
  const up = isCompiled ? '../..' : '..';
  const addonDir = fs.join(__dirname, `${up}/node_modules/@devi/addon/build/Release`);
  const params = {
    ...drmConfig,
    key,
    requestBodyFilter: getRequestBodyFilter(drmConfig.params),
    responseDataFilter,
    cdmDir: FILES_DIR,
    addonDir,
  };
  const decryptersPool = [];
  for (let i = 0; i < count; i++)
    decryptersPool.push(getSegmentDecrypter(pssh, params).catch((e) => logger.error(e.message)));
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
