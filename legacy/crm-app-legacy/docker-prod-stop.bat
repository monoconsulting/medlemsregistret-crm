@echo off
cd /d "%~dp0"

echo ========================================
echo  Stoppar CRM Production Environment
echo ========================================
echo.

docker compose down

if errorlevel 1 (
    echo.
    echo [ERROR] Misslyckades att stoppa containers!
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Alla production containers stoppade och borttagna.
echo.
pause
