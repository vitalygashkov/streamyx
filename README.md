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

Streamyx is a tool that allows you to download videos for offline-viewing.

<div align="left">
  <span>English</span> •
  <a href="https://github.com/vitalygashkov/streamyx/tree/main/README.ru.md">Pусский</a>
</div>

### Built-in services

<a aria-label="Crunchyroll" href="https://crunchyroll.com"><img alt="" src="https://img.shields.io/badge/Crunchyroll-F47521?style=flat-square&logo=crunchyroll&logoColor=white"></a>
<a aria-label="Weibo" href="https://m.weibo.cn/"><img alt="" src="https://img.shields.io/badge/Weibo-D62B2A?style=flat-square&logo=sina-weibo&logoColor=white"></a>
<a aria-label="SoundCloud" href="https://soundcloud.com/"><img alt="" src="https://img.shields.io/badge/SoundCloud-FF3300?style=flat-square&logo=soundcloud&logoColor=white"></a>
<a aria-label="VK" href="https://vk.com/video"><img alt="" src="https://img.shields.io/badge/VK-0077ff.svg?&style=flat-square&logo=vk&logoColor=white"></a>
<a aria-label="Rutube" href="https://rutube.ru/"><img alt="" src="https://img.shields.io/badge/RUTUBE-100943?style=flat-square&logoColor=white"></a>
<a aria-label="VirtualRoom" href="https://virtualroom.ru/"><img alt="" src="https://img.shields.io/badge/VirtualRoom-01aade?style=flat-square&logoColor=white"></a>
<a aria-label="НТВ" href="https://www.ntv.ru/"><img alt="" src="https://img.shields.io/badge/НТВ-00aa01?style=flat-square&logoColor=white"></a>

> You can add support for any streaming service yourself! See [example](https://github.com/vitalygashkov/streamyx-service-example) for more details.

## Install

Streamyx supports Windows (x64), macOS (x64 & Apple Silicon) and Linux (x64).

#### Windows

```shell
powershell -c "irm https://streamyx.ru/install.ps1 | iex"
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

Output: `/downloads/Tsurune.S01.JA.1080p.CR.WEB-DL.x264/Tsurune.S01.E01.The.Young.Man.on.the.Shooting.Range.JA.1080p.CR.WEB-DL.x264.mkv`

## Features

- **Multiple media formats** support: progressive, MPEG-DASH, HLS
- **Concurrency**: multiple simultaneous connections for faster downloads
- **Retry** in case of request failure during download
- **HTTP2** support
- **Templates** for movie and episode filenames
- **Decryption** of MPEG-DASH stream with specified content key
