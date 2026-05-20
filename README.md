# FastID

Отдельный проект для публичного канала FastID: Angular SPA + Spring BFF.

## Состав

| Компонент | Описание |
|-----------|----------|
| **FastIdFront** | Angular SPA (бывший PoliTechFrontPublic) |
| **FastIdAPI** | Spring BFF — проксирует вызовы в PoliTech API, хранит сервисную сессию на сервере |

Браузер обращается только к фронту (`/api/*` проксируется nginx → BFF). CORS не нужен.

## Требования

- Docker + Docker Compose
- Запущенный **PoliTech API** (из репозитория [PtDocker](https://github.com/OlegSirik/PtDocker))

## Быстрый старт

```bash
cp .env.example .env
# отредактируйте SERVICE_USER_LOGIN, SERVICE_PASSWORD, POLITECH_API_URL

docker compose up --build
```

Откройте: http://localhost:8082/{tenant}/start

## Переменные окружения

| Переменная | Описание |
|------------|----------|
| `POLITECH_API_URL` | URL PoliTech API (по умолчанию `http://host.docker.internal:8080`) |
| `TENANT_CODE` | Код тенанта |
| `SERVICE_USER_LOGIN` | Логин сервисного аккаунта (только на BFF) |
| `SERVICE_PASSWORD` | Пароль сервисного аккаунта (только на BFF) |
| `SERVICE_CLIENT_ID` | Client ID для login |
| `FASTID_FRONT_PORT` | Внешний порт фронта (8082) |

## API BFF

| Method | Path | Описание |
|--------|------|----------|
| GET | `/api/public/session` | Статус серверной сессии |
| POST | `/api/public/v1/{tenant}/fastid/secure-link` | QR / защищённая ссылка |
| POST | `/api/public/v1/{tenant}/fastid/decrypt` | Расшифровка токена |
| GET | `/api/public/v1/{tenant}/fastid/resolve?q=` | Resolve токена |
| POST | `/api/public/v1/{tenant}/fastid/premium` | Расчёт премии |

## Локальная разработка

### BFF

```bash
cd FastIdAPI
./gradlew bootRun
```

### Frontend

```bash
cd FastIdFront
npm ci
npm start
```

Для dev добавьте proxy в `angular.json` или используйте docker compose.

## Безопасность

- Учётные данные сервисного аккаунта **не передаются в браузер**
- Rate limiting на BFF (premium / decrypt / secure-link)
- Backend PoliTech API не должен быть доступен из интернета напрямую в production
