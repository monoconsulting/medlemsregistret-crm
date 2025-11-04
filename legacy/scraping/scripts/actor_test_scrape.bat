@echo off
REM ============================================================================
REM Actor Smartbook Test Scraping
REM ============================================================================
REM Tests scraping on Gnosjo (72 associations) before running full bulk scrape.
REM ============================================================================

echo.
echo ===============================================================================
echo ACTOR SMARTBOOK TEST SCRAPING
echo ===============================================================================
echo.
echo This will test scraping on Gnosjo municipality (72 associations).
echo Use this to verify everything works before running the full bulk scrape.
echo.
echo Estimated time: ~30 seconds
echo.
pause

cd /d "%~dp0..\..\crm-app"

echo.
echo Starting test scraping on Gnosjo...
echo.

call npx tsx scripts/test_actor_scrape.ts

if errorlevel 1 (
    echo.
    echo ERROR: Test scraping failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ===============================================================================
echo TEST COMPLETED
echo ===============================================================================
echo.
echo Test files saved to: scraping\json\
echo.
echo Next steps:
echo 1. Review the generated JSON files
echo 2. Test import with: actor_import.bat
echo 3. If successful, run full scraping with: actor_scrape.bat
echo.
pause
