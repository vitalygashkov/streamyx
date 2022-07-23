'use strict';

const { platform } = require('node:process');
const { join } = require('path');
const childProcess = require('child_process');
const { Widecrypt } = require('../packages/widecrypt');
const { logger } = require('./logger');
const { Files } = require('./files');

const DEVICES_PATH = join(process.cwd(), 'files', 'cdm');
const MP4DECRYPT_NAME = 'mp4decrypt' + (platform === 'win32' ? '.exe' : '');
const MP4DECRYPT_PATH = join(process.cwd(), 'files', 'bin', MP4DECRYPT_NAME);

const files = new Files();

const getDecryptionKeys = async (pssh, drmConfig) => {
  const { params } = drmConfig;

  const widecrypt = new Widecrypt(logger);
  await widecrypt.init(drmConfig, { devicesPath: DEVICES_PATH });
  widecrypt.setRequestFilter((request) => {
    request.body = params
      ? JSON.stringify({
          rawLicenseRequestBase64: Buffer.isBuffer(request.body)
            ? request.body.toString('base64')
            : request.body,
          ...params,
        })
      : request.body;
    return request;
  });
  widecrypt.setResponseFilter((response) => {
    if (response.data[0] === /* '{' */ 0x7b) {
      const dataObject = JSON.parse(response.data.toString('utf8'));
      response.data = dataObject.license || dataObject.payload || dataObject;
    }
    return response;
  });

  const session = await widecrypt.createSession(pssh);
  await session.waitForKeysChange();
  return session.contentKeys;
};

const decryptFile = async (key, kid, input, output, cleanup) => {
  const isExecutableExists = files.exists(MP4DECRYPT_PATH);
  if (!isExecutableExists) {
    logger.error(`Decryption failed. Required package is missing: ${MP4DECRYPT_PATH}`);
    return;
  }
  const args = ['--key', `${kid}:${key}`, input, output];
  const mp4decrypt = childProcess.spawn(MP4DECRYPT_PATH, args);
  mp4decrypt.stdout.setEncoding('utf8');
  mp4decrypt.stdout.on('data', (data) => logger.debug(data));
  mp4decrypt.stderr.setEncoding('utf8');
  mp4decrypt.stderr.on('error', (data) => logger.error(data));
  await new Promise((resolve) =>
    mp4decrypt.on('close', () => {
      mp4decrypt.kill('SIGINT');
      resolve();
    })
  );
  if (cleanup) await files.delete(input, true);
};

module.exports = { getDecryptionKeys, decryptFile };
