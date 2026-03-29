# landing-site

Отдельный репозиторий под лендинг. Репо намеренно изолировано от `landing-api`, чтобы фронтенд, деплой и переменные окружения не пересекались с другими продуктами.

## Структура

```text
landing-site/
  public/
    index.html
  .env.example
  package.json
  server.mjs
```

## Что уже настроено

- `public/index.html` содержит текущую standalone-версию лендинга.
- `server.mjs` раздаёт статику на `PORT`, подходит для Railway.
- `GET /health` нужен для healthcheck.
- `GET /config.js` отдаёт публичную конфигурацию для будущей интеграции с `landing-api`.
- `.github/workflows/ci.yml` прогоняет базовый CI на push и pull request.

## Локальный запуск

```bash
cp .env.example .env
npm run dev
```

Открыть:

```text
http://localhost:3000
```

## Railway

Минимальный набор переменных:

```text
APP_ENV=production
PUBLIC_API_BASE_URL=https://api.example.com
```

Railway подхватит `npm start` автоматически.

## Git workflow

- `main` -> production
- `staging` -> pre-release
- `feature/*` -> рабочие ветки под задачи

## Следующий шаг

Когда пришлёшь URL репозитория `landing-api`, я соберу ему такой же чистый каркас и свяжу оба проекта по env-схеме.
