import type { StreamyxCore } from '@streamyx/core';

export const virtualroom = () => (core: StreamyxCore) => ({
  name: 'virtualroom',
  fetchMediaInfo: async (url: string) => {
    const recordId = new URL(url).searchParams.get('recordId');

    const infoUrl = `https://mv1.virtualroom.ru/vr/player/records/${recordId}/info`;
    const infoResponse = await core.http.fetch(infoUrl);
    const info = await infoResponse.json();

    const eventsUrl = `https://mv1.virtualroom.ru/vr/player/records/${recordId}/events`;
    const eventsResponse = await core.http.fetch(eventsUrl);
    const events = await eventsResponse.json();

    const mediaInfoList = [];
    for (const translation of events.data.translations) {
      const title = `${info.data.roomParameters.name} ${translation.type} ${translation.source} ${translation.start}`;
      const mediaInfo = {
        url: translation.url,
        provider: 'VRM',
        movie: { title },
      };
      mediaInfoList.push(mediaInfo);
    }
    return mediaInfoList;
  },
});
