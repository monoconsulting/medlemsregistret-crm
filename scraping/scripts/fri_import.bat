@echo off
REM ========================================
REM FRI Bulk Importer
REM Imports all scraped FRI JSON files to database
REM ========================================

echo.
echo ========================================
echo FRI BULK IMPORTER
echo ========================================
echo.
echo This script will import all FRI JSON files
echo from scraping/json/ into the database.
echo.
echo WARNING: This will update the database!
echo.
pause

cd /d "%~dp0..\..\"

REM Set the working directory to crm-app where the script is
cd crm-app

echo.
echo Starting FRI import...
echo.

REM Set DATABASE_URL to use production database on port 3316
set DATABASE_URL=mysql://crm_user:crm_password_change_me@localhost:3316/crm_db

REM Import all FRI JSON files (they have _FRI_ in the filename)
for %%f in (..\scraping\json\*_FRI_*.json) do (
    echo Importing %%f...
    npx tsx scripts/import-fixtures.ts --mode=update "%%f"
)

echo.
echo ========================================
echo IMPORT COMPLETED
echo ========================================
echo.
pause
