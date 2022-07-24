'use strict';

process.title = 'streamyx';

const { description, name, version } = require('./package.json');
const { Args } = require('./src/args');
const { Application } = require('./src/application');

const args = new Args()
  .setName(name)
  .setVersion(version)
  .setDescription(description)
  .setArgument('URL', 'item link from a streaming service')
  .setOption('-q, --video-quality', 'sets video quality')
  .setOption('-a, --audio-quality', 'sets audio quality')
  .setOption('-e, --episodes', 'sets episode numbers')
  .setOption('-s, --seasons', 'sets season numbers')
  .setOption('-f, --force', 'overwrite output files without asking')
  .setOption('-t, --template', 'filename template ("{title} - S{s}E{e} [{quality} {translation}]")')
  .setOption('--movie-template', 'movie filename template')
  .setOption(
    '--episode-template',
    'episode filename template, example: "{show}.S{s}E{e}.{title}.{quality}.{provider}.{format}.{codec}"'
  )
  .setOption('-p, --proxy', 'set http(s)/socks proxy (WHATWG URL standard)')
  .setOption('--part-size', 'set segments count per part (default: 32)')
  .setOption('--hardsub', 'download hardsubbed video if available')
  .setOption('--subs-lang', 'download subtitles by language tag')
  .setOption('--audio-lang', 'download audio by language tag')
  .setOption('--skip-subs', 'skip downloading subtitles')
  .setOption('--skip-audio', 'skip downloading audio')
  .setOption('--skip-video', 'skip downloading video')
  .setOption('--skip-mux', 'skip muxing video, audio and subtitles')
  .setOption('--trim-begin', 'trim video at the beginning')
  .setOption('--trim-end', 'trim video at the end')
  .setOption('-d, --debug', 'debug mode')
  .setOption('-v, --version', 'output version')
  .setOption('-h, --help', 'output help')
  .parse();

(async () => {
  const application = new Application();
  await application.init(args);
  await application.start();
})();
