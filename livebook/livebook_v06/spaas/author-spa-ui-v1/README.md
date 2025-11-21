# LiveBook Author UI (Minimal)

**Что это**: простейший UI для кросс-разметки двух RC и запуска арбитража ИИ.

## Локальный запуск
1) Убедитесь, что backend работает на http://localhost:8787
2) Установите зависимости и стартуйте:
```bash
pnpm install
pnpm dev
```
3) Откройте адрес, который выведет Vite (обычно http://localhost:5173)

## Деплой в Object Storage
```bash
pnpm build
```
Загрузите `dist/` в бакет, включите статический хостинг.
Index и Error документы = `index.html`.

> В `src/main.jsx` базовый URL API зашит как http://localhost:8787 — замените на ваш публичный адрес при проде.
