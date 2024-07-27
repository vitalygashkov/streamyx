# Streamyx

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/vitalygashkov/streamyx/publish.yml?branch=main&logo=github&style=flat&color=grey)
![GitHub Release](https://img.shields.io/github/v/release/vitalygashkov/streamyx?style=flat&color=grey)
![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/vitalygashkov/streamyx/latest/total?style=flat&color=grey)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/vitalygashkov/streamyx/total?style=flat&color=grey)

Streamyx - программа для скачивания контента со стриминговых сервисов для последующего оффлайн просмотра.

<div align="left">
  <a href="https://github.com/vitalygashkov/streamyx/tree/main/README.md">English</a> •
  <span>Русский</span>
</div>

## Установка

### Зависимости

**Приватные ключи устройства** необходимы для DRM-защищенного контента. Их следует поместить в папку `files` рядом с запускаемой утилитой.

### Скачивание

Скачайте сборку из [последнего релиза](https://github.com/vitalygashkov/streamyx/releases/latest) (для Windows: `streamyx-win-x64.zip`), разархивируйте и создайте папку `files` с необходимыми файлами рядом с разархивированным исполняемым файлом.

Пример итоговой структуры файлов и папок для Windows:

```
/streamyx.exe
/files/device_client_id_blob
/files/device_private_key
```

## Запуск

Откройте терминал в папке, где находится скачанный исполняемый файл и вызовите утилиту из терминала:

```shell
streamyx [OPTIONS] URL [URL...]
```

Используйте вызов с аргументом `-h`, чтобы получить справку по всем доступным опциям.

### Скачивание видео

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

Результат: `/downloads/Офицеры.720p.WINK.WEB-DL.x264/Офицеры.720p.WINK.WEB-DL.x264.mkv`

## Особенности

- **Поддержка нескольких медиаформатов**: прогрессивный, MPEG-DASH, HLS (скоро)
- **Параллелизм**: несколько одновременных соединений для более быстрой закачки
- **Повторное выполнение** запросов в случае неудачи во время скачивания
- Поддержка **HTTP2**
- **Шаблоны** названий файлов для фильмов и эпизодов
- **Получение ключей контента** с помощью PSSH и URL сервера лицензий
- **Дешифрование** MPEG-DASH потока с указанным ключом контента

## Поддерживаемые сервисы

<div style="display: flex; gap: 4px; flex-wrap: wrap">
<img src="https://images.kinorium.com/web/vod/vod_crunchyroll.svg?3" />
<div style="display: flex; padding: 8px; width: fit-content; background-color: #444">
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Kinopoisk_black_color_logo_%282021-present%29.svg/2560px-Kinopoisk_black_color_logo_%282021-present%29.svg.png" height="16" style="filter: invert(1); border-radius: 3px;" />
</div>
<img src="https://images.kinorium.com/web/vod/vod_ivi.svg?3" />
<img src="https://images.kinorium.com/web/vod/vod_okko.svg?3" />
<img src="https://images.kinorium.com/web/vod/vod_wink.svg?3" />
<img src="https://images.kinorium.com/web/vod/vod_amediateka.svg?3" />
</div>
