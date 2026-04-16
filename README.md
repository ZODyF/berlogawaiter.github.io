# Календарь рабочих смен официантов

Приложение на React + Vite + Tailwind CSS.

## Локальный запуск

1. Установить зависимости:

```bash
npm install
```

2. Запустить dev-сервер:

```bash
npm run dev
```

3. Открыть адрес из терминала (обычно http://localhost:5173).

## Деплой на GitHub Pages

В проект уже добавлен workflow:

- .github/workflows/deploy-pages.yml

Он автоматически публикует сайт в GitHub Pages после push в ветку main.

### Что нужно сделать в GitHub

1. Создайте репозиторий и запушьте проект в ветку main.
2. Откройте репозиторий в GitHub: Settings -> Pages.
3. В Source выберите GitHub Actions.
4. Сделайте push в main (или вручную запустите workflow Deploy to GitHub Pages).
5. Дождитесь завершения workflow в Actions.
6. Ссылка на сайт появится в разделе Settings -> Pages.

## Полезные команды

```bash
npm run lint
npm run build
npm run preview
```
