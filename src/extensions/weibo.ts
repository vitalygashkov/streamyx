import { MediaInfo, RunArgs, StreamyxCore } from '@streamyx/core';

export const weibo = () => (core: StreamyxCore) => {
  return {
    name: 'weibo',
    fetchMediaInfo: async (url: string, args: RunArgs) => {
      const response = await core.http.fetch(url);
      const text = await response.text();
      const pageInfoText = text.split('page_info":')[1]?.split('"bid"')[0].trim().slice(0, -1);
      const pageInfo = JSON.parse(pageInfoText);
      const mediaUrl = Object.values(pageInfo.urls)?.[0] as string | undefined;
      const mediaInfoList: MediaInfo[] = [];
      if (mediaUrl) mediaInfoList.push({ url: mediaUrl, movie: { title: pageInfo.title } });
      return mediaInfoList;
    },
  };
};
