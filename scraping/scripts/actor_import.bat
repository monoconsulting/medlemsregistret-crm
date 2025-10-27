@echo off
REM ============================================================================
REM Actor Smartbook Database Import Only
REM ============================================================================
REM Imports all Actor Smartbook JSON files into the database.
REM Run actor_scrape.bat first to generate the data files.
REM ============================================================================

echo.
echo ===============================================================================
echo ACTOR SMARTBOOK DATABASE IMPORT
echo ===============================================================================
echo.
echo This will import all Actor Smartbook JSON files into the database.
echo.
echo Estimated time: 1-2 minutes
echo.
pause

cd /d "%~dp0..\..\"

REM Set the working directory to crm-app where the script is
cd crm-app

echo.
echo Starting database import...
echo.

REM Set DATABASE_URL to use production database on port 3316
set DATABASE_URL=mysql://crm_user:crm_password_change_me@localhost:3316/crm_db

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
echo IMPORT COMPLETED
echo ===============================================================================
echo.
echo All associations have been imported into the database!
echo.
pause
