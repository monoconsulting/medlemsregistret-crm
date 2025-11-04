@echo off
REM Stop both dev and prod environments
echo ====================================
echo Stopping CRM environments
echo ====================================
echo.

echo [1/2] Stopping dev environment...
docker compose -f docker-compose.dev.yml down
if %errorlevel% neq 0 (
    echo WARNING: Dev stop had issues
)

echo.
echo [2/2] Stopping prod environment...
docker compose -f docker-compose.yml down
if %errorlevel% neq 0 (
    echo WARNING: Prod stop had issues
)

echo.
echo ====================================
echo All environments stopped
echo ====================================
