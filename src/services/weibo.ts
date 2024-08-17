import { defineService, MediaInfo } from '@streamyx/core';

export default defineService(() => (core) => {
  return {
    name: 'weibo',
    fetchMediaInfo: async (url) => {
      const patterns = ['/:userId(\\d+)/:bid', '/detail/:mid'];
      const baseUrls = ['https://weibo.com/', 'https://m.weibo.cn'];
      const result = core.utils.execUrlPatterns(url, patterns, baseUrls);
      const params = result.pathname;
      const mediaInfoList: MediaInfo[] = [];
      const id = params.bid || params.mid;
      if (id) {
        const response = await fetch(`https://m.weibo.cn/statuses/show?id=${id}`, {
          credentials: 'include',
          referrer: `https://m.weibo.cn/status/${params.bid}?jumpfrom=weibocom`,
          method: 'GET',
          mode: 'cors',
        });
        const json = await response.json();
        const pics = json.data.pics;
        const info = json.data.page_info;
        if (pics) {
          const videos = pics.filter(
            (pic: any) => pic.type === 'video' || pic.type === 'livephoto'
          );
          for (const video of videos) {
            mediaInfoList.push({ url: video.videoSrc, title: video.pid });
          }
        } else if (info.type === 'video') {
          const pageInfoUrl = Object.values(info.urls)?.[0] as string | undefined;
          const mediaInfoUrl = info.media_info?.stream_url_hd || info.media_info?.stream_url;
          const url = pageInfoUrl || mediaInfoUrl;
          const title = info.title || info.page_title;
          mediaInfoList.push({ url, title });
        }
      }
      return mediaInfoList;
    },
  };
});
