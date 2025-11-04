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

echo.
echo ========================================
echo  Production containers startade!
echo ========================================
echo.
echo - Next.js App: http://localhost:3010
echo - Backend API: http://localhost:4040
echo - MySQL:       localhost:3316 (user: crm_user, pass: crm_password_change_me)
echo - phpMyAdmin:  http://localhost:8170
echo - Redis:       localhost:6179
echo.
echo Kommandon:
echo   Visa API logs:  docker compose logs -f backend
echo   Visa app logs:  docker compose logs -f app
echo   Stoppa:         docker compose down
echo.
pause
