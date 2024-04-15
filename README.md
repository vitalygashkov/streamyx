# Streamyx

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/vitalygashkov/streamyx/publish.yml?branch=main&logo=github&style=flat&color=grey)
![GitHub Release](https://img.shields.io/github/v/release/vitalygashkov/streamyx?style=flat&color=grey)
![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/vitalygashkov/streamyx/latest/total?style=flat&color=grey)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/vitalygashkov/streamyx/total?style=flat&color=grey)

Streamyx is a command-line tool that allows you to download videos from streaming services for offline-viewing.

<div align="left">
  <span>English</span> •
  <a href="https://github.com/vitalygashkov/streamyx/tree/main/docs/README.ru.md">Pусский</a>
</div>

## Installation

### Prerequisites

**Device private keys** are required for DRM-protected content and also should be placed in `files` folder.

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

## Streaming services

| Title                                    | Status      | Details                               |
| ---------------------------------------- | ----------- | ------------------------------------- |
| [Crunchyroll](https://crunchyroll.com/)  | Supported   |                                       |
| [Kinopoisk](https://hd.kinopoisk.ru/)    | Supported   |                                       |
| [IVI](https://www.ivi.ru/)               | Supported   | 3D movies are currently unavailable   |
| [Wink](https://wink.ru/)                 | Supported   | Live videos are currently unavailable |
| [Okko](https://okko.tv/)                 | Supported   |                                       |
| [KION](https://kion.ru/)                 | Planned     |                                       |
| [PREMIER](https://premier.one/)          | Planned     |                                       |
| [START](https://start.ru/)               | Planned     |                                       |
| [Amediateka](https://www.amediateka.ru/) | Planned     |                                       |
| [NTV](https://www.ntv.ru/)               | In progress | Only download link extracting         |

## Development

Compile sources and run:

```shell
npx streamyx -q 720p "https://wink.ru/movies/dostat-nozhi-year-2019-93328166"
```
