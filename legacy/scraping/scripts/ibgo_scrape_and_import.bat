@echo off
REM ========================================
REM IBGO Bulk Scrape and Import (Combined)
REM Scrapes all IBGO municipalities then imports to database
REM ========================================

echo.
echo ========================================
echo IBGO BULK SCRAPE AND IMPORT
echo ========================================
echo.
echo This script will:
echo   1. Scrape all IBGO municipalities
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

npx tsx scripts/bulk_ibgo_scrape_and_import.ts

echo.
echo ========================================
echo ALL OPERATIONS COMPLETED
echo ========================================
echo.
pause
