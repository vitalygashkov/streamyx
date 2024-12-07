<p align="center">
  <h1 align="center">Streamyx</h1>
</p>

<p align="center">
  <a aria-label="Join Discord community" href="https://discord.gg/fHMgAgc7gU">
    <img alt="" src="https://img.shields.io/badge/Discord-server-black?style=flat&logo=Discord&logoColor=white">
  </a>
  <a aria-label="Join Telegram community" href="https://t.me/streamyxtalks">
    <img alt="" src="https://img.shields.io/badge/Telegram-chat-black?style=flat&logo=Telegram&logoColor=white">
  </a>
  <img alt="" src="https://img.shields.io/github/downloads/vitalygashkov/streamyx/latest/total?style=flat&color=black">
  <img alt="" src="https://img.shields.io/github/downloads/vitalygashkov/streamyx/total?style=flat&color=black">
</p>

Streamyx makes it simple, fast and delightful to download videos, so you can watch it offline later.

English • [Pусский](https://github.com/vitalygashkov/streamyx/tree/main/README.ru.md)

Streamyx has built-in support for [Crunchyroll](https://github.com/vitalygashkov/streamyx-extensions/tree/main/extensions/crunchyroll), [Weibo](https://github.com/vitalygashkov/streamyx-extensions/tree/main/extensions/weibo), [Soundcloud](https://github.com/vitalygashkov/streamyx-extensions/tree/main/extensions/soundcloud), [VK](https://github.com/vitalygashkov/streamyx-extensions/tree/main/extensions/vk), [RUTUBE](https://github.com/vitalygashkov/streamyx-extensions/tree/main/extensions/rutube) and more.

Browse all open source extensions [here](https://github.com/vitalygashkov/streamyx-extensions).

## Install

Streamyx supports Windows (x64), macOS (x64 & Apple Silicon) and Linux (x64).

#### Windows

```shell
powershell -c "irm streamyx.ru/install.ps1 | iex"
```

#### Linux & macOS

```shell
curl -fsSL https://streamyx.ru/install.sh | bash
```

### Upgrade

To upgrade to the latest version of Streamyx, run:

```shell
streamyx upgrade
```

## Getting Started

```shell
streamyx <command> [...options]
```

Use `--help` flag to see all available options.

### Download a video

```shell
streamyx https://vk.com/video-29093629_456239905
22:40:05.153 INFO : Fetching content metadata...
22:40:06.168 INFO : Fetching metadata finished
22:40:06.169 INFO : Cocteau Twins - Heaven Or Las Vegas (Official Video) THE SWEET VINYL
17:40:06.330 INFO : ✔ Cocteau.Twins.-.Heaven.Or.Las.Vegas.(Official.Video).THE.SWEET.VINYL.720p.VK.WEB-DL.x264 ∙ VIDEO ∙ 1280x720 ∙ 2296 KiB/s ∙ ~66 MiB
17:40:11.799 INFO : ✔ Cocteau.Twins.-.Heaven.Or.Las.Vegas.(Official.Video).THE.SWEET.VINYL.720p.VK.WEB-DL.x264 ∙ AUDIO ∙ 267 KiB/s ∙ ~8 MiB
17:40:13.007 INFO : ✔ Muxed
```

Output: `C:\Users\Admin\Downloads\Cocteau.Twins.-.Heaven.Or.Las.Vegas.(Official.Video).THE.SWEET.VINYL.720p.VK.WEB-DL.x264.mkv`

## Features

- **Multiple media formats** support: progressive, MPEG-DASH, HLS
- **Concurrency**: multiple simultaneous connections for faster downloads
- **Retry** in case of request failure during download
- **HTTP2** support
- **Templates** for movie and episode filenames
- **Decryption** of MPEG-DASH stream with specified content key
