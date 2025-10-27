@echo off
cd /d "%~dp0"

echo ========================================
echo  CRM Development Environment Rebuild
echo  (No Cache - Full Rebuild)
echo ========================================
echo.

REM Kontrollera om Docker körs
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Desktop är inte igång!
    echo Starta Docker Desktop och försök igen.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker Desktop körs
echo.
echo Stoppar befintliga containers...
echo.

docker compose -f docker-compose.dev.yml down

echo.
echo Bygger om containers utan cache...
echo Detta kan ta flera minuter...
echo.

docker compose -f docker-compose.dev.yml build --no-cache

if errorlevel 1 (
    echo.
    echo [ERROR] Misslyckades att bygga containers!
    echo.
    pause
    exit /b 1
)

echo.
echo Startar development containers...
echo.

docker compose -f docker-compose.dev.yml up -d

if errorlevel 1 (
    echo.
    echo [ERROR] Misslyckades att starta containers!
    echo Kontrollera loggarna med: docker compose -f docker-compose.dev.yml logs
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Tjänster ombyggda och startade!
echo ========================================
echo.
echo - Next.js App: http://localhost:3020
echo - MySQL:       localhost:3316 (user: crm_user, pass: crm_password_change_me)
echo - phpMyAdmin:  http://localhost:8170
echo - Redis:       localhost:6279
echo.
echo Kommandon:
echo   Visa app logs:  docker compose -f docker-compose.dev.yml logs -f app
echo   Stoppa:         docker compose -f docker-compose.dev.yml down
echo   Starta om:      docker compose -f docker-compose.dev.yml restart
echo.
pause
