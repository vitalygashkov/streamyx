# Streamyx

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/vitalygashkov/streamyx/publish.yml?branch=main&logo=github&style=flat&color=grey)
![GitHub Release](https://img.shields.io/github/v/release/vitalygashkov/streamyx?style=flat&color=grey)
![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/vitalygashkov/streamyx/latest/total?style=flat&color=grey)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/vitalygashkov/streamyx/total?style=flat&color=grey)

Streamyx is a tool that allows you to download videos from streaming services for offline-viewing.

[Join Discord community (EN)](https://discord.gg/jkxq3VT7) • [Join Telegram community (RU)](https://t.me/streamyx_ru)

<div align="left">
  <span>English</span> •
  <a href="https://github.com/vitalygashkov/streamyx/tree/main/docs/README.ru.md">Pусский</a>
</div>

## Installation

### Dependencies

Custom **Widevine client** data are required for DRM-protected content. Usually it is two files - `device_client_id_blob` and `device_private_key`. They should be placed in `files` folder next to the executable file.

### Install

Download build from [latest release](https://github.com/vitalygashkov/streamyx/releases/latest) (for Windows: `streamyx-win-x64.zip`), unzip, and put `files` folder with all stuff next to it.

Final structure of files and folders (example for Windows):

```
/streamyx.exe
/files/device_client_id_blob
/files/device_private_key
```

## Getting Started

Open terminal from the folder where the executable file is located and run the application.

Usage:

```shell
streamyx [OPTIONS] URL [URL...]
```

Use `-h` option to see all available options.

### Download a video

```shell
streamyx -q 720p https://wink.ru/movies/ofitsery-year-1971
2023-07-11 21:24:07 INFO   Офицеры
2023-07-11 21:24:07 INFO   VIDEO ∙ 1280x720 ∙ 2160 Kbps ∙ 2024 MiB
2023-07-11 21:24:07 INFO   ██████████████████████████████████████████████████ 100%
2023-07-11 21:26:57 INFO   AUDIO ∙ 48 kHz ∙ 320 Kbps ∙ 300 MiB
2023-07-11 21:26:57 INFO   ██████████████████████████████████████████████████ 100%
2023-07-11 21:27:26 INFO   Starting decryption
2023-07-11 21:27:36 INFO   Decrypted successfully
2023-07-11 21:27:36 INFO   Muxing
2023-07-11 21:27:42 INFO   Muxed successfully
```

Output: `/downloads/Офицеры.720p.WINK.WEB-DL.x264/Офицеры.720p.WINK.WEB-DL.x264.mkv`

## Features

- **Multiple media formats** support: progressive, MPEG-DASH, HLS (soon)
- **Concurrency**: multiple simultaneous connections for faster downloads
- **Retry** in case of request failure during download
- **HTTP2** support
- **Templates** for movie and episode filenames
- **Decryption** of MPEG-DASH stream with specified content key
