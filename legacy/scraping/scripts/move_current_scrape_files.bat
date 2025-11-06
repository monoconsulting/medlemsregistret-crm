@echo off
REM ============================================================================
REM Move Current Scrape Files to Correct Location
REM ============================================================================
REM Moves JSON and log files from crm-app/scraping/ to scraping/
REM Run this AFTER the current bulk scraping is complete.
REM ============================================================================

echo.
echo ===============================================================================
echo MOVE SCRAPE FILES TO CORRECT LOCATION
echo ===============================================================================
echo.
echo This will move files from:
echo   FROM: crm-app\scraping\json\
echo   TO:   scraping\json\
echo.
echo Make sure the current scraping is complete before running this!
echo.
pause

cd /d "%~dp0..\.."

REM Check if source directory exists
if not exist "crm-app\scraping\json\" (
    echo.
    echo ERROR: Source directory crm-app\scraping\json\ does not exist
    echo.
    pause
    exit /b 1
)

REM Create target directories if they don't exist
if not exist "scraping\json\" mkdir "scraping\json\"
if not exist "scraping\logs\" mkdir "scraping\logs\"

echo.
echo Moving JSON files...
move /Y "crm-app\scraping\json\*.json" "scraping\json\" 2>nul
move /Y "crm-app\scraping\json\*.jsonl" "scraping\json\" 2>nul

echo.
echo Moving log files...
if exist "crm-app\scraping\logs\" (
    move /Y "crm-app\scraping\logs\*.log" "scraping\logs\" 2>nul
)

echo.
echo ===============================================================================
echo FILES MOVED SUCCESSFULLY
echo ===============================================================================
echo.
echo All scrape files are now in the correct location:
echo - JSON files: scraping\json\
echo - Log files:  scraping\logs\
echo.
echo You can now run: actor_import.bat
echo.
pause
