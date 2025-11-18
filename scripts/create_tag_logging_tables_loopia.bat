@echo off
REM ============================================================================
REM Create Tag Generation Logging Tables on Loopia
REM ============================================================================
REM This script creates the TagGenerationRun and TagGenerationLog tables
REM on the Loopia production database.
REM ============================================================================

setlocal

echo.
echo ===============================================================================
echo CREATE TAG GENERATION LOGGING TABLES ON LOOPIA
echo ===============================================================================
echo.
echo This will create the following tables on Loopia database:
echo   - TagGenerationRun  (tracks job executions)
echo   - TagGenerationLog  (detailed step-by-step logs)
echo.
echo Database: medlemsregistret_se_db_4
echo Host:     mysql513.loopia.se
echo.
echo WARNING: This will modify the production database!
echo.
pause

echo.
echo [1/2] Executing SQL script...
echo.

REM Get database credentials from api/config.php
cd /d "%~dp0.."

mysql -h mysql513.loopia.se -P 3306 -u walla3jk@m383902 -pBanjo192652 medlemsregistret_se_db_4 < scripts\create_tag_logging_tables.sql

if errorlevel 1 (
    echo.
    echo ERROR: Failed to create tables!
    echo.
    pause
    exit /b 1
)

echo.
echo [2/2] Verifying tables were created...
echo.

mysql -h mysql513.loopia.se -P 3306 -u walla3jk@m383902 -pBanjo192652 medlemsregistret_se_db_4 -e "SELECT COUNT(*) as TagGenerationRun_exists FROM information_schema.tables WHERE table_schema = 'medlemsregistret_se_db_4' AND table_name = 'TagGenerationRun'; SELECT COUNT(*) as TagGenerationLog_exists FROM information_schema.tables WHERE table_schema = 'medlemsregistret_se_db_4' AND table_name = 'TagGenerationLog';"

if errorlevel 1 (
    echo.
    echo ERROR: Failed to verify tables!
    echo.
    pause
    exit /b 1
)

echo.
echo ===============================================================================
echo COMPLETED SUCCESSFULLY
echo ===============================================================================
echo.
echo Tables created:
echo   - TagGenerationRun
echo   - TagGenerationLog
echo.
echo Tag generation scripts will now log to these tables.
echo.
pause
