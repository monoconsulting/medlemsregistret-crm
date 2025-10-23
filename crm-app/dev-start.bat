@echo off
echo Starting CRM Development Environment...
docker compose -f docker-compose.dev.yml up -d
echo.
echo Services started:
echo - MySQL:       localhost:3306 (user: crm_user, password: crm_password)
echo - phpMyAdmin:  http://localhost:8080
echo - Redis:       localhost:6379
echo - Next.js App: http://localhost:3000
echo.
echo Run 'docker compose -f docker-compose.dev.yml logs -f app' to see app logs
pause
