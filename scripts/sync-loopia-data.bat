@echo off
setlocal enabledelayedexpansion

REM === Configuration ===
set "LOCAL_HOST=127.0.0.1"
set "LOCAL_PORT=3316"
set "LOCAL_USER=root"
set "LOCAL_PASSWORD=root_password_change_me"
set "LOCAL_DB=crm_db"

set "REMOTE_HOST=mysql513.loopia.se"
set "REMOTE_PORT=3306"
set "REMOTE_USER=walla3jk@m383902"
set "REMOTE_PASSWORD=Banjo192652"
set "REMOTE_DB=medlemsregistret_se_db_4"

REM Tables to copy (data only)
set "TABLE_LIST=Activity Association Contact DescriptionSection Group GroupMembership ImportBatch Municipality Note ScrapeRun Tag Task _AssociationTags"

REM === Paths ===
set "TEMP_DIR=%~dp0..\temp"
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

set "STAMP=%DATE:~0,4%%DATE:~5,2%%DATE:~8,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
set "DATA_FILE=%TEMP_DIR%\crm_sync_data_%STAMP%.sql"
set "IMPORT_FILE=%TEMP_DIR%\crm_sync_import_%STAMP%.sql"

echo Exporting data from local MySQL (%LOCAL_DB%)...
mysqldump -h %LOCAL_HOST% -P %LOCAL_PORT% -u %LOCAL_USER% -p%LOCAL_PASSWORD% ^
  --single-transaction --quick --compact --skip-triggers --skip-add-locks --set-gtid-purged=OFF ^
  --no-create-info %LOCAL_DB% %TABLE_LIST% > "%DATA_FILE%"
if errorlevel 1 (
  echo [ERROR] mysqldump failed.
  goto :end
)

echo Preparing import script...
set "tick=`"
(
  echo SET FOREIGN_KEY_CHECKS=0;
  echo SET UNIQUE_CHECKS=0;
  echo SET check_constraint_checks=0;
  echo SET sql_notes=0;
  for %%T in (%TABLE_LIST%) do echo TRUNCATE TABLE %tick%%%T%tick%;
  echo SET sql_notes=1;
) > "%IMPORT_FILE%"
type "%DATA_FILE%" >> "%IMPORT_FILE%"
(
  echo;
  echo SET check_constraint_checks=1;
  echo SET UNIQUE_CHECKS=1;
  echo SET FOREIGN_KEY_CHECKS=1;
) >> "%IMPORT_FILE%"

echo Importing data into Loopia (%REMOTE_DB%)...
cmd /c ""mysql" -h %REMOTE_HOST% -P %REMOTE_PORT% -u "%REMOTE_USER%" -p%REMOTE_PASSWORD% %REMOTE_DB% < "%IMPORT_FILE%""
if errorlevel 1 (
  echo [ERROR] mysql import failed.
  goto :end
)

echo Done! Data file: %DATA_FILE%
echo Import file: %IMPORT_FILE%
goto :end

:end
endlocal
