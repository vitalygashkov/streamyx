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

Стримикс позволяет легко и быстро скачивать видео для последующего оффлайн просмотра.

[English](https://github.com/vitalygashkov/streamyx/tree/main/README.md) • Pусский

Стримикс имеет расширения для [Crunchyroll](https://gitlab.com/streamyx-extensions/crunchyroll), [RUTUBE](https://gitlab.com/streamyx-extensions/rutube) и многих других сервисов.

## Установка

Стримикс поддерживает Windows (x64), macOS (x64 & Apple Silicon) и Linux (x64).

#### Windows

```shell
powershell -c "irm streamyx.ru/install.ps1 | iex"
```

#### Linux & macOS

```shell
curl -fsSL https://streamyx.ru/install.sh | bash
```

### Обновление

Чтобы обновить Стримикс до последней версии, выполните следующую команду:

```shell
streamyx upgrade
```

## Запуск

```shell
streamyx <command> [...options]
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

Результат: `C:\Users\Admin\Downloads\Смешарики.День.учителя.Смешарики.VK.WEB-DL.x264/Смешарики.День.учителя.Смешарики.VK.WEB-DL.x264.mp4`

## Особенности

- **Поддержка нескольких медиаформатов**: прогрессивный, MPEG-DASH, HLS
- **Параллелизм**: несколько одновременных соединений для более быстрой закачки
- **Повторное выполнение** запросов в случае неудачи во время скачивания
- Поддержка **HTTP2**
- **Шаблоны** названий файлов для фильмов и эпизодов
- **Дешифрование** MPEG-DASH потока с указанным ключом контента
