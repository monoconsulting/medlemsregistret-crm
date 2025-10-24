@echo off
REM Build and start both dev and prod environments with --no-cache
echo ====================================
echo Building and starting CRM environments
echo ====================================
echo.

echo [1/4] Building dev environment (no cache)...
docker compose -f docker-compose.dev.yml --env-file .env.dev build --no-cache
if %errorlevel% neq 0 (
    echo ERROR: Dev build failed!
    exit /b 1
)

echo.
echo [2/4] Building prod environment (no cache)...
docker compose -f docker-compose.yml --env-file .env.prod build --no-cache
if %errorlevel% neq 0 (
    echo ERROR: Prod build failed!
    exit /b 1
)

echo.
echo [3/4] Starting dev environment...
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d
if %errorlevel% neq 0 (
    echo ERROR: Dev start failed!
    exit /b 1
)

echo.
echo [4/4] Starting prod environment...
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
