@echo off
REM ============================================================================
REM Actor Smartbook Bulk Scraping and Import
REM ============================================================================
REM This script scrapes all municipalities with Actor Smartbook endpoints
REM and then imports the data into the database.
REM ============================================================================

echo.
echo ===============================================================================
echo ACTOR SMARTBOOK BULK SCRAPING AND IMPORT
echo ===============================================================================
echo.
echo This will:
echo 1. Scrape all municipalities with Actor Smartbook API endpoints
echo 2. Import all scraped data into the database
echo.
echo Estimated time: 15-20 minutes for scraping + 1-2 minutes for import
echo.
pause

cd /d "%~dp0..\..\"

REM Set the working directory to crm-app where the script is
cd crm-app

REM Set DATABASE_URL to use production database on port 3316
set DATABASE_URL=mysql://crm_user:crm_password_change_me@localhost:3316/crm_db

echo.
echo ===============================================================================
echo STEP 1: BULK SCRAPING
echo ===============================================================================
echo.
echo Starting bulk scraping of all Actor Smartbook municipalities...
echo.

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
echo STEP 2: DATABASE IMPORT
echo ===============================================================================
echo.
echo Starting database import of scraped data...
echo.

call npx tsx scripts/bulk_actor_import.ts

if errorlevel 1 (
    echo.
    echo ERROR: Import failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ===============================================================================
echo COMPLETED SUCCESSFULLY
echo ===============================================================================
echo.
echo All Actor Smartbook municipalities have been scraped and imported!
echo.
echo Output files location: scraping\json\
echo Log files location: scraping\logs\
echo.
pause
