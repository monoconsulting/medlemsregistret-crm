param(
  [string] $MysqlHost = ${env:MARIADBHOST},
  [int] $MysqlPort = (${env:MARIADBPORT} ? [int]${env:MARIADBPORT} : 3306),
  [string] $MysqlUser = ${env:MARIADBUSER},
  [string] $MysqlPassword = ${env:MARIADBPASSWORD},
  [string] $Database,
  [string] $OutputDirectory = (Join-Path $PSScriptRoot 'backups'),
  [switch] $Zip,
  [switch] $RestoreToLocal,
  [string] $LocalDatabaseUrl = ${env:DATABASE_URL}
)

$ErrorActionPreference = 'Stop'

function Resolve-DatabaseName {
  param([string] $DbName, [string] $ConnectionString)

  if ($DbName) {
    return $DbName
  }

  if ($ConnectionString) {
    try {
      $uri = [System.Uri]$ConnectionString
      $path = $uri.AbsolutePath.Trim('/')
      if ($path) {
        return $path
      }
    }
    catch {
    }
  }

  throw 'Databasnamn saknas. Ange -Database eller sätt env MARIADB_DATABASE/DATABASE_URL.'
}

$Database = Resolve-DatabaseName -DbName $Database -ConnectionString ${env:MARIADB_DATABASE}
if (-not $Database) {
  $Database = Resolve-DatabaseName -DbName ${env:MARIADB_DATABASE} -ConnectionString $LocalDatabaseUrl
}

if (-not $MysqlHost -or -not $MysqlUser -or -not $MysqlPassword) {
  throw 'Fjärrdatabasens anslutningsuppgifter saknas (MARIADBHOST/MARIADBUSER/MARIADBPASSWORD).'
}

if (-not (Test-Path $OutputDirectory)) {
  New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dumpFile = Join-Path $OutputDirectory "$($Database)_remote_$timestamp.sql"

$mysqldump = Get-Command mysqldump -ErrorAction SilentlyContinue
if (-not $mysqldump) {
  throw 'mysqldump hittades inte i PATH. Installera MySQL Client Tools.'
}

Write-Host "• Hämtar backup från $MysqlHost:$MysqlPort ($Database)"

$env:MYSQL_PWD = $MysqlPassword
try {
  & $mysqldump `
    --column-statistics=0 `
    --single-transaction `
    --set-gtid-purged=OFF `
    --routines `
    --triggers `
    --events `
    -h $MysqlHost `
    -P $MysqlPort `
    -u $MysqlUser `
    $Database `
    | Out-File -FilePath $dumpFile -Encoding UTF8
}
finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
}

if ($Zip) {
  $zipPath = "$dumpFile.gz"
  $fileStream = [System.IO.File]::OpenRead($dumpFile)
  try {
    $gzipStream = New-Object System.IO.Compression.GzipStream(
      [System.IO.File]::Create($zipPath),
      [System.IO.Compression.CompressionLevel]::Optimal
    )
    try {
      $fileStream.CopyTo($gzipStream)
    }
    finally {
      $gzipStream.Dispose()
    }
  }
  finally {
    $fileStream.Dispose()
  }

  Remove-Item $dumpFile
  $dumpFile = $zipPath
}

Write-Host "==> Backup skapad: $dumpFile" -ForegroundColor Green

if ($RestoreToLocal) {
  $mysql = Get-Command mysql -ErrorAction SilentlyContinue
  if (-not $mysql) {
    throw 'mysql-klienten hittades inte i PATH. Installera MySQL Client Tools.'
  }

  if (-not $LocalDatabaseUrl) {
    throw 'Ange -LocalDatabaseUrl för att importera backupen lokalt.'
  }

  $uri = [System.Uri]$LocalDatabaseUrl
  $localDb = $uri.AbsolutePath.Trim('/')
  $localHost = $uri.Host
  $localPort = if ($uri.Port -gt 0) { $uri.Port } else { 3306 }
  $localUser = $uri.UserInfo.Split(':')[0]
  $localPassword = ($uri.UserInfo.Split(':') | Select-Object -Skip 1) -join ':'

  if (-not $localDb) {
    throw 'Kunde inte läsa databasen från LocalDatabaseUrl.'
  }

  Write-Host "• Återställer backup till lokal databas $localDb på $localHost:$localPort"

  $tmpSql = $null
  if ($dumpFile.EndsWith('.gz')) {
    $tmpSql = Join-Path $env:TEMP ("restore-" + [guid]::NewGuid() + ".sql")
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
    finally {
    }
  }

  $env:MYSQL_PWD = $localPassword
  try {
    & $mysql -h $localHost -P $localPort -u $localUser $localDb < $dumpFile
  }
  finally {
    Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
    if ($tmpSql -and (Test-Path $tmpSql)) {
      Remove-Item $tmpSql -ErrorAction SilentlyContinue
    }
  }

  Write-Host '==> Lokal återställning klar.' -ForegroundColor Green
}
