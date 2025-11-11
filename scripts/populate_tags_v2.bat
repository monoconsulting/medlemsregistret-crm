@echo off
REM ============================================================================
REM Populate Tags v2 - Enhanced Tag Generation
REM ============================================================================
REM
REM This script:
REM 1. Creates a full database backup (if mode=execute)
REM 2. Runs the tag generation script
REM 3. Generates a CSV report
REM
REM Usage:
REM   populate_tags_v2.bat [mode] [source]
REM
REM Parameters:
REM   mode     dry-run (default) | execute
REM   source   db:baseline (default) | db:types | db:activities | db:categories
REM
REM Examples:
REM   populate_tags_v2.bat dry-run db:baseline
REM   populate_tags_v2.bat execute db:types
REM
REM ============================================================================

setlocal

echo.
echo ===============================================================================
echo POPULATE TAGS V2 - Enhanced Tag Generation
echo ===============================================================================
echo.

REM Parse parameters
set MODE=%1
if "%MODE%"=="" set MODE=dry-run

set SOURCE=%2
if "%SOURCE%"=="" set SOURCE=db:baseline

REM Generate job ID (use timestamp)
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set DATE=%%c%%a%%b
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do set TIME=%%a%%b
set TIME=%TIME: =0%
set JOBID=job_%DATE%_%TIME%

echo Mode:      %MODE%
echo Source:    %SOURCE%
echo Job ID:    %JOBID%
echo.

REM Validate mode
if not "%MODE%"=="dry-run" if not "%MODE%"=="execute" (
  echo ERROR: Invalid mode. Must be 'dry-run' or 'execute'
  echo.
  pause
  exit /b 1
)

REM Validate source
if not "%SOURCE%"=="db:baseline" if not "%SOURCE%"=="db:types" if not "%SOURCE%"=="db:activities" if not "%SOURCE%"=="db:categories" (
  echo ERROR: Invalid source. Must be 'db:baseline', 'db:types', 'db:activities', or 'db:categories'
  echo.
  pause
  exit /b 1
)

REM If execute mode, create backup first
if "%MODE%"=="execute" (
  echo WARNING: This will modify the database!
  echo.
  echo Press Ctrl+C to cancel, or
  pause

  echo.
  echo [1/3] Creating database backup...
  call "%~dp0dbbackup_full.bat"
  if errorlevel 1 (
    echo.
    echo ERROR: Backup failed! Aborting tag generation.
    echo.
    pause
    exit /b 1
  )
  echo       Backup completed successfully.
  echo.
)

REM Run tag generation script
echo [2/3] Running tag generation...
cd /d "%~dp0.."

php scripts/populate_tags_v2.php --mode=%MODE% --source=%SOURCE% --job-id=%JOBID%

if errorlevel 1 (
  echo.
  echo ERROR: Tag generation failed!
  echo See error messages above for details.
  echo.
  pause
  exit /b 1
)

echo.
echo [3/3] Tag generation completed.
echo.

if "%MODE%"=="execute" (
  echo Report saved to: reports/tag_generation/%JOBID%_*.csv
  echo.
  echo Changes have been applied to the database.
) else (
  echo Report saved to: reports/tag_generation/%JOBID%_*.csv
  echo.
  echo This was a DRY-RUN. No changes were made to the database.
  echo Run with 'execute' parameter to apply changes:
  echo   populate_tags_v2.bat execute %SOURCE%
)

echo.
echo ===============================================================================
echo COMPLETED SUCCESSFULLY
echo ===============================================================================
echo.
pause
