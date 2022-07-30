# Streamyx

Cross-platform application that allows you to download content from streaming services.

Supported providers: Kinopoisk, Okko, Crunchyroll, Wakanim.

## Quick start

- Download **[latest release](https://github.com/vitalygashkov/streamyx/releases/latest)**
- Download **[ffmpeg](https://ffmpeg.org/download.html)**, **[mp4decrypt](https://www.bento4.com/downloads/)** and put executables into `/files/bin/`
- Put folder with **device private keys** into `/files/cdm/` (required for DRM-protected content)

Open system console/terminal from the folder where the executable file is located and run the application:

```
./streamyx [options] <URL>
```

Use `-h` option to see all available options.

## Build

- Install dependencies: `npm i`
- Build executables: `npm run build`

## Requirements for development

- [Node.js](https://nodejs.org) v16 or later
- **Widecrypt** closed-source library (located in `./packages`)
