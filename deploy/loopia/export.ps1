param(
  [switch] $InstallDependencies,
  [switch] $GeneratePrisma = $false
)

$ErrorActionPreference = 'Stop'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$crmAppPath = Join-Path $projectRoot 'crm-app'

Write-Host "==> Static export för Loopia" -ForegroundColor Cyan

Push-Location $crmAppPath
try {
  if ($InstallDependencies) {
    Write-Host '• Installerar npm-paket med npm ci'
    npm ci
    $GeneratePrisma = $true
  }

  if ($GeneratePrisma) {
    Write-Host '• Kör prisma generate'
    npx prisma generate
  }

  Write-Host '• Kör next build && next export'
  npm run export:static
}
finally {
  Pop-Location
}

Write-Host "==> Export klar. Filer finns i crm-app\out" -ForegroundColor Green
