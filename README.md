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

## Installation

Download build from [latest release](https://github.com/vitalygashkov/streamyx/releases/latest) and unzip.

## Getting Started

Open terminal from the folder where the executable file is located and run the application.

Usage:

```shell
streamyx [OPTIONS] URL [URL...]
```

Use `-h` option to see all available options.

### Download a video

```shell
streamyx https://www.crunchyroll.com/ru/watch/G65PJWDQ6/the-young-man-on-the-shooting-range
Username: example@gmail.com
Password: 123456
22:45:09.083 INFO : Fetching metadata...
22:45:09.721 INFO : Fetching metadata finished
22:45:10.518 INFO : Tsurune ∙ S1 ∙ E1 ∙ The Young Man on the Shooting Range
17:45:11.761 INFO : ✔ Tsurune.S01.E01.The.Young.Man.on.the.Shooting.Range.JA.1080p.CR.WEB-DL.x264 ∙ VIDEO ∙ 1920x1080 ∙ 7991 KiB/s ∙ ~1439 MiB
17:47:21.269 INFO : ✔ Tsurune.S01.E01.The.Young.Man.on.the.Shooting.Range.JA.1080p.CR.WEB-DL.x264 ∙ AUDIO ∙ JA-JP ∙ 128 KiB/s ∙ ~23 MiB
17:47:25.630 INFO : ✔ Tsurune.S01.E01.The.Young.Man.on.the.Shooting.Range.JA.1080p.CR.WEB-DL.x264 ∙ SUBTITLES ∙ EN-US
17:47:26.586 INFO : ✔ Tsurune.S01.E01.The.Young.Man.on.the.Shooting.Range.JA.1080p.CR.WEB-DL.x264 ∙ SUBTITLES ∙ DE-DE
17:47:27.296 INFO : ✔ Tsurune.S01.E01.The.Young.Man.on.the.Shooting.Range.JA.1080p.CR.WEB-DL.x264 ∙ SUBTITLES ∙ ES-419
17:47:27.791 INFO : ✔ Tsurune.S01.E01.The.Young.Man.on.the.Shooting.Range.JA.1080p.CR.WEB-DL.x264 ∙ SUBTITLES ∙ ES-ES
17:47:28.380 INFO : ✔ Tsurune.S01.E01.The.Young.Man.on.the.Shooting.Range.JA.1080p.CR.WEB-DL.x264 ∙ SUBTITLES ∙ FR-FR
17:47:29.165 INFO : ✔ Tsurune.S01.E01.The.Young.Man.on.the.Shooting.Range.JA.1080p.CR.WEB-DL.x264 ∙ SUBTITLES ∙ IT-IT
17:47:29.715 INFO : ✔ Tsurune.S01.E01.The.Young.Man.on.the.Shooting.Range.JA.1080p.CR.WEB-DL.x264 ∙ SUBTITLES ∙ PT-BR
17:47:30.400 INFO : ✔ Tsurune.S01.E01.The.Young.Man.on.the.Shooting.Range.JA.1080p.CR.WEB-DL.x264 ∙ SUBTITLES ∙ RU-RU
17:47:30.964 INFO : ✔ Tsurune.S01.E01.The.Young.Man.on.the.Shooting.Range.JA.1080p.CR.WEB-DL.x264 ∙ SUBTITLES ∙ AR-SA
17:47:31.510 INFO : ✔ Decrypted
17:47:36.154 INFO : ✔ Muxed
```

Output: `/downloads/Tsurune.S01.JA.1080p.CR.WEB-DL.x264/Tsurune.S01.E01.The.Young.Man.on.the.Shooting.Range.JA.1080p.CR.WEB-DL.x264.mkv`

## Features

- **Multiple media formats** support: progressive, MPEG-DASH, HLS
- **Concurrency**: multiple simultaneous connections for faster downloads
- **Retry** in case of request failure during download
- **HTTP2** support
- **Templates** for movie and episode filenames
- **Decryption** of MPEG-DASH stream with specified content key
