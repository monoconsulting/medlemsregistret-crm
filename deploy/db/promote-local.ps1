param(
  [string] $LocalDatabaseUrl = ${env:DATABASE_URL},
  [string] $RemoteHost = ${env:MARIADBHOST},
  [int] $RemotePort = (${env:MARIADBPORT} ? [int]${env:MARIADBPORT} : 3306),
  [string] $RemoteUser = ${env:MARIADBUSER},
  [string] $RemotePassword = ${env:MARIADBPASSWORD},
  [string] $OutputDirectory = (Join-Path $PSScriptRoot 'promote'),
  [switch] $Zip,
  [switch] $SkipRemoteImport
)

$ErrorActionPreference = 'Stop'

if (-not $LocalDatabaseUrl) {
  throw 'LocalDatabaseUrl saknas. Sätt env DATABASE_URL eller ange parameter.'
}

function Parse-MySqlConnection {
  param([string] $ConnectionString)

  $uri = [System.Uri]$ConnectionString
  $info = @{
    Host = $uri.Host
    Port = if ($uri.Port -gt 0) { $uri.Port } else { 3306 }
    Database = $uri.AbsolutePath.Trim('/')
    User = $uri.UserInfo.Split(':')[0]
    Password = ($uri.UserInfo.Split(':') | Select-Object -Skip 1) -join ':'
  }

  if (-not $info.Database) {
    throw "Kunde inte läsa databasnamn från connection string: $ConnectionString"
  }

  return $info
}

$local = Parse-MySqlConnection -ConnectionString $LocalDatabaseUrl

if (-not $RemoteHost -or -not $RemoteUser -or -not $RemotePassword) {
  throw 'Fjärrdatabasens uppgifter saknas. Kontrollera MARIADBHOST/MARIADBUSER/MARIADBPASSWORD.'
}

if (-not (Test-Path $OutputDirectory)) {
  New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dumpFile = Join-Path $OutputDirectory "$($local.Database)_promote_$timestamp.sql"

$mysqldump = Get-Command mysqldump -ErrorAction SilentlyContinue
if (-not $mysqldump) {
  throw 'mysqldump hittades inte i PATH.'
}

Write-Host "• Dumpar lokal databas $($local.Database) från $($local.Host):$($local.Port)"

$env:MYSQL_PWD = $local.Password
try {
  & $mysqldump `
    --column-statistics=0 `
    --single-transaction `
    --set-gtid-purged=OFF `
    --routines `
    --triggers `
    --events `
    -h $local.Host `
    -P $local.Port `
    -u $local.User `
    $local.Database `
    | Out-File -FilePath $dumpFile -Encoding UTF8
}
finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}

if ($Zip) {
  $zipPath = "$dumpFile.gz"
  $input = [System.IO.File]::OpenRead($dumpFile)
  try {
    $output = New-Object System.IO.Compression.GzipStream(
      [System.IO.File]::Create($zipPath),
      [System.IO.Compression.CompressionLevel]::Optimal
    )
    try {
      $input.CopyTo($output)
    }
    finally {
      $output.Dispose()
    }
  }
  finally {
    $input.Dispose()
  }

  Remove-Item $dumpFile
  $dumpFile = $zipPath
}

Write-Host "==> Lokal dump skapad: $dumpFile" -ForegroundColor Green

if ($SkipRemoteImport) {
  Write-Host 'Hoppar över import till fjärrdatabas enligt parameter.' -ForegroundColor Yellow
  return
}

$mysql = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysql) {
  throw 'mysql-klienten hittades inte i PATH.'
}

Write-Host "• Importerar dump till $RemoteHost:$RemotePort"

$tmpSql = $null
if ($dumpFile.EndsWith('.gz')) {
  $tmpSql = Join-Path $env:TEMP ("promote-" + [guid]::NewGuid() + ".sql")
  try {
    $gzipStream = New-Object System.IO.Compression.GzipStream(
      [System.IO.File]::OpenRead($dumpFile),
      [System.IO.Compression.CompressionMode]::Decompress
    )
    $outStream = [System.IO.File]::Create($tmpSql)
    try {
      $gzipStream.CopyTo($outStream)
    }
    finally {
      $gzipStream.Dispose()
      $outStream.Dispose()
    }

    $dumpFile = $tmpSql
  }
  catch {
    if ($tmpSql -and (Test-Path $tmpSql)) {
      Remove-Item $tmpSql -ErrorAction SilentlyContinue
    }
    throw
  }
}

$env:MYSQL_PWD = $RemotePassword
try {
  & $mysql -h $RemoteHost -P $RemotePort -u $RemoteUser $local.Database < $dumpFile
}
finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
  if ($tmpSql -and (Test-Path $tmpSql)) {
    Remove-Item $tmpSql -ErrorAction SilentlyContinue
  }
}

Write-Host '==> Fjärrimporten är klar.' -ForegroundColor Green
