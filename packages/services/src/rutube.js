'use strict';

/** @type {import("@streamyx/core").Service} */
module.exports = () => (core) => {
  return {
    name: 'rutube',
    tag: 'RUTUBE',
    fetchContentMetadata: async (url) => {
      const patterns = [
        '/video/:id{/}?',
        '/play/embed/:id{/}?',
        '/shorts/:id{/}?',
        '/yappy/:yappyId{/}?',
        '/video/private/:id{/}??p=:key{/}?',
        '/video/private/:id{/}?',
      ];

      const params = { yappyId: '', id: '', key: '' };
      for (const path of patterns) {
        const pattern = new URLPattern(path, 'https://rutube.ru');
        const patternResult = pattern.exec(url);
        if (patternResult) {
          Object.assign(params, patternResult.pathname.groups);
          Object.assign(params, patternResult.search.groups);
        }
      }

      const results = [];
      if (params.yappyId) {
        const yappy = await fetch(
          `https://rutube.ru/pangolin/api/web/yappy/yappypage/?client=wdp&videoId=${params.yappyId}&page=1&page_size=15`
        )
          .then((r) => r.json())
          .catch(() => null);
        const yappyURL = yappy?.results?.find((r) => r.id === params.yappyId)?.link;
        if (!yappyURL) {
          core.log.error('ErrorEmptyDownload');
          return results;
        }
        results.push({
          title: `rutube_yappy_${params.yappyId}`,
          source: { url: yappyURL },
        });
        return results;
      }

      const requestURL = new URL(`https://rutube.ru/api/play/options/${params.id}/?no_404=true&referer&pver=v2`);
      if (params.key) requestURL.searchParams.set('p', params.key);

      const play = await fetch(requestURL)
        .then((r) => r.json())
        .catch(() => null);
      if (!play) {
        core.log.error('Cannot fetch play info');
        return results;
      }
      if (play.detail || !play.video_balancer) {
        core.log.error('Play info is empty');
        return results;
      }
      if (play.live_streams?.hls) {
        core.log.error('Live videos are not supported');
        return results;
      }

      const playlistUrl = play.video_balancer.m3u8;
      const title = play.title.trim();
      const artist = play.author.name.trim();

      results.push({ title: `${title} ${artist}`, source: { url: playlistUrl } });

      return results;
    },
  };
};
