@echo off
REM ============================================================================
REM Actor Smartbook Bulk Scraping Only
REM ============================================================================
REM Scrapes all municipalities with Actor Smartbook endpoints.
REM Run actor_import.bat afterwards to import the data.
REM ============================================================================

echo.
echo ===============================================================================
echo ACTOR SMARTBOOK BULK SCRAPING
echo ===============================================================================
echo.
echo This will scrape all municipalities with Actor Smartbook API endpoints.
echo.
echo Estimated time: 15-20 minutes
echo.
pause

cd /d "%~dp0..\..\"

REM Set the working directory to crm-app where the script is
cd crm-app

echo.
echo Starting bulk scraping...
echo.

REM Set DATABASE_URL to use production database on port 3316
set DATABASE_URL=mysql://crm_user:crm_password_change_me@localhost:3316/crm_db

call npx tsx scripts/bulk_actor_scrape.ts

if errorlevel 1 (
    echo.
    echo ERROR: Scraping failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ===============================================================================
echo SCRAPING COMPLETED
echo ===============================================================================
echo.
echo Output files saved to: scraping\json\
echo Log files saved to: scraping\logs\
echo.
echo Next step: Run actor_import.bat to import data into database
echo.
pause
