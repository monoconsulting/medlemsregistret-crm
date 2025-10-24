@echo off
cd /d "%~dp0"

echo ========================================
echo  Stoppar CRM Development Environment
echo ========================================
echo.

docker compose -f docker-compose.dev.yml down

if errorlevel 1 (
    echo.
    echo [ERROR] Misslyckades att stoppa containers!
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Alla development containers stoppade och borttagna.
echo.
pause
