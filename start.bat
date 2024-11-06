@echo off
REM Запуск ngrok в отдельном процессе
start "" ngrok http --domain=easy-supposedly-primate.ngrok-free.app 5588

REM Установка переменной окружения NODE_ENV в production и запуск Node.js
set NODE_ENV=production
node index.mjs

pause
