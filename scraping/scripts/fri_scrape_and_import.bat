@echo off
REM ========================================
REM FRI Bulk Scrape and Import (Combined)
REM Scrapes all FRI municipalities then imports to database
REM ========================================

echo.
echo ========================================
echo FRI BULK SCRAPE AND IMPORT
echo ========================================
echo.
echo This script will:
echo   1. Scrape all FRI municipalities
echo   2. Import the data to database
echo.
echo Output: scraping/json/
echo Logs: scraping/logs/
echo.
echo WARNING: This will update the database!
echo.
pause

cd /d "%~dp0..\..\"

REM Set the working directory to crm-app where the script is
cd crm-app

echo.
echo Starting combined scrape and import process...
echo.

REM Set DATABASE_URL to use production database on port 3316
set DATABASE_URL=mysql://crm_user:crm_password_change_me@localhost:3316/crm_db

echo.
echo ========================================
echo STEP 1: SCRAPING FRI MUNICIPALITIES
echo ========================================
echo.
npx tsx scripts/bulk_fri_scrape.ts

if errorlevel 1 (
    echo.
    echo ERROR: Scraping failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo STEP 2: IMPORTING TO DATABASE
echo ========================================
echo.

REM Import all FRI JSON files (they have _FRI_ in the filename)
for %%f in (..\scraping\json\*_FRI_*.json) do (
    echo Importing %%f...
    npx tsx scripts/import-fixtures.ts --mode=update "%%f"
)

echo.
echo ========================================
echo ALL OPERATIONS COMPLETED
echo ========================================
echo.
pause
