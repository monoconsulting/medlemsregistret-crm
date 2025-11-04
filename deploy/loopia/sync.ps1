param(
  [string] $OutPath,
  [string] $WinScpPath,
  [string] $FtpHost = (${env:FTPADDRESS} ? ${env:FTPADDRESS} : ${env:FTPHOST}),
  [int] $FtpPort = (${env:FTPPORT} ? [int]${env:FTPPORT} : 21),
  [string] $FtpUser = ${env:FTPUSER},
  [string] $FtpPassword = ${env:FTPPASSWORD},
  [string] $RemotePath = (${env:FTP_REMOTE_PATH} ? ${env:FTP_REMOTE_PATH} : '/'),
  [switch] $Passive = $true
)

$ErrorActionPreference = 'Stop'


$envFile = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\crm-app\.env'))
if (Test-Path $envFile) {
  foreach ($line in Get-Content $envFile) {
    if ($line -match '^(?<key>[A-Za-z0-9_]+)=(?<value>.*)$') {
      $key = $matches['key']
      $value = $matches['value'].Trim()
      if ($value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Trim('"')
      }
      switch -Regex ($key) {
        '^FTP' { if (-not $PSBoundParameters.ContainsKey('FtpHost') -and $key -eq 'FTPADDRESS') { $env:FTPADDRESS = $value }
                 if (-not $PSBoundParameters.ContainsKey('FtpHost') -and $key -eq 'FTPHOST') { $env:FTPHOST = $value }
                 if (-not $PSBoundParameters.ContainsKey('FtpUser') -and $key -eq 'FTPUSER') { $env:FTPUSER = $value }
                 if (-not $PSBoundParameters.ContainsKey('FtpPassword') -and $key -eq 'FTPPASSWORD') { $env:FTPPASSWORD = $value }
                 if (-not $PSBoundParameters.ContainsKey('FtpPort') -and $key -eq 'FTPPORT') { $env:FTPPORT = $value }
                 if ($key -eq 'FTP_REMOTE_PATH' -and -not $PSBoundParameters.ContainsKey('RemotePath')) { $env:FTP_REMOTE_PATH = $value }
               }
        '^WINSCPCOM_PATH$' { if (-not $PSBoundParameters.ContainsKey('WinScpPath')) { $env:WINSCPCOM_PATH = $value } }
        '^WINSCP_PATH$' { if (-not $PSBoundParameters.ContainsKey('WinScpPath')) { $env:WINSCP_PATH = $value } }
      }
    }
  }
}

if (-not $WinScpPath) {
  if ($env:WINSCPCOM_PATH) {
    $WinScpPath = $env:WINSCPCOM_PATH
  } elseif ($env:WINSCP_PATH) {
    $WinScpPath = $env:WINSCP_PATH
  } else {
    $WinScpPath = Join-Path ${env:ProgramFiles} 'WinSCP\WinSCP.com'
    if (-not (Test-Path $WinScpPath) -and ${env:ProgramFiles(x86)} ) {
      $WinScpPath = Join-Path ${env:ProgramFiles(x86)} 'WinSCP\WinSCP.com'
    }
  }
}

if (-not $FtpHost) {
  if ($env:FTP_REMOTE_HOST) { $FtpHost = $env:FTP_REMOTE_HOST }
  elseif ($env:FTPADDRESS) { $FtpHost = $env:FTPADDRESS }
  elseif ($env:FTPHOST) { $FtpHost = $env:FTPHOST }
}
if (-not $FtpUser -and $env:FTPUSER) { $FtpUser = $env:FTPUSER }
if (-not $FtpPassword -and $env:FTPPASSWORD) { $FtpPassword = $env:FTPPASSWORD }
if (-not $PSBoundParameters.ContainsKey('FtpPort') -and $env:FTPPORT) { $FtpPort = [int]$env:FTPPORT }
if ($RemotePath -eq '/' -and $env:FTP_REMOTE_PATH) { $RemotePath = $env:FTP_REMOTE_PATH }

if ($WinScpPath -and -not (Test-Path $WinScpPath)) {
  $alt = [System.IO.Path]::ChangeExtension($WinScpPath, '.com')
  if (Test-Path $alt) {
    $WinScpPath = $alt
  }
}
if ($WinScpPath.ToLower().EndsWith('.exe')) {
  $altExe = [System.IO.Path]::ChangeExtension($WinScpPath, '.com')
  if (Test-Path $altExe) {
    $WinScpPath = $altExe
  }
}

if (-not $OutPath) {
  $projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
  $OutPath = Join-Path $projectRoot 'crm-app\out'
}

if (-not (Test-Path $OutPath)) {
  throw "Hittar inte byggutdata på $OutPath. Kör export.ps1 först."
}

if (-not (Test-Path $WinScpPath)) {
  throw "WinSCP.com hittades inte på $WinScpPath. Installera WinSCP eller ange sökväg med -WinScpPath."
}

if (-not $FtpHost -or -not $FtpUser -or -not $FtpPassword) {
  throw 'FTP-uppgifter saknas. Sätt miljövariablerna FTPHOST, FTPUSER och FTPPASSWORD eller ange parametrar.'
}

$escapedPassword = [System.Uri]::EscapeDataString($FtpPassword)
$passiveFlag = if ($Passive) { '-passive=on' } else { '-passive=off' }
$useTls = $false
if ($env:FTP_USE_TLS) {
  $value = $env:FTP_USE_TLS.ToLower()
  if ($value -in @('1','true','yes','on')) { $useTls = $true }
}
$tlsFlag = if ($useTls) { '-explicitssl' } else { '' }

$ftpUrl = "ftp://${FtpUser}:$escapedPassword@${FtpHost}:${FtpPort}"

$tempScript = New-TemporaryFile

@"
open $ftpUrl $tlsFlag $passiveFlag
option confirm off
option batch continue
lcd "$OutPath"
cd "$RemotePath"
option transfer binary
synchronize remote -delete
exit
"@ | Set-Content -Path $tempScript -Encoding ASCII

try {
  & $WinScpPath '/ini=nul' "/script=$tempScript"
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "WinSCP-synk misslyckades (exitkod $exitCode)."
  }
}
finally {
  Remove-Item $tempScript -ErrorAction SilentlyContinue
}

Write-Host "==> Synkningen mot ${FtpHost}:${FtpPort}/$RemotePath är klar." -ForegroundColor Green
