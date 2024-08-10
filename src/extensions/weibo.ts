import { MediaInfo, RunArgs, StreamyxCore } from '@streamyx/core';

export const weibo = () => (core: StreamyxCore) => {
  return {
    name: 'weibo',
    fetchMediaInfo: async (url: string, args: RunArgs) => {
      const patterns = ['/:userId/:blogId', '/detail/:mid'];
      const baseUrls = ['https://weibo.com/', 'https://m.weibo.cn'];
      const result = core.utils.execUrlPatterns(url, patterns, baseUrls);
      const params = result.pathname;

      const mediaInfoList: MediaInfo[] = [];
      if (params.blogId) {
        const response = await fetch(`https://m.weibo.cn/statuses/show?id=${params.blogId}`, {
          credentials: 'include',
          referrer: `https://m.weibo.cn/status/${params.blogId}?jumpfrom=weibocom`,
          method: 'GET',
          mode: 'cors',
        });
        const json = await response.json();
        const pageInfo = json.data.page_info;
        if (pageInfo) {
          const pageInfoUrl = Object.values(pageInfo.urls)?.[0] as string | undefined;
          const mediaInfoUrl =
            pageInfo.media_info?.stream_url_hd || pageInfo.media_info?.stream_url;
          const url = pageInfoUrl || mediaInfoUrl;
          const title = pageInfo.title || pageInfo.page_title;
          mediaInfoList.push({ url, movie: { title } });
        }
      } else {
        const response = await core.http.fetch(url);
        const text = await response.text();
        const pageInfoText = text.split('page_info":')[1]?.split('"bid"')[0].trim().slice(0, -1);
        const pageInfo = JSON.parse(pageInfoText);
        const mediaUrl = Object.values(pageInfo.urls)?.[0] as string | undefined;
        if (mediaUrl) mediaInfoList.push({ url: mediaUrl, movie: { title: pageInfo.title } });
      }

      return mediaInfoList;
    },
  };
};
