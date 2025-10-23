@echo off
echo Starting CRM Production Environment...
docker compose up -d --build
echo.
echo Services started:
echo - MySQL:       localhost:3306
echo - phpMyAdmin:  http://localhost:8080
echo - Redis:       localhost:6379
echo - Next.js App: http://localhost:3000
echo.
echo Run 'docker compose logs -f app' to see app logs
pause
