@echo off
REM ==============================================================================
REM MySQL single-database full dump (schema + data + routines + triggers + events)
REM Filename format: PROJECT_DB_YYYY-MM-DD_HH-mm.sql  (colon is illegal in Windows)
REM Configure your settings below and run this .bat
REM ==============================================================================

REM ---- User configuration -------------------------------------------------------
set "PROJECT=MCRM"
set "TARGET_DIRECTORY=E:\projects\CRM\.dbbackup"

REM Load database connection settings from .env file
set "ENV_FILE=E:\projects\CRM\.env"

if not exist "%ENV_FILE%" (
  echo [ERROR] .env file not found at: %ENV_FILE%
  exit /b 1
)

REM Parse .env file and set variables
for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
  set "line=%%a"
  REM Skip empty lines and comments
  if not "%%a"=="" if not "%%a:~0,1%"=="#" (
    REM Set environment variables from .env
    set "%%a=%%b"
  )
)

REM Use REMOTE SITE variables from .env
set "HOST=%DBHOST%"
set "PORT=%DBPORT%"
set "USER=%DBUSER%"
set "PASSWORD=%DBPASSWORD%"
set "DB=%DBDB%"

REM Validate required variables are set
if "%HOST%"=="" (
  echo [ERROR] DBHOST not found in .env file
  exit /b 1
)
if "%PORT%"=="" (
  echo [ERROR] DBPORT not found in .env file
  exit /b 1
)
if "%USER%"=="" (
  echo [ERROR] DBUSER not found in .env file
  exit /b 1
)
if "%PASSWORD%"=="" (
  echo [ERROR] DBPASSWORD not found in .env file
  exit /b 1
)
if "%DB%"=="" (
  echo [ERROR] DBDB not found in .env file
  exit /b 1
)
REM ------------------------------------------------------------------------------

REM Create target directory if it doesn't exist
if not exist "%TARGET_DIRECTORY%" mkdir "%TARGET_DIRECTORY%"

REM Stable, locale-independent timestamp via PowerShell (avoids %DATE%/%TIME% quirks)
for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm"') do set "TS=%%I"

REM Build safe filename (Windows forbids colon in filenames, so we use HH-mm)
set "FILENAME=%PROJECT%_%DB%_%TS%.sql"

REM Run mysqldump for the specific database with important options:
REM --single-transaction: consistent snapshot without locking (InnoDB)
REM --triggers: include triggers (routines/events disabled for remote hosting compatibility)
REM --set-gtid-purged=OFF: safe for both GTID and non-GTID environments when importing
REM --skip-column-statistics: avoid warnings on older MySQL versions
mysqldump ^
  --host=%HOST% ^
  --port=%PORT% ^
  --user=%USER% ^
  --password=%PASSWORD% ^
  --single-transaction ^
  --triggers ^
  --set-gtid-purged=OFF ^
  --skip-column-statistics ^
  "%DB%" > "%TARGET_DIRECTORY%\%FILENAME%"

if errorlevel 1 (
  echo [ERROR] mysqldump failed. Check credentials, DB name, and that mysqldump is in PATH.
  exit /b 1
) else (
  echo [OK] Dump written to: "%TARGET_DIRECTORY%\%FILENAME%"
)
