<p align="center">
  <h1 align="center">Azot</h1>
</p>

<p align="center">
  <a aria-label="Join Discord community" href="https://discord.gg/fHMgAgc7gU">
    <img alt="" src="https://img.shields.io/badge/Discord-server-black?style=flat&logo=Discord&logoColor=white">
  </a>
  <a aria-label="Join Telegram community" href="https://t.me/AzotApp">
    <img alt="" src="https://img.shields.io/badge/Telegram-channel-black?style=flat&logo=Telegram&logoColor=white">
  </a>
  <img alt="" src="https://img.shields.io/github/downloads/azot-labs/azot/latest/total?style=flat&color=black">
  <img alt="" src="https://img.shields.io/github/downloads/azot-labs/azot/total?style=flat&color=black">
</p>

Azot (formerly known as Streamyx) makes it simple, fast and delightful to download videos, so you can watch it offline later.

English • [Pусский](https://github.com/azot-labs/azot/tree/main/README.ru.md)

You can create your own extension. Examples are available at [azot-labs/extensions](https://github.com/azot-labs/extensions).

## Install

Azot supports Windows (x64), macOS (x64 & Apple Silicon) and Linux (x64).

#### Windows

```shell
powershell -c "irm azot.so/install.ps1 | iex"
```

#### Linux & macOS

```shell
curl -fsSL https://azot.so/install.sh | bash
```

### Upgrade

To upgrade to the latest version of Azot, run:

```shell
azot upgrade
```

## Getting Started

```shell
azot <command> [...options]
```

Use `--help` flag to see all available options.

### Download a video

```shell
azot https://vk.com/video-29093629_456239905
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
