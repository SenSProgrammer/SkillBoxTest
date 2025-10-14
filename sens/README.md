# SENS • Now: Shanti (MVP)

Полный шаблон репозитория для запуска первой страницы `/now/shanti`
и двух серверлесс-функций в **Yandex Cloud**:

- `now-shanti-analyze` — расчёт ориентира (Force/Power) и кратких шагов,
- `ai-router` — заглушка под генерацию четверостишия (позже подключите YaGPT/OpenAI).

## Что внутри
- `frontend/now/shanti.html` — статическая страница (HTMX + Alpine.js).
- `functions/now-shanti-analyze` — функция Node.js 18 (HTML-фрагмент ответа).
- `functions/ai-router` — функция Node.js 18 (рыба под стих).
- `infra/apigw-shanti.yaml` — OpenAPI спецификация для API Gateway.
- `scripts/deploy_functions.sh` — автодеплой через `yc cli` (создаёт/обновляет функции и API).
- `.gitignore`, `LICENSE` (MIT).

## Требования
- Настроенный **YC CLI** (`yc init`) с активным cloud/folder.
- `jq` в системе (для парсинга JSON в скрипте деплоя).
- Node.js 18+ (если будете расширять функции локально).

## Быстрый старт

### 1) Деплой функций и API
```bash
bash scripts/deploy_functions.sh
```
Скрипт создаст ZIP-архивы функций, задеплоит версии, создаст/обновит API Gateway `sens-now` и выведет домен.

### 2) Публикация фронтенда
- Залейте каталог `frontend/` в **Object Storage** как статический сайт (или на любой веб-сервер).
- Если фронт и API на разных доменах — замените пути `/api/...` в `frontend/now/shanti.html` на полный домен гейтвея.

> Рекомендуется раздавать фронт и API под **одним доменом** с проксированием `/api/` → API Gateway.

## Замечания
- `ai-router` сейчас возвращает стих-заглушку. Подключение YaGPT/OpenAI — следующим шагом.
- В проде добавьте Lockbox для секретов и middleware для cookie-сессий/QR-переноса.
