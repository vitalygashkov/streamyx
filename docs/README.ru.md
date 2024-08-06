# Streamyx

![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/vitalygashkov/streamyx/publish.yml?branch=main&logo=github&style=flat&color=grey)
![GitHub Release](https://img.shields.io/github/v/release/vitalygashkov/streamyx?style=flat&color=grey)
![GitHub Downloads (all assets, latest release)](https://img.shields.io/github/downloads/vitalygashkov/streamyx/latest/total?style=flat&color=grey)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/vitalygashkov/streamyx/total?style=flat&color=grey)

Streamyx - программа для скачивания контента со стриминговых сервисов для последующего оффлайн просмотра.

[Присоединяйтесь к сообществу в Discord (EN)](https://discord.gg/jkxq3VT7) • [Присоединяйтесь к сообществу в Telegram (RU)](https://t.me/streamyx_ru)

<div align="left">
  <a href="https://github.com/vitalygashkov/streamyx/tree/main/README.md">English</a> •
  <span>Русский</span>
</div>

## Установка

### Зависимости

Данные пользовательского **клиента Widevine** необходимы для скачивания защищенного контента. Обычно это два файла - `device_client_id_blob` и `device_private_key`. Их следует поместить в папку `files` рядом с запускаемой утилитой.

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
streamyx https://vk.com/video-21665793_456241344
22:42:00.012 INFO : Fetching metadata...
22:42:00.655 INFO : Fetching metadata finished
22:42:00.656 INFO : Смешарики. День учителя Смешарики
17:42:00.696 INFO : ✔ Смешарики.День.учителя.Смешарики.VK.WEB-DL.x264 ∙ VIDEO
```

Результат: `/downloads/Смешарики.День.учителя.Смешарики.VK.WEB-DL.x264/Смешарики.День.учителя.Смешарики.VK.WEB-DL.x264.mp4`

## Особенности

- **Поддержка нескольких медиаформатов**: прогрессивный, MPEG-DASH, HLS (скоро)
- **Параллелизм**: несколько одновременных соединений для более быстрой закачки
- **Повторное выполнение** запросов в случае неудачи во время скачивания
- Поддержка **HTTP2**
- **Шаблоны** названий файлов для фильмов и эпизодов
- **Дешифрование** MPEG-DASH потока с указанным ключом контента
