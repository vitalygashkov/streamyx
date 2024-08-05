import type { MediaInfo, StreamyxCore, PluginInstance } from '@streamyx/core';

export const vk =
  () =>
  (core: StreamyxCore): PluginInstance => ({
    name: 'vk',
    fetchMediaInfo: async (url, args) => {
      const html = await core.http
        .fetch(url)
        .then((r) => r.arrayBuffer())
        .then((r) => new TextDecoder('windows-1251').decode(r))
        .catch(() => '');
      if (!html) core.log.error('Could not fetch video info');

      const js = JSON.parse('{"lang":' + html.split(`{"lang":`)[1].split(']);')[0]);

      if (Number(js.mvData.is_active_live) !== 0) {
        core.log.error('Live videos are not supported');
        return [];
      }

      const selectedQuality = args.videoQuality?.replace('p', '').trim();
      const resolutions = ['2160', '1440', '1080', '720', '480', '360', '240'];
      let quality = selectedQuality || '2160';
      for (const i in resolutions) {
        if (js.player.params[0][`url${resolutions[i]}`]) {
          quality = resolutions[i];
          break;
        }
      }
      if (selectedQuality && Number(quality) > Number(selectedQuality)) quality = selectedQuality;

      const mediaInfo: MediaInfo[] = [];
      const mediaUrl = js.player.params[0][`url${quality}`];
      if (!mediaUrl) {
        core.log.error('Could not find video URL');
        return mediaInfo;
      }
      const title = js.player.params[0].md_title.trim();
      const author = js.player.params[0].md_author.trim();
      mediaInfo.push({
        url: mediaUrl,
        provider: 'VK',
        movie: { title: `${title} ${author}` },
      });
      return mediaInfo;
    },
  });
