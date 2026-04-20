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

## Общее сохранение смен для всех пользователей

Чтобы смены были одинаковыми у всех, нужно включить облачное хранилище (Firebase Realtime Database).

### 1. Создайте Firebase проект

1. Откройте Firebase Console и создайте проект.
2. В разделе Build -> Realtime Database создайте базу.
3. В rules временно укажите открытый доступ (без авторизации):

```json
{
	"rules": {
		".read": true,
		".write": true
	}
}
```

### 2. Добавьте переменные окружения

1. Скопируйте `.env.example` в `.env`.
2. Заполните значения из Firebase Web App config.

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 3. Добавьте секреты в GitHub для Pages

Для деплоя через GitHub Actions задайте те же переменные в:
Settings -> Secrets and variables -> Actions -> New repository variable.

Имена должны быть такими же, как в `.env.example`.

После следующего push в `main` сайт на GitHub Pages начнет использовать общее облачное хранилище.

## Полезные команды

```bash
npm run lint
npm run build
npm run preview
```
