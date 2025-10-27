@echo off
REM ============================================================================
REM Populate Tags from Association Fields
REM ============================================================================
REM This script populates the Tag table with data from association fields
REM (types, activities, categories) and links them to associations.
REM ============================================================================

echo.
echo ===============================================================================
echo POPULATE TAGS FROM ASSOCIATION FIELDS
echo ===============================================================================
echo.
echo This will:
echo 1. Extract tags from types, activities, and categories fields
echo 2. Create unique tags (lowercase, deduplicated)
echo 3. Link associations to these tags (overwrites existing links)
echo.
echo WARNING: This will modify the database!
echo.
pause

cd /d "%~dp0..\crm-app"

echo.
echo ===============================================================================
echo STARTING TAG POPULATION
echo ===============================================================================
echo.

call npm run db:populate-tags

if errorlevel 1 (
    echo.
    echo ERROR: Tag population failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ===============================================================================
echo COMPLETED SUCCESSFULLY
echo ===============================================================================
echo.
echo Tags have been populated from association fields.
echo.
pause