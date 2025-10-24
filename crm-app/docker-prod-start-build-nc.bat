@echo off
cd /d "%~dp0"

echo ========================================
echo  CRM Production Environment Startup
echo ========================================
echo.
docker compose down

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
echo Bygger och startar production containers...
echo Detta kan ta nagra minuter vid forsta gangen.
echo.

docker compose build --no-cache
docker compose up -d

if errorlevel 1 (
    echo.
    echo [ERROR] Misslyckades att starta containers!
    echo Kontrollera loggarna med: docker compose logs
    echo.
    pause
    exit /b 1
)

