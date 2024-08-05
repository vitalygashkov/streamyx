import type { PluginInstance, StreamyxCore } from '@streamyx/core';

export const ntv =
  () =>
  (core: StreamyxCore): PluginInstance => ({
    name: 'ntv',
    fetchMediaInfo: async (url: string) => {
      const mediaInfoList = [];
      const pageResponse = await core.http.fetch(url);
      const pageBody = await pageResponse.text();
      const videoFrameLink = pageBody
        .split(`<meta property="og:video:iframe" content="`)[1]
        ?.split(`">`)[0]
        ?.split(`" />`)[0];
      const videoId = videoFrameLink.split(`embed/`)[1]?.split(`/`)[0];
      const xmlResponse = await core.http.fetch(`https://www.ntv.ru/vi${videoId}/`);
      const xmlBody = await xmlResponse.text();
      const fileLink = xmlBody
        .split(`<file>`)[1]
        ?.split(`</file>`)[0]
        ?.split(`DATA[`)[1]
        ?.split(`]`)[0];
      const title = xmlBody.split(`<embed_tag>`)[1]?.split(`</embed_tag>`)[0];
      const subtitlesRoute = xmlBody.split(`<subtitles>`)[1]?.split(`</subtitles>`)[0];
      const subtitlesUrl = `https://www.ntv.ru${subtitlesRoute}`;
      const hqFileLink = fileLink.replace(`vod/`, `vod/hd/`).replace(`_lo.mp4`, `.mp4`);
      core.log.info(`Video: ${hqFileLink}`);
      if (subtitlesRoute) core.log.info(`Subtitles: ${subtitlesUrl}`);

      const mediaInfo = {
        url: hqFileLink,
        provider: 'NTV',
        movie: { title },
      };
      mediaInfoList.push(mediaInfo);

      return mediaInfoList;
    },
  });
