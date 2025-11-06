@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem === Resolve important paths ===
for %%I in ("%~dp0..") do set "REPO_ROOT=%%~fI"
set "CRM_APP_DIR=%REPO_ROOT%\crm-app"
set "EXPORT_SCRIPT=%REPO_ROOT%\deploy\loopia\export.ps1"
set "SYNC_SCRIPT=%REPO_ROOT%\deploy\loopia\sync.ps1"
set "ARTIFACT_DIR=%REPO_ROOT%\deploy\artifacts"
set "LOG_DIR=%REPO_ROOT%\deploy\logs"
set "ENV_FILE=%CRM_APP_DIR%\.env"

if not exist "%EXPORT_SCRIPT%" (
  echo [ERROR] Hittar inte exportskriptet: %EXPORT_SCRIPT%
  exit /b 1
)

if not exist "%SYNC_SCRIPT%" (
  echo [ERROR] Hittar inte synkskriptet: %SYNC_SCRIPT%
  exit /b 1
)

for /f %%I in ('pwsh -NoLogo -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "STAMP=%%I"

if not exist "%LOG_DIR%" (
  mkdir "%LOG_DIR%" 2>nul
)
if not exist "%ARTIFACT_DIR%" (
  mkdir "%ARTIFACT_DIR%" 2>nul
)

set "LOG_FILE=%LOG_DIR%\frontend-deploy-%STAMP%.log"
set "ARTIFACT=%ARTIFACT_DIR%\crm-frontend-%STAMP%.zip"
set "OUT_DIR=%CRM_APP_DIR%\out"

call :log "Startar frontend-distribution (timestamp %STAMP%)."

rem Förladda FTP-variabler så att underprocesser ärver dem
call :load_env_file >nul 2>nul
call :ensure_env FTPHOST
call :ensure_env FTPUSER
call :ensure_env FTPPASSWORD

call :log "Kor statisk export via deploy\loopia\export.ps1."
pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "& { Start-Transcript -Path '%LOG_FILE%' -Append | Out-Null; & '%EXPORT_SCRIPT%' -InstallDependencies; $code = $LASTEXITCODE; Stop-Transcript | Out-Null; exit $code }"
if errorlevel 1 (
  call :log "Export misslyckades. Se loggfil for detaljer."
  exit /b 1
)

if not exist "%OUT_DIR%" (
  call :log "Kunde inte hitta exporterad katalog: %OUT_DIR%"
  exit /b 1
)

call :log "Skapar zip-artefakt i %ARTIFACT%."
pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "& { Start-Transcript -Path '%LOG_FILE%' -Append | Out-Null; Compress-Archive -Path '%OUT_DIR%\*' -DestinationPath '%ARTIFACT%' -Force; $code = $LASTEXITCODE; Stop-Transcript | Out-Null; exit $code }"
if errorlevel 1 (
  call :log "Compress-Archive misslyckades."
  exit /b 1
)

call :log "Beraknar SHA256-checksumma for artefakt."
pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "& { Start-Transcript -Path '%LOG_FILE%' -Append | Out-Null; $hash = Get-FileHash -Algorithm SHA256 -Path '%ARTIFACT%'; Write-Host ('SHA256: ' + $hash.Hash); Stop-Transcript | Out-Null; }"

call :log "Kor FTP-synk (statisk export) via deploy\loopia\sync.ps1."
pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "& { Start-Transcript -Path '%LOG_FILE%' -Append | Out-Null; & '%SYNC_SCRIPT%' -OutPath '%OUT_DIR%'; $code = $LASTEXITCODE; Stop-Transcript | Out-Null; exit $code }"
if errorlevel 1 (
  call :log "FTP-synk misslyckades. Avbrot deployment."
  exit /b 1
)

call :log "Kor FTP-synk (PHP API) via deploy\loopia\sync.ps1."
pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "& { Start-Transcript -Path '%LOG_FILE%' -Append | Out-Null; & '%SYNC_SCRIPT%' -OutPath '%REPO_ROOT%\api' -RemotePath '/api' -EnsureRemotePath; $code = $LASTEXITCODE; Stop-Transcript | Out-Null; exit $code }"
if errorlevel 1 (
  call :log "FTP-synk for API misslyckades. Avbrot deployment."
  exit /b 1
)

call :log "Verifierar att webbplatsen svarar korrekt."
pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "& {
  Start-Transcript -Path '%LOG_FILE%' -Append | Out-Null;
  $url = 'https://crm.medlemsregistret.se';
  try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 20 -UseBasicParsing;
    if ($response.StatusCode -eq 200 -and $response.Content -match '__next') {
      Write-Host ('Verifiering ok: ' + $url + ' svarar med HTTP 200 och innehaller __next.');
      $code = 0;
    } else {
      Write-Error ('Ovantat svar fran ' + $url + ': ' + $response.StatusCode);
      $code = 1;
    }
  } catch {
    Write-Error $_;
    $code = 1;
  }
  Stop-Transcript | Out-Null;
  exit $code;
}"
if errorlevel 1 (
  call :log "Verifieringen misslyckades. Kontrollera loggfilen."
  exit /b 1
)

call :log "Distribution klar utan fel."
echo.
echo ================================================================================
echo  Distribution slutford.
echo  Loggfil: %LOG_FILE%
echo  Artefakt: %ARTIFACT%
echo ================================================================================
exit /b 0

:log
set "MESSAGE=%~1"
set "STAMP_LOG=%DATE% %TIME%"
echo %STAMP_LOG% - %MESSAGE%
>> "%LOG_FILE%" echo %STAMP_LOG% - %MESSAGE%
exit /b 0

:ensure_env
set "VAR_NAME=%~1"
call set "VAR_VALUE=%%%VAR_NAME%%%"
if "%VAR_VALUE%"=="" (
  call :load_env_file >nul
  call set "VAR_VALUE=%%%VAR_NAME%%%"
)
if "%VAR_VALUE%"=="" (
  set "MISSING_MSG=Miljovariabeln !VAR_NAME! saknas. Satt den i miljo eller i %ENV_FILE%."
  call :log "!MISSING_MSG!"
  exit /b 1
)
exit /b 0

:load_env_file
if not exist "%ENV_FILE%" (
  call :log "Ingen .env hittades pa %ENV_FILE%. Hoppar over inlasning av FTP-variabler."
  goto :eof
)
for /f "usebackq tokens=1* delims==" %%A in ("%ENV_FILE%") do (
  set "KEY=%%~A"
  if defined KEY (
    set "FIRST=!KEY:~0,1!"
    if not "!FIRST!"=="#" if not "!FIRST!"==";" if not "!FIRST!"=="[" (
      if /I "!KEY:~0,3!"=="FTP" (
        set "VALUE=%%~B"
        if defined VALUE (
          set "VALUE=!VALUE:"=!"
        )
        for /f "tokens=* delims= " %%V in ("!VALUE!") do set "VALUE=%%V"
        set "!KEY!=!VALUE!"
      ) else if /I "!KEY!"=="WINSCPCOM_PATH" (
        set "VALUE=%%~B"
        if defined VALUE (
          set "VALUE=!VALUE:"=!"
        )
        for /f "tokens=* delims= " %%V in ("!VALUE!") do set "VALUE=%%V"
        set "WINSCPCOM_PATH=!VALUE!"
      ) else if /I "!KEY!"=="WINSCP_PATH" (
        set "VALUE=%%~B"
        if defined VALUE (
          set "VALUE=!VALUE:"=!"
        )
        for /f "tokens=* delims= " %%V in ("!VALUE!") do set "VALUE=%%V"
        set "WINSCP_PATH=!VALUE!"
      )
    )
  )
)
exit /b 0
