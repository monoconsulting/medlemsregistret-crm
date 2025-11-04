@echo off
cd /d "%~dp0"

echo ========================================
echo  Playwright Installation
echo ========================================
echo.

echo Installing @playwright/test...
call npm install -D @playwright/test

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install @playwright/test
    pause
    exit /b 1
)

echo.
echo Installing Playwright browsers...
call npx playwright install

if errorlevel 1 (
    echo.
    echo [ERROR] Failed to install Playwright browsers
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Playwright installation complete!
echo ========================================
echo.
echo Available test commands:
echo   npm test                    - Run all tests
echo   npm run test:ui             - Run tests with UI mode
echo   npm run test:debug          - Run tests in debug mode
echo   npm run test:municipalities - Run only municipality tests
echo   npm run test:headed         - Run tests with browser visible
echo.
echo To run tests, first start the application:
echo   .\docker-dev-start.bat
echo   or
echo   .\docker-prod-start.bat
echo.
pause
