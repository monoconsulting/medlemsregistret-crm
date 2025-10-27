param(
  [string] $OutPath,
  [string] $WinScpPath = (Join-Path ${env:ProgramFiles} 'WinSCP\WinSCP.com'),
  [string] $FtpHost = ${env:FTPHOST},
  [int] $FtpPort = (${env:FTPPORT} ? [int]${env:FTPPORT} : 21),
  [string] $FtpUser = ${env:FTPUSER},
  [string] $FtpPassword = ${env:FTPPASSWORD},
  [string] $RemotePath = '/public_html',
  [switch] $Passive = $true
)

$ErrorActionPreference = 'Stop'

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

$ftpUrl = "ftp://$FtpUser:$escapedPassword@$FtpHost:$FtpPort"

$tempScript = New-TemporaryFile

@"
open $ftpUrl -explicitssl $passiveFlag
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
}
finally {
  Remove-Item $tempScript -ErrorAction SilentlyContinue
}

Write-Host "==> Synkningen mot $FtpHost:$FtpPort/$RemotePath är klar." -ForegroundColor Green
