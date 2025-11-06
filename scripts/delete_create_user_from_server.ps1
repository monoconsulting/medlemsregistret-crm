# Delete create_user.php from Loopia server after user creation

$envFile = "E:\projects\CRM\crm-app\.env"
$ftpHost = $null
$ftpUser = $null
$ftpPass = $null

# Read FTP credentials from .env
if (Test-Path $envFile) {
  foreach ($line in Get-Content $envFile) {
    if ($line -match '^FTPHOST=(.+)$') { $ftpHost = $matches[1].Trim('"') }
    if ($line -match '^FTPADDRESS=(.+)$') { $ftpHost = $matches[1].Trim('"') }
    if ($line -match '^FTPUSER=(.+)$') { $ftpUser = $matches[1].Trim('"') }
    if ($line -match '^FTPPASSWORD=(.+)$') { $ftpPass = $matches[1].Trim('"') }
  }
}

if (-not $ftpHost -or -not $ftpUser -or -not $ftpPass) {
  Write-Error "Missing FTP credentials in .env"
  exit 1
}

$winscpPath = "C:\Program Files (x86)\WinSCP\WinSCP.com"
if (-not (Test-Path $winscpPath)) {
  $winscpPath = "C:\Program Files\WinSCP\WinSCP.com"
}

if (-not (Test-Path $winscpPath)) {
  Write-Error "WinSCP not found"
  exit 1
}

$escapedPass = [System.Uri]::EscapeDataString($ftpPass)
$ftpUrl = "ftp://${ftpUser}:${escapedPass}@${ftpHost}:21"

$tempScript = New-TemporaryFile
@"
open $ftpUrl -passive=on
option confirm off
rm /api/create_user.php
exit
"@ | Set-Content -Path $tempScript -Encoding ASCII

try {
  & $winscpPath '/ini=nul' "/script=$tempScript"
  if ($LASTEXITCODE -eq 0) {
    Write-Host "create_user.php deleted from server successfully" -ForegroundColor Green
  } else {
    Write-Error "Failed to delete file (exit code $LASTEXITCODE)"
  }
} finally {
  Remove-Item $tempScript -ErrorAction SilentlyContinue
}
