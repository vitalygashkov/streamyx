<p align="center">
  <h1 align="center">Стримикс</h1>
</p>

<p align="center">
  <a aria-label="Дискорд" href="https://discord.gg/fHMgAgc7gU">
    <img alt="" src="https://img.shields.io/badge/Дискорд-сервер-black?style=flat&logo=Discord&logoColor=white">
  </a>
  <a aria-label="Телеграм" href="https://t.me/streamyxtalks">
    <img alt="" src="https://img.shields.io/badge/Телеграм-чат-black?style=flat&logo=Telegram&logoColor=white">
  </a>
  <img alt="" src="https://img.shields.io/github/downloads/vitalygashkov/streamyx/latest/total?style=flat&color=black">
  <img alt="" src="https://img.shields.io/github/downloads/vitalygashkov/streamyx/total?style=flat&color=black">
</p>

Стримикс - программа для скачивания видео для последующего оффлайн просмотра.

<div align="left">
  <a href="https://github.com/vitalygashkov/streamyx/tree/main/README.md">English</a> •
  <span>Русский</span>
</div>

### Встроенные сервисы

<a aria-label="Crunchyroll" href="https://crunchyroll.com"><img alt="" src="https://img.shields.io/badge/Crunchyroll-F47521?style=flat-square&logo=crunchyroll&logoColor=white"></a>
<a aria-label="Weibo" href="https://m.weibo.cn/"><img alt="" src="https://img.shields.io/badge/Weibo-D62B2A?style=flat-square&logo=sina-weibo&logoColor=white"></a>
<a aria-label="SoundCloud" href="https://soundcloud.com/"><img alt="" src="https://img.shields.io/badge/SoundCloud-FF3300?style=flat-square&logo=soundcloud&logoColor=white"></a>
<a aria-label="VK" href="https://vk.com/video"><img alt="" src="https://img.shields.io/badge/VK-0077ff.svg?&style=flat-square&logo=vk&logoColor=white"></a>
<a aria-label="Rutube" href="https://rutube.ru/"><img alt="" src="https://img.shields.io/badge/RUTUBE-100943?style=flat-square&logoColor=white"></a>
<a aria-label="VirtualRoom" href="https://virtualroom.ru/"><img alt="" src="https://img.shields.io/badge/VirtualRoom-01aade?style=flat-square&logoColor=white"></a>
<a aria-label="НТВ" href="https://www.ntv.ru/"><img alt="" src="https://img.shields.io/badge/НТВ-00aa01?style=flat-square&logoColor=white"></a>

> Вы можете добавить поддержку любого стриминг-сервиса самостоятельно! Посмотрите [пример](https://github.com/vitalygashkov/streamyx-service-example), чтобы узнать больше.

## Установка

Скачайте сборку из [последнего релиза](https://github.com/vitalygashkov/streamyx/releases/latest) и разархивируйте.

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

- **Поддержка нескольких медиаформатов**: прогрессивный, MPEG-DASH, HLS
- **Параллелизм**: несколько одновременных соединений для более быстрой закачки
- **Повторное выполнение** запросов в случае неудачи во время скачивания
- Поддержка **HTTP2**
- **Шаблоны** названий файлов для фильмов и эпизодов
- **Дешифрование** MPEG-DASH потока с указанным ключом контента
