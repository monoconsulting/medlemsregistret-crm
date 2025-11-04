@echo off
REM ==============================================================================
REM MySQL single-database full dump from Loopia (schema + data + routines + triggers + events)
REM Filename format: PROJECT_DB_YYYY-MM-DD_HH-mm.sql  (colon is illegal in Windows)
REM Reads credentials from E:\projects\CRM\.env
REM ==============================================================================

REM ---- Load configuration from .env file ----------------------------------------
set "ENV_FILE=E:\projects\CRM\.env"
set "PROJECT=LOOPIA"
set "TARGET_DIRECTORY=E:\projects\CRM\.dbbackup"

REM Read Loopia database credentials from .env file
for /f "usebackq tokens=1,2 delims==" %%a in ("%ENV_FILE%") do (
    if "%%a"=="MARIADBHOST" set "HOST=%%b"
    if "%%a"=="MARIADBUSER" set "USER=%%b"
    if "%%a"=="MARIADBPASSWORD" set "PASSWORD=%%b"
    if "%%a"=="MARIADBDB" set "DB=%%b"
)

REM Verify that all required variables are set
if not defined HOST (
    echo [ERROR] MARIADBHOST not found in .env file
    exit /b 1
)
if not defined USER (
    echo [ERROR] MARIADBUSER not found in .env file
    exit /b 1
)
if not defined PASSWORD (
    echo [ERROR] MARIADBPASSWORD not found in .env file
    exit /b 1
)
if not defined DB (
    echo [ERROR] MARIADBDB not found in .env file
    exit /b 1
)

echo [INFO] Connecting to Loopia database: %HOST%/%DB%
REM ------------------------------------------------------------------------------

REM Create target directory if it doesn't exist
if not exist "%TARGET_DIRECTORY%" mkdir "%TARGET_DIRECTORY%"

REM Stable, locale-independent timestamp via PowerShell (avoids %DATE%/%TIME% quirks)
for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HH-mm"') do set "TS=%%I"

REM Build safe filename (Windows forbids colon in filenames, so we use HH-mm)
set "FILENAME=%PROJECT%_%DB%_%TS%.sql"

REM Run mysqldump for the specific database with important options:
REM --single-transaction: consistent snapshot without locking (InnoDB)
REM --routines/--triggers: include stored routines and triggers
REM --set-gtid-purged=OFF: safe for both GTID and non-GTID environments when importing
REM --skip-column-statistics: avoid "column statistics not supported" warning
REM Note: Loopia uses standard MySQL port 3306
REM Note: --events removed due to Loopia access restrictions
mysqldump ^
  --host=%HOST% ^
  --port=3306 ^
  --user=%USER% ^
  --password=%PASSWORD% ^
  --single-transaction ^
  --routines ^
  --triggers ^
  --skip-column-statistics ^
  --set-gtid-purged=OFF ^
  "%DB%" > "%TARGET_DIRECTORY%\%FILENAME%"

if errorlevel 1 (
  echo [ERROR] mysqldump failed. Check credentials, DB name, and that mysqldump is in PATH.
  exit /b 1
) else (
  echo [OK] Dump written to: "%TARGET_DIRECTORY%\%FILENAME%"
)
