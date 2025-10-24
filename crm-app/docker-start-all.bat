@echo off
REM Start both dev and prod environments (without building)
echo ====================================
echo Starting CRM environments
echo ====================================
echo.

echo [1/2] Starting dev environment...
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d
if %errorlevel% neq 0 (
    echo ERROR: Dev start failed!
    exit /b 1
)

echo.
echo [2/2] Starting prod environment...
docker compose -f docker-compose.yml --env-file .env.prod up -d
if %errorlevel% neq 0 (
    echo ERROR: Prod start failed!
    exit /b 1
)

echo.
echo ====================================
echo SUCCESS: Both environments are running
echo ====================================
echo.
echo Dev environment:
echo   - App: http://localhost:3020
echo   - phpMyAdmin: http://localhost:8270
echo   - MySQL: localhost:3326
echo   - Redis: localhost:6429
echo.
echo Prod environment:
echo   - App: http://localhost:3010
echo   - phpMyAdmin: http://localhost:8170
echo   - MySQL: localhost:3316
echo   - Redis: localhost:6179
echo.
echo To view logs:
echo   docker compose -f docker-compose.dev.yml logs -f
echo   docker compose -f docker-compose.yml logs -f
echo.
