'use strict';

/** @type {import("@streamyx/core").Service} */
module.exports = () => (core) => ({
  name: 'vk',
  tag: 'VK',
  fetchContentMetadata: async (url, args) => {
    const html = await core.http
      .fetch(url)
      .then((r) => r.arrayBuffer())
      .then((r) => new TextDecoder('windows-1251').decode(r))
      .catch(() => '');
    if (!html) core.log.error('Could not fetch video info');

    if (!html.includes('{"lang":')) {
      core.log.error('Could not fetch video info');
      return [];
    }

    const js = JSON.parse('{"lang":' + html.split(`{"lang":`)[1].split(']);')[0]);

    if (Number(js.mvData.is_active_live) !== 0) {
      core.log.error('Live videos are not supported');
      return [];
    }

    const selectedQuality = args.videoQuality?.replace('p', '').trim();
    const resolutions = ['2160', '1440', '1080', '720', '480', '360', '240', '144'];
    let quality = selectedQuality || '2160';
    for (const i in resolutions) {
      if (js.player.params[0][`url${resolutions[i]}`]) {
        quality = resolutions[i];
        break;
      }
    }
    if (selectedQuality && Number(quality) > Number(selectedQuality)) quality = selectedQuality;

    const results = [];
    const mediaUrl = js.player.params[0][`url${quality}`];
    const manifestUrl = js.player.params[0].dash_sep;
    if (!mediaUrl || !manifestUrl) {
      core.log.error('Could not find video URL');
      return results;
    }
    const title = js.player.params[0].md_title.trim();
    const author = js.player.params[0].md_author.trim();
    results.push({
      title: `${title} ${author}`,
      source: {
        url: manifestUrl || mediaUrl,
        headers: core.http.headers,
      },
    });
    return results;
  },
});
