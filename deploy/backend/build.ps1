param(
  [switch] $InstallDependencies,
  [string] $OutputDirectory = (Join-Path $PSScriptRoot 'artifacts'),
  [string] $ArtifactName
)

$ErrorActionPreference = 'Stop'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$backendPath = Join-Path $projectRoot 'backend'
$prismaPath = Join-Path $projectRoot 'crm-app\prisma'

if (-not (Test-Path $OutputDirectory)) {
  New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}

if (-not $ArtifactName) {
  $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $ArtifactName = "crm-backend-$timestamp.zip"
}

$artifactPath = Join-Path $OutputDirectory $ArtifactName

Push-Location $backendPath
try {
  if ($InstallDependencies) {
    Write-Host '• Installerar backend-beroenden (npm ci)'
    npm ci
  }

  Write-Host '• Bygger backend (npm run build)'
  npm run build

  $tempStage = New-Item -ItemType Directory -Path (Join-Path $env:TEMP ("crm-backend-" + [System.Guid]::NewGuid())) -Force

  try {
    Copy-Item -Path 'dist' -Destination $tempStage -Recurse
    Copy-Item -Path 'package.json' -Destination $tempStage
    if (Test-Path 'package-lock.json') {
      Copy-Item -Path 'package-lock.json' -Destination $tempStage
    }
    Copy-Item -Path 'tsconfig.json' -Destination $tempStage

    if (Test-Path $prismaPath) {
      Copy-Item -Path $prismaPath -Destination (Join-Path $tempStage 'prisma') -Recurse
    }

    if (Test-Path (Join-Path $backendPath '.env.example')) {
      Copy-Item -Path '.env.example' -Destination $tempStage
    }

    if (Test-Path $artifactPath) {
      Remove-Item $artifactPath
    }

    Compress-Archive -Path (Join-Path $tempStage '*') -DestinationPath $artifactPath
  }
  finally {
    Remove-Item $tempStage -Recurse -Force
  }
}
finally {
  Pop-Location
}

Write-Host "==> Backend-artifact skapad: $artifactPath" -ForegroundColor Green
