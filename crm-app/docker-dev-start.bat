@echo off
cd /d "%~dp0"

echo ========================================
echo  CRM Development Environment Startup
echo ========================================
echo.

REM Kontrollera om Docker kors
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Desktop ar inte igong!
    echo Starta Docker Desktop och forsok igen.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker Desktop kors
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
echo  Tjänster startade!
echo ========================================
echo.
echo - Next.js App: http://localhost:3000
echo - MySQL:       localhost:3306 (user: crm_user, pass: crm_password)
echo - phpMyAdmin:  http://localhost:8080
echo - Redis:       localhost:6379
echo.
echo Kommandon:
echo   Visa app logs:  docker compose -f docker-compose.dev.yml logs -f app
echo   Stoppa:         docker compose -f docker-compose.dev.yml down
echo   Starta om:      docker compose -f docker-compose.dev.yml restart
echo.
pause
