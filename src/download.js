'use strict';

const fs = require('./fs');
const { fetch, Http } = require('./http');
const { Progress } = require('./progress');

const DEFAULT_CONNECTIONS = 24;
const DEFAULT_FILEPATH = fs.join(fs.appDir, 'mediafile');

const httpClient = new Http();

const downloadSegment = async (url, headers, index, http2 = false) => {
  try {
    let data = null;
    if (http2) {
      const response = await httpClient.request(url, {
        http2: true,
        responseType: 'buffer',
        headers,
      });
      data = response.body;
    } else {
      const response = await fetch(url, { headers });
      data = response.data;
    }
    return { data, index };
  } catch (e) {
    console.error({ url, index });
    console.error(e);
  }
};

const downloadSegments = async (urls, options) => {
  const {
    filepath = DEFAULT_FILEPATH,
    headers,
    http2,
    connections = DEFAULT_CONNECTIONS,
    decryptersPool,
    codec,
    contentType,
    logPrefix,
  } = options;

  const progress = new Progress({ prefix: logPrefix });
  progress.setSize(urls.length);
  const writeStream = await fs.createWriteStream(filepath);
  const partsCount = Math.ceil(urls.length / connections);
  for (let partIndex = 0; partIndex < partsCount; partIndex++) {
    const startOffset = partIndex * connections;
    const endOffset = startOffset + connections;
    const partSegments = new Map();
    for (
      let segmentIndex = startOffset;
      segmentIndex < endOffset && segmentIndex < urls.length;
      segmentIndex++
    ) {
      const url = urls[segmentIndex];
      partSegments.set(segmentIndex, downloadSegment(url, headers, segmentIndex, http2));
    }

    const segments = [];
    try {
      const responses = await Promise.all(partSegments.values());
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        const decryptSegment = decryptersPool?.[i];
        segments[response.index - startOffset] = decryptSegment
          ? decryptSegment(response.data, {
              contentType,
              codec,
              init: response.index === 0,
            })
          : response.data;
      }
    } catch (e) {
      console.error(e);
      console.error(e.message);
    }

    try {
      const data = Buffer.concat(segments);
      await new Promise((resolve) => writeStream.write(data, resolve));
      const progressValue =
        endOffset > urls.length ? urls.length - startOffset : endOffset - startOffset;
      progress.increase(progressValue);
    } catch (e) {
      console.error(e);
      console.error(`Write part ${partIndex + 1} failed`);
    }
    partSegments.clear();
  }
  writeStream.end();
};

const download = async (urls, options) => {
  await downloadSegments(urls, options);
};

module.exports = { download };
