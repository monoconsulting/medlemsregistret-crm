@echo off
setlocal EnableExtensions

if "%~3"=="" (
  echo Usage: %~nx0 ^<baseUrl^> ^<email^> ^<password^>
  exit /b 64
)

set "BASE_URL=%~1"
set "CRM_VERIFICATION_EMAIL=%~2"
set "CRM_VERIFICATION_PASSWORD=%~3"

set "SCRIPT_DIR=%~dp0"
set "PS_SCRIPT=%SCRIPT_DIR%curl-smoke.ps1"

if not exist "%PS_SCRIPT%" (
  echo [ERROR] Hittar inte PowerShell-skriptet: %PS_SCRIPT%
  exit /b 1
)

powershell -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%PS_SCRIPT%" -BaseUrl "%BASE_URL%"
set "EXITCODE=%ERRORLEVEL%"

if %EXITCODE% NEQ 0 (
  echo [ERROR] Smoke-test misslyckades (exitkod %EXITCODE%).
) else (
  echo [INFO] Smoke-test genomfoerdes utan fel.
)

exit /b %EXITCODE%
