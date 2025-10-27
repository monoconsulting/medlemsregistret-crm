@echo off
REM ========================================
REM IBGO Bulk Importer
REM Imports all scraped IBGO JSON files to database
REM ========================================

echo.
echo ========================================
echo IBGO BULK IMPORTER
echo ========================================
echo.
echo This script will import all IBGO JSON files
echo from scraping/json/ into the database.
echo.
echo WARNING: This will update the database!
echo.
pause

cd /d "%~dp0..\..\"

REM Set the working directory to crm-app where the script is
cd crm-app

echo.
echo Starting IBGO import...
echo.

REM Set DATABASE_URL to use production database on port 3316
set DATABASE_URL=mysql://crm_user:crm_password_change_me@localhost:3316/crm_db

npx tsx scripts/bulk_ibgo_import.ts

echo.
echo ========================================
echo IMPORT COMPLETED
echo ========================================
echo.
pause
