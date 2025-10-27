@echo off
echo ========================================
echo IBGO API Endpoint Discovery and Verification
echo ========================================
echo.

cd /d "%~dp0..\.."

echo Running endpoint discovery script...
echo.

npx tsx scraping/scripts/check_ibgo_endpoints.ts

echo.
echo ========================================
echo Script completed
echo ========================================
pause
