@echo off
REM ========================================
REM RBOK Test Scraper
REM Tests scraping on a single municipality (Nora - small dataset)
REM ========================================

echo.
echo ========================================
echo RBOK TEST SCRAPER
echo ========================================
echo.
echo This script will test RBOK scraping on Söderhamn municipality
echo (existing test script for quick validation)
echo.
echo Output: scraping/json/
echo Logs: scraping/logs/
echo.
pause

cd /d "%~dp0..\..\"

REM Set the working directory to crm-app where the script is
cd crm-app

echo.
echo Starting RBOK test scraper (Söderhamn)...
echo.

REM Set DATABASE_URL to use production database on port 3316
set DATABASE_URL=mysql://crm_user:crm_password_change_me@localhost:3316/crm_db

REM Run Söderhamn scraper (one of the existing test scripts)
npx tsx ../scraping/scripts/soderhamn_scrape.ts

echo.
echo ========================================
echo TEST SCRAPING COMPLETED
echo ========================================
echo.
echo Check scraping/json/ for output files
echo Check scraping/logs/ for log files
echo.
echo Next steps:
echo 1. Review JSON output for data quality
echo 2. If test successful, run rbok_scrape.bat for all municipalities
echo.
pause
