import { MediaInfo, StreamyxCore } from '@streamyx/core';

export const rutube = () => (core: StreamyxCore) => {
  return {
    name: 'rutube',
    fetchMediaInfo: async (url: string) => {
      const mediaInfoList: MediaInfo[] = [];
      const patterns = [
        '/video/:id',
        '/play/embed/:id',
        '/shorts/:id',
        '/yappy/:yappyId',
        '/video/private/:id?p=:key',
        '/video/private/:id',
      ];

      const params: Record<'yappyId' | 'id' | 'key', string | undefined> = {
        yappyId: '',
        id: '',
        key: '',
      };
      for (const path of patterns) {
        const pattern = new URLPattern({ pathname: path });
        const patternResult = pattern.exec(url);
        if (patternResult) {
          Object.assign(params, patternResult.pathname.groups);
          Object.assign(params, patternResult.search.groups);
        }
      }

      if (params.yappyId) {
        const yappy = await fetch(
          `https://rutube.ru/pangolin/api/web/yappy/yappypage/?client=wdp&videoId=${params.yappyId}&page=1&page_size=15`
        )
          .then((r) => r.json())
          .catch(() => null);
        const yappyURL = yappy?.results?.find((r: any) => r.id === params.yappyId)?.link;
        if (!yappyURL) {
          core.log.error('ErrorEmptyDownload');
          return mediaInfoList;
        }
        mediaInfoList.push({
          url: yappyURL,
          movie: { title: `rutube_yappy_${params.yappyId}` },
        });
        return mediaInfoList;
      }

      const requestURL = new URL(
        `https://rutube.ru/api/play/options/${params.id}/?no_404=true&referer&pver=v2`
      );
      if (params.key) requestURL.searchParams.set('p', params.key);

      const play = await fetch(requestURL)
        .then((r) => r.json())
        .catch(() => null);
      if (!play) {
        core.log.error('Cannot fetch play info');
        return mediaInfoList;
      }
      if (play.detail || !play.video_balancer) {
        core.log.error('Play info is empty');
        return mediaInfoList;
      }
      if (play.live_streams?.hls) {
        core.log.error('Live videos are not supported');
        return mediaInfoList;
      }

      const playlistUrl = play.video_balancer.m3u8;
      const title = play.title.trim();
      const artist = play.author.name.trim();

      mediaInfoList.push({
        url: playlistUrl,
        provider: 'RTB',
        movie: { title: `${title} ${artist}` },
      });

      return mediaInfoList;
    },
  };
};
