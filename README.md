<h1 align="center">Streamyx</h1>

<div align="center">
  <a href="https://github.com/vitalygashkov/streamyx/releases">
    <img src="https://img.shields.io/github/actions/workflow/status/vitalygashkov/streamyx/publish.yml?branch=main&logo=github" alt="Deploy">
  </a>
  <a href="https://github.com/vitalygashkov/streamyx/releases">
    <img src="https://img.shields.io/github/release/vitalygashkov/streamyx.svg" alt="Latest release">
  </a>
  <a href="https://github.com/vitalygashkov/streamyx/releases">
    <img src="https://img.shields.io/github/downloads/vitalygashkov/streamyx/latest/total" alt="Latest downloads">
  </a>
  <a href="https://github.com/vitalygashkov/streamyx/releases">
    <img src="https://img.shields.io/github/downloads/vitalygashkov/streamyx/total" alt="Total downloads">
  </a>
</div>

Streamyx is a command-line tool that allows you to download videos from streaming services for offline-viewing.

## Installation

### Prerequisites

The following dependencies are required and should be downloaded and placed in `files` folder.

- **[FFmpeg](https://ffmpeg.org/download.html)**
- **[Shaka Packager](https://github.com/shaka-project/shaka-packager/releases)**

> **Note**: FFmpeg and Shaka Packager does not affect the download, only affects the final file merge and decryption.

**Device private keys** are required for DRM-protected content and also should be placed in `files` folder.

### Install

Download build from [latest release](https://github.com/vitalygashkov/streamyx/releases/latest) (for Windows: `streamyx-win-x64.zip`), unzip, rename executable to `streamyx` and put `files` folder with all stuff next to it.

Final structure of files and folders (example for Windows):

```
/streamyx.exe
/files/ffmpeg.exe
/files/mp4decrypt.exe
/files/device_client_id_blob
/files/device_private_key
```

## Getting Started

Open terminal from the folder where the executable file is located and run the application.

Usage:

```
streamyx [OPTIONS] URL [URL...]
```

Use `-h` option to see all available options.

### Download a video

```console
$ streamyx -q 720p https://wink.ru/movies/ofitsery-year-1971
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

| Title                                    | Status       | Details                               |
| ---------------------------------------- | ------------ | ------------------------------------- |
| [Кинопоиск](https://hd.kinopoisk.ru/)    | Supported    |                                       |
| [Иви](https://www.ivi.ru/)               | Supported    | 3D movies are currently unavailable   |
| [Wink](https://wink.ru/)                 | Supported    | Live videos are currently unavailable |
| [Okko](https://okko.tv/)                 | Supported    |                                       |
| [KION](https://kion.ru/)                 | Planned      |                                       |
| [PREMIER](https://premier.one/)          | Planned      |                                       |
| [START](https://start.ru/)               | Planned      |                                       |
| [Amediateka](https://www.amediateka.ru/) | Planned      |                                       |
| [Crunchyroll](https://crunchyroll.com/)  | Experimental |                                       |
| [НТВ](https://www.ntv.ru/)               | In progress  | Only download link extracting         |

## Development

Compile sources and run:

`npx streamyx -q 720p "https://wink.ru/movies/dostat-nozhi-year-2019-93328166"`
