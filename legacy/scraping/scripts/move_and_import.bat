@echo off
REM ============================================================================
REM Move scraped files and import to database
REM ============================================================================
REM Run this AFTER bulk scraping is complete.
REM This will move files from crm-app/scraping/ to scraping/ and import.
REM ============================================================================

echo.
echo ===============================================================================
echo MOVE FILES AND IMPORT TO DATABASE
echo ===============================================================================
echo.
pause

cd /d "%~dp0..\.."

REM Create target directories
if not exist "scraping\json\" mkdir "scraping\json\"
if not exist "scraping\logs\" mkdir "scraping\logs\"

REM Move JSON files from crm-app/scraping to scraping
echo.
echo Moving JSON files...
if exist "crm-app\scraping\json\*.json" (
    move /Y "crm-app\scraping\json\*.json" "scraping\json\" 2>nul
)
if exist "crm-app\scraping\json\*.jsonl" (
    move /Y "crm-app\scraping\json\*.jsonl" "scraping\json\" 2>nul
)

REM Move log files
echo Moving log files...
if exist "crm-app\scraping\logs\*.log" (
    move /Y "crm-app\scraping\logs\*.log" "scraping\logs\" 2>nul
)

echo.
echo Files moved successfully!
echo.
echo ===============================================================================
echo IMPORTING TO DATABASE
echo ===============================================================================
echo.

cd crm-app

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
pause
