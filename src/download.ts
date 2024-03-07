import fs from './fs';
import { Http } from './http';
import { logger } from './logger';
import { progress } from './progress';

const DEFAULT_CONNECTIONS = 24;
const DEFAULT_FILEPATH = fs.join(fs.appDir, 'mediafile');

const http = new Http();

const downloadSegment = async (url: string, headers: Record<string, string>, index: number) => {
  try {
    const response = await http.fetch(url.replaceAll('&amp;', '&'), { headers });
    if (response.status !== 200) {
      logger.error(`Segment #${index + 1} download failed. Status code: ${response.status}`);
      logger.debug(await response.text());
    }
    const data = Buffer.from(await response.arrayBuffer());
    return { data, index };
  } catch (e: any) {
    logger.error(`Download segment #${index + 1} failed`);
    logger.debug(e.toString());
    return { index };
  }
};

const downloadSegments = async (urls: string[], options: any) => {
  const {
    filepath = DEFAULT_FILEPATH,
    headers,
    connections = DEFAULT_CONNECTIONS,
    decryptersPool = [],
    codec,
    contentType,
    logPrefix,
    manifestUrl,
    filename,
    track,
  } = options;

  progress.reset({ id: filepath, prefix: logPrefix, manifestUrl, filename, track });
  progress.setSize(track.size);
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
      partSegments.set(segmentIndex, downloadSegment(url, headers, segmentIndex));
    }

    const segments: Buffer[] = [];
    try {
      const responses = await Promise.all(partSegments.values());
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        const decrypter = decryptersPool[i];
        if (response.data) {
          segments[response.index - startOffset] = decrypter?.decrypt
            ? await decrypter.decrypt(response.data, {
                contentType,
                codec,
                init: response.index === 0,
              })
            : response.data;
        }
      }
    } catch (e: any) {
      logger.error(`Download part ${partIndex + 1} failed`);
      logger.debug(e.message);
    }

    try {
      const data = Buffer.concat(segments);
      await new Promise((resolve) => writeStream.write(data, resolve));
      const dataSizeMB = data.byteLength / Math.pow(1024, 2);
      progress.increase(dataSizeMB);
    } catch (e: any) {
      logger.error(`Write part ${partIndex + 1} failed`);
      logger.debug(e.toString());
    }
    partSegments.clear();
  }
  progress.update(track.size);
  writeStream.end();
};

const download = async (urls: string[], options: any) => {
  await downloadSegments(urls, options);
  await http.destroySessions();
};

export { download };
