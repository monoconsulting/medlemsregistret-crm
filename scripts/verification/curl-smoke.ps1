param(
    [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Stop"

if (-not $env:CRM_VERIFICATION_EMAIL -or -not $env:CRM_VERIFICATION_PASSWORD) {
    Write-Error "Set CRM_VERIFICATION_EMAIL and CRM_VERIFICATION_PASSWORD before running."
}

$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
try {
    function Invoke-Request {
        param(
            [string]$Method,
            [string]$Path,
            [hashtable]$Headers = $null,
            [string]$Body = $null
        )

        $invokeParams = @{
            Method      = $Method
            Uri         = "$BaseUrl$Path"
            WebSession  = $session
            ErrorAction = 'Stop'
        }

        if ($Headers) { $invokeParams['Headers'] = $Headers }
        if ($Body) {
            $invokeParams['Body'] = $Body
            $invokeParams['ContentType'] = 'application/json'
        }

        Invoke-WebRequest @invokeParams
    }

    function Log-Step([string]$Message) {
        $timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        Write-Host "`n[$timestamp] $Message"
    }

    Log-Step "GET /api/csrf.php"
    $csrfResponse = Invoke-Request -Method GET -Path "/api/csrf.php"
    $csrfJson = $csrfResponse.Content | ConvertFrom-Json
    $csrfToken = $csrfJson.token
    if (-not $csrfToken) {
        throw "Failed to extract CSRF token"
    }

    Log-Step "POST /api/login.php"
    $loginBody = @{
        email    = $env:CRM_VERIFICATION_EMAIL
        password = $env:CRM_VERIFICATION_PASSWORD
    } | ConvertTo-Json
    $loginHeaders = @{
        "X-CSRF-Token" = $csrfToken
    }
    $loginResponse = Invoke-Request -Method POST -Path "/api/login.php" -Headers $loginHeaders -Body $loginBody
    Write-Host $loginResponse.Content

    Log-Step "GET /api/associations.php?page=1&pageSize=5"
    $assocResponse = Invoke-Request -Method GET -Path "/api/associations.php?page=1&pageSize=5"
    Write-Host $assocResponse.Content

    Log-Step "POST /api/logout.php"
    $logoutHeaders = @{
        "X-CSRF-Token" = $csrfToken
    }
    $logoutResponse = Invoke-Request -Method POST -Path "/api/logout.php" -Headers $logoutHeaders -Body "{}"
    Write-Host $logoutResponse.Content
}
finally {
    # nothing to clean up
}
