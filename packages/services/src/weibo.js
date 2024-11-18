'use strict';

/** @type {import("@streamyx/core").Service} */
module.exports = () => (core) => {
  return {
    name: 'weibo',
    fetchContentMetadata: async (url) => {
      const patterns = ['/:userId(\\d+)/:bid', '/detail/:mid'];
      const baseUrls = ['https://weibo.com/', 'https://m.weibo.cn'];
      const result = core.utils.execUrlPatterns(url, patterns, baseUrls);
      const params = result.pathname;
      const results = [];
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
          const videos = pics.filter((pic) => pic.type === 'video' || pic.type === 'livephoto');
          for (const video of videos) {
            results.push({ title: video.pid, source: { url: video.videoSrc } });
          }
        } else if (info.type === 'video') {
          const pageInfoUrl = Object.values(info.urls)?.[0];
          const mediaInfoUrl = info.media_info?.stream_url_hd || info.media_info?.stream_url;
          const url = pageInfoUrl || mediaInfoUrl;
          const title = info.title || info.page_title;
          results.push({ title, source: { url } });
        }
      }
      return results;
    },
  };
};
