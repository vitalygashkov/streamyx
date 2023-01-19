<h1 align="center">Streamyx</h1>

<div align="center">
  <a href="https://github.com/vitalygashkov/streamyx/releases">
    <img src="https://img.shields.io/github/release/vitalygashkov/streamyx.svg" alt="GitHub release">
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

The following dependencies are required and should be downloaded and placed in this path: `/files/bin/`.

- **[FFmpeg](https://ffmpeg.org/download.html)**
- **[mp4decrypt](https://www.bento4.com/downloads/)**

> **Note**: FFmpeg and mp4decrypt does not affect the download, only affects the final file merge and decryption.

**Device private keys** are required for DRM-protected content and should be placed in this path: `/files/cdm/`

### Install

Download the binary file from [latest release](https://github.com/vitalygashkov/streamyx/releases/latest) and put `/files/` folder with dependencies next to it.

## Getting Started

Open terminal from the folder where the binary file is located and run the application.

Usage:

```
streamyx [OPTIONS] URL
```

Use `-h` option to see all available options.

### Download a video

```console
$ streamyx "https://hd.kinopoisk.ru/film/46c5df252dc1a790b82d1a00fcf44812?content_tab=series&episode=10&season=5&watch="
1/1/2022, 10:00:27 AM  INFO   Fetching metadata and generate download configs...
1/1/2022, 10:00:28 AM  INFO   Rick and Morty • S5:E10 • Rickmurai Jack • Full HD • 1017 MB
1/1/2022, 10:00:28 AM  INFO   █████▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ 9%
```

## Streaming services

| Title                                    | Status       | Details                                            |
| ---------------------------------------- | ------------ | -------------------------------------------------- |
| [Кинопоиск](https://hd.kinopoisk.ru/)    | Supported    |                                                    |
| [Иви](https://www.ivi.ru/)               | Experimental | 3D/seasons/series in progress                      |
| [Wink](https://wink.ru/)                 | Experimental | Seasons/series in progress                         |
| [Okko](https://okko.tv/)                 | Supported    |                                                    |
| [KION](https://kion.ru/)                 | Planned      |                                                    |
| [PREMIER](https://premier.one/)          | Planned      |                                                    |
| [START](https://start.ru/)               | Planned      |                                                    |
| [Amediateka](https://www.amediateka.ru/) | Planned      |                                                    |
| [Crunchyroll](https://crunchyroll.com/)  | Experimental |                                                    |
| [НТВ](https://www.ntv.ru/)               | In progress  | Only download link extracting                      |
| [Wakanim](https://www.wakanim.tv/)       | Deprecated   | No longer maintained due to merge with Crunchyroll |
