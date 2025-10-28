@echo off
REM ========================================
REM RBOK Bulk Importer
REM Imports all scraped RBOK JSON files to database
REM ========================================

echo.
echo ========================================
echo RBOK BULK IMPORTER
echo ========================================
echo.
echo This script will import all RBOK JSON files
echo from scraping/json/ into the database.
echo.
echo WARNING: This will update the database!
echo.
pause

cd /d "%~dp0..\..\"

REM Set the working directory to crm-app where the script is
cd crm-app

echo.
echo Starting RBOK import...
echo.

REM Set DATABASE_URL to use production database on port 3316
set DATABASE_URL=mysql://crm_user:crm_password_change_me@localhost:3316/crm_db

npx tsx scripts/bulk_rbok_import.ts

echo.
echo ========================================
echo IMPORT COMPLETED
echo ========================================
echo.
pause
