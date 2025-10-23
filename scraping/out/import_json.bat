@echo off
REM Import JSON file to PostgreSQL database
REM Usage: import_json.bat <json-file>
REM Example: import_json.bat Borås_associations_abc123.json

if "%~1"=="" (
    echo Usage: import_json.bat ^<json-file^>
    echo Example: import_json.bat Boras_associations_abc123.json
    exit /b 1
)

echo Importing %1 to database...
npx tsx "%~dp0import_to_db.ts" "%~1"

if errorlevel 1 (
    echo.
    echo Import failed!
    pause
    exit /b 1
)

echo.
echo Import successful!
pause
