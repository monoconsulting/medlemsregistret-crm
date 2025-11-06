@echo off
REM ========================================
REM RBOK Scrape and Import (Combined)
REM Scrapes all RBOK municipalities and imports to database
REM ========================================

echo.
echo ========================================
echo RBOK SCRAPE AND IMPORT
echo ========================================
echo.
echo This script will:
echo 1. Scrape all RBOK municipalities (53 total)
echo 2. Import the results to the database
echo.
echo WARNING: This process will take several hours and
echo will update the database!
echo.
pause

cd /d "%~dp0..\..\"

REM Set the working directory to crm-app where the script is
cd crm-app

echo.
echo Starting RBOK scrape and import...
echo.

REM Set DATABASE_URL to use production database on port 3316
set DATABASE_URL=mysql://crm_user:crm_password_change_me@localhost:3316/crm_db

npx tsx scripts/bulk_rbok_scrape_and_import.ts

echo.
echo ========================================
echo ALL OPERATIONS COMPLETED
echo ========================================
echo.
pause
