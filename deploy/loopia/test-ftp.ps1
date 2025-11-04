
param(
  [string] $RemotePath = '/',
  [string] $WinScpPath,
  [switch] $Clean = $false
)

$ErrorActionPreference = 'Stop'

$envFile = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\crm-app\.env'))
if (Test-Path $envFile) {
  foreach ($line in Get-Content $envFile) {
    if ($line -match '^(?<key>[A-Za-z0-9_]+)=(?<value>.*)$') {
      $key = $matches['key']
      $value = $matches['value']
      if ([string]::IsNullOrWhiteSpace($value)) { continue }
      $value = $value.Trim()
      if ($value.StartsWith('"') -and $value.EndsWith('"')) {
        $value = $value.Trim('"')
      }
      switch -Regex ($key) {
        '^FTP' { Set-Item -Path Env:$key -Value $value }
        '^WINSCPCOM_PATH$' { Set-Item -Path Env:WINSCPCOM_PATH -Value $value }
        '^WINSCP_PATH$' { Set-Item -Path Env:WINSCP_PATH -Value $value }
      }
    }
  }
}

function Resolve-WinScpPath {
  param([string] $ConfiguredPath)

  if ($ConfiguredPath) { return $ConfiguredPath }
  if ($env:WINSCPCOM_PATH) { return $env:WINSCPCOM_PATH }
  if ($env:WINSCP_PATH) { return $env:WINSCP_PATH }

  $defaultPath = Join-Path ${env:ProgramFiles} 'WinSCP\WinSCP.com'
  if (Test-Path $defaultPath) { return $defaultPath }

  $programFilesX86 = [Environment]::GetEnvironmentVariable('ProgramFiles(x86)')
  if ($programFilesX86) {
    $fallback = Join-Path $programFilesX86 'WinSCP\WinSCP.com'
    if (Test-Path $fallback) { return $fallback }
  }

  return $defaultPath
}

$ftpHost = if ($env:FTPADDRESS) { $env:FTPADDRESS } else { $env:FTPHOST }
$ftpUser = $env:FTPUSER
$ftpPassword = $env:FTPPASSWORD
$ftpPort = if ($env:FTPPORT) { [int]$env:FTPPORT } else { 21 }

if (-not $ftpHost -or -not $ftpUser -or -not $ftpPassword) {
  throw 'FTP-uppgifter saknas. Kontrollera FTPHOST/FTPUSER/FTPPASSWORD i crm-app/.env.'
}

$resolvedWinScp = Resolve-WinScpPath -ConfiguredPath $WinScpPath
if ($resolvedWinScp.ToLower().EndsWith('.exe')) {
  $alt = [System.IO.Path]::ChangeExtension($resolvedWinScp, '.com')
  if (Test-Path $alt) { $resolvedWinScp = $alt }
}
if (-not (Test-Path $resolvedWinScp)) {
  throw "WinSCP CLI hittades inte på $resolvedWinScp. Ange sökvägen via -WinScpPath eller WINSCPCOM_PATH."
}

$tempScript = New-TemporaryFile
$tempLocalFile = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "crm-deploy-test-$([System.IO.Path]::GetRandomFileName()).txt")
"FTP connectivity test $(Get-Date -Format o)" | Set-Content -Path $tempLocalFile -Encoding UTF8

$escapedPassword = [System.Uri]::EscapeDataString($ftpPassword)
$ftpUrl = "ftp://$($ftpUser):$escapedPassword@$($ftpHost):$($ftpPort)"

Set-Content -LiteralPath $tempScript -Encoding ASCII -Value @"
open $ftpUrl -passive=on
lcd "$(Split-Path $tempLocalFile)"
cd "$RemotePath"
put "$(Split-Path $tempLocalFile -Leaf)"
rm "$(Split-Path $tempLocalFile -Leaf)"
exit
"@

try {
  Write-Host "==> Testar FTP-anslutning mot $($ftpHost):$($ftpPort)" -ForegroundColor Cyan
  & $resolvedWinScp '/ini=nul' "/script=$tempScript" | ForEach-Object { Write-Host $_ }
  $exitCode = $LASTEXITCODE
  if ($exitCode -ne 0) {
    throw "FTP-test misslyckades (exitkod $exitCode)."
  }
  Write-Host '==> Test utladdning/uppstädning klar.' -ForegroundColor Green
}
finally {
  Remove-Item $tempScript -ErrorAction SilentlyContinue
  Remove-Item $tempLocalFile -ErrorAction SilentlyContinue
}
