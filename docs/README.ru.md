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

### Предварительная настройка

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

## Стриминговые сервисы

| Сервис                                   | Статус         | Детали                                  |
| ---------------------------------------- | -------------- | --------------------------------------- |
| [Crunchyroll](https://crunchyroll.com/)  | Поддерживается |                                         |
| [Кинопоиск](https://hd.kinopoisk.ru/)    | Поддерживается |                                         |
| [Иви](https://www.ivi.ru/)               | Поддерживается | Скачивание 3D фильмов недоступно        |
| [Wink](https://wink.ru/)                 | Поддерживается | Скачивание прямых трансляций недоступно |
| [Okko](https://okko.tv/)                 | Поддерживается |                                         |
| [KION](https://kion.ru/)                 | Запланировано  |                                         |
| [PREMIER](https://premier.one/)          | Запланировано  |                                         |
| [Старт](https://start.ru/)               | Запланировано  |                                         |
| [Амедиатека](https://www.amediateka.ru/) | Запланировано  |                                         |
| [НТВ](https://www.ntv.ru/)               | В работе       | Только извлечение ссылки манифеста      |

## Разработка

Скомпилируйте исходники и выполните команду:

```shell
npx streamyx -q 720p "https://wink.ru/movies/dostat-nozhi-year-2019-93328166"
```
