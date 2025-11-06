@echo off
REM ========================================
REM IBGO Bulk Scraper
REM Scrapes all IBGO municipalities and saves to JSON
REM ========================================

echo.
echo ========================================
echo IBGO BULK SCRAPER
echo ========================================
echo.
echo This script will scrape all IBGO municipalities
echo and save the results to JSON files.
echo.
echo Output: scraping/json/
echo Logs: scraping/logs/
echo.
pause

cd /d "%~dp0..\..\"

REM Set the working directory to crm-app where the script is
cd crm-app

echo.
echo Starting IBGO scraper...
echo.

REM Set DATABASE_URL to use production database on port 3316
set DATABASE_URL=mysql://crm_user:crm_password_change_me@localhost:3316/crm_db

npx tsx scripts/bulk_ibgo_scrape.ts

echo.
echo ========================================
echo SCRAPING COMPLETED
echo ========================================
echo.
echo Check scraping/json/ for output files
echo Check scraping/logs/ for log files
echo.
pause
