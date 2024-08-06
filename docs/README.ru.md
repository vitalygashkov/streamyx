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
  <img alt="" src="https://img.shields.io/github/v/release/vitalygashkov/streamyx?style=flat&color=black">
  <img alt="" src="https://img.shields.io/github/downloads/vitalygashkov/streamyx/latest/total?style=flat&color=black">
  <img alt="" src="https://img.shields.io/github/downloads/vitalygashkov/streamyx/total?style=flat&color=black">
</p>

Streamyx - программа для скачивания видео для последующего оффлайн просмотра.

<div align="left">
  <a href="https://github.com/vitalygashkov/streamyx/tree/main/README.md">English</a> •
  <span>Русский</span>
</div>

## Установка

Скачайте сборку из [последнего релиза](https://github.com/vitalygashkov/streamyx/releases/latest) (для Windows: `streamyx-win-x64.zip`) и разархивируйте.

> [!NOTE]  
> Для скачивания защищенного контента необходимы данные пользовательского **клиента Widevine**. Обычно это два файла - `device_client_id_blob` и `device_private_key`. Их следует поместить в папку `files` рядом с запускаемой утилитой.

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
