'use strict';

const cachedID = { version: '', id: '' };

/** @type {import("@streamyx/core").Service} */
module.exports = () => (core) => {
  async function findClientID() {
    try {
      const sc = await fetch('https://soundcloud.com/')
        .then((r) => r.text())
        .catch((e) => {
          const isBlocked = e.cause?.toString().includes('ECONNRESET');
          if (isBlocked)
            core.log.warn('Soundcloud may be blocked in your region. Use proxy or VPN to bypass restrictions.');
          return '';
        });

      const scVersion = String(sc.match(/<script>window\.__sc_version="[0-9]{10}"<\/script>/)?.[0].match(/[0-9]{10}/));

      if (cachedID.version === scVersion) return cachedID.id;

      const scripts = sc.matchAll(/<script.+src="(.+)">/g);
      let clientid;
      for (const script of scripts) {
        const url = script[1];

        if (!url?.startsWith('https://a-v2.sndcdn.com/')) {
          return;
        }

        const scrf = await fetch(url)
          .then((r) => r.text())
          .catch(() => '');
        const id = scrf.match(/\("client_id=[A-Za-z0-9]{32}"\)/);

        if (id && typeof id[0] === 'string') {
          clientid = id?.[0].match(/[A-Za-z0-9]{32}/)?.[0];
          break;
        }
      }
      cachedID.version = scVersion;
      cachedID.id = clientid || '';

      return clientid;
    } catch {
      return '';
    }
  }

  return {
    name: 'soundcloud',
    fetchContentMetadata: async (url, args) => {
      const patterns = [':author/:song/s-:accessKey', ':author/:song', ':shortLink'];
      const baseUrls = ['https://soundcloud.com', 'https://on.soundcloud.com'];
      const result = core.utils.execUrlPatterns(url, patterns, baseUrls);
      const { author, song, accessKey, shortLink } = result.pathname;

      const clientId = await findClientID();
      if (!clientId) throw new Error('No client ID');

      let link;
      if (new URL(url).hostname === 'on.soundcloud.com' && shortLink) {
        link = await fetch(`https://on.soundcloud.com/${shortLink}/`, { redirect: 'manual' })
          .then((r) => {
            if (r.status === 302 && r.headers.get('location')?.startsWith('https://soundcloud.com/')) {
              return r.headers.get('location')?.split('?', 1)[0];
            }
          })
          .catch(() => {});
      }

      if (!link && author && song) {
        link = `https://soundcloud.com/${author}/${song}${accessKey ? `/s-${accessKey}` : ''}`;
      }

      if (!link) throw new Error('Could not fetch');

      const json = await fetch(`https://api-v2.soundcloud.com/resolve?url=${link}&client_id=${clientId}`)
        .then((r) => (r.status === 200 ? r.json() : false))
        .catch(() => '');

      if (!json) throw new Error('Could not fetch');

      if (!json.media.transcodings) throw new Error('Empty download');

      let bestAudio = 'opus';
      let selectedStream = json.media.transcodings.find((v) => v.preset === 'opus_0_0');
      const mp3Media = json.media.transcodings.find((v) => v.preset === 'mp3_0_0');

      // use mp3 if present if user prefers it or if opus isn't available
      if (mp3Media && (args.audioCodecs?.includes('AAC') || !selectedStream)) {
        selectedStream = mp3Media;
        bestAudio = 'mp3';
      }

      const fileUrlBase = selectedStream.url;
      const fileUrl = `${fileUrlBase}${fileUrlBase.includes('?') ? '&' : '?'}client_id=${clientId}&track_authorization=${json.track_authorization}`;

      if (!fileUrl.startsWith('https://api-v2.soundcloud.com/media/soundcloud:tracks:'))
        throw new Error('Empty download');

      const file = await fetch(fileUrl)
        .then(async (r) => (await r.json()).url)
        .catch(() => '');
      if (!file) throw new Error('Could not fetch');

      const results = [];
      const title = json.title.trim();
      const artist = json.user.username.trim();
      results.push({ title: `${title} ${artist}`, source: { url: file } });
      return results;
    },
  };
};
