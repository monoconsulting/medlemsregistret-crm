@echo off
REM Script to clear all association data from the CRM database
REM This will delete all scraped association data while preserving reference data

echo ========================================
echo Clear Association Data Script
echo ========================================
echo.
echo This will DELETE all association data from the database!
echo Reference data (municipalities) will be preserved.
echo.
set /p confirm="Are you sure you want to continue? (Y/N): "

if /i not "%confirm%"=="Y" (
    echo Operation cancelled.
    exit /b 0
)

echo.
echo Executing SQL script...
echo.

REM Set default database configuration (production environment)
set MYSQL_HOST=localhost
set MYSQL_PORT=3316
set MYSQL_USER=crm_user
set MYSQL_DATABASE=crm_db

REM Read password from .env file if it exists
set ENV_FILE=%~dp0..\crm-app\.env
if exist "%ENV_FILE%" (
    for /f "usebackq tokens=1,2 delims==" %%a in ("%ENV_FILE%") do (
        if "%%a"=="MYSQL_PASSWORD_PROD" set MYSQL_PASSWORD=%%b
    )
)

REM If password not found in .env, prompt user
if not defined MYSQL_PASSWORD (
    set /p MYSQL_PASSWORD="Enter MySQL password: "
)

REM Execute the SQL script
mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < "%~dp0clear_association_data.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS: Association data cleared!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ERROR: Failed to clear data
    echo Error code: %ERRORLEVEL%
    echo ========================================
    echo.
    echo Possible issues:
    echo - MySQL is not running
    echo - MySQL command-line client is not installed or not in PATH
    echo - Database credentials are incorrect
    echo - Database does not exist
    echo.
)

pause
