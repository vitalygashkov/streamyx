const virtualroom = () => (streamyx) => {
  const isValidUrl = (url) => new URL(url).host.includes('virtualroom');

  const init = async () => {};

  const getConfigList = async (url) => {
    const recordId = new URL(url).searchParams.get('recordId');

    const infoUrl = `https://mv1.virtualroom.ru/vr/player/records/${recordId}/info`;
    const infoResponse = await streamyx.http.fetch(infoUrl);
    const info = await infoResponse.json();

    const eventsUrl = `https://mv1.virtualroom.ru/vr/player/records/${recordId}/events`;
    const eventsResponse = await streamyx.http.fetch(eventsUrl);
    const events = await eventsResponse.json();

    const configList = [];
    for (const translation of events.data.translations) {
      const title = `${info.data.roomParameters.name} ${translation.type} ${translation.source} ${translation.start}`;
      const config = {
        provider: 'VRM',
        manifestUrl: translation.url,
        movie: { title },
      };
      configList.push(config);
    }
    return configList;
  };

  return {
    name: 'virtualroom',
    api: null,
    isValidUrl,
    init,
    getConfigList,
  };
};

module.exports = { virtualroom };
