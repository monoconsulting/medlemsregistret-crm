$harFile = "E:\projects\CRM\docs\har\loopia_e2e.har"
$har = Get-Content $harFile -Raw | ConvertFrom-Json

Write-Host "=== HAR Analysis ===" -ForegroundColor Cyan
Write-Host "File: $harFile"
Write-Host "Total entries: $($har.log.entries.Count)"
Write-Host ""

# Group by URL pattern
Write-Host "=== Requests by Type ===" -ForegroundColor Cyan
$har.log.entries | Group-Object {
  $url = $_.request.url
  if ($url -match '/api/') { 'API' }
  elseif ($url -match '\.(js|css|png|jpg|ico|svg)') { 'Static' }
  else { 'Page' }
} | ForEach-Object {
  Write-Host "$($_.Name): $($_.Count) requests"
}
Write-Host ""

# API calls detail
Write-Host "=== API Calls ===" -ForegroundColor Cyan
$apiCalls = $har.log.entries | Where-Object { $_.request.url -match '/api/' }
$apiCalls | ForEach-Object {
  $url = $_.request.url
  $method = $_.request.method
  $status = $_.response.status
  $size = $_.response.content.size
  $time = [math]::Round($_.time, 2)

  $statusColor = if ($status -ge 400) { 'Red' } elseif ($status -ge 300) { 'Yellow' } else { 'Green' }

  Write-Host "[$method] " -NoNewline
  Write-Host "$url" -NoNewline
  Write-Host " → " -NoNewline
  Write-Host "$status" -ForegroundColor $statusColor -NoNewline
  Write-Host " | ${size} bytes | ${time}ms"

  # Show request body for POST/PUT
  if ($method -in @('POST', 'PUT', 'PATCH') -and $_.request.postData.text) {
    $bodyPreview = $_.request.postData.text
    if ($bodyPreview.Length -gt 200) {
      $bodyPreview = $bodyPreview.Substring(0, 200) + "..."
    }
    Write-Host "  Body: $bodyPreview" -ForegroundColor DarkGray
  }

  # Show error response
  if ($status -ge 400 -and $_.response.content.text) {
    try {
      $responseText = if ($_.response.content.encoding -eq 'base64') {
        [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($_.response.content.text))
      } else {
        $_.response.content.text
      }
      $preview = if ($responseText.Length -gt 300) { $responseText.Substring(0, 300) + "..." } else { $responseText }
      Write-Host "  Response: $preview" -ForegroundColor Red
    } catch {
      Write-Host "  Response: (could not decode)" -ForegroundColor Red
    }
  }

  Write-Host ""
}

# Status code summary
Write-Host "=== Status Code Summary ===" -ForegroundColor Cyan
$har.log.entries | Group-Object { $_.response.status } | Sort-Object Name | ForEach-Object {
  $color = if ([int]$_.Name -ge 400) { 'Red' } elseif ([int]$_.Name -ge 300) { 'Yellow' } else { 'Green' }
  Write-Host "Status $($_.Name): $($_.Count) requests" -ForegroundColor $color
}
Write-Host ""

# Timing analysis
Write-Host "=== Response Time Analysis ===" -ForegroundColor Cyan
$times = $har.log.entries | Where-Object { $_.request.url -match '/api/' } | ForEach-Object { $_.time }
if ($times.Count -gt 0) {
  $avgTime = [math]::Round(($times | Measure-Object -Average).Average, 2)
  $maxTime = [math]::Round(($times | Measure-Object -Maximum).Maximum, 2)
  $minTime = [math]::Round(($times | Measure-Object -Minimum).Minimum, 2)

  Write-Host "API calls: $($times.Count)"
  Write-Host "Average: ${avgTime}ms"
  Write-Host "Min: ${minTime}ms"
  Write-Host "Max: ${maxTime}ms"
}
Write-Host ""

# Check for errors in console
Write-Host "=== Error Responses (4xx/5xx) ===" -ForegroundColor Cyan
$errors = $har.log.entries | Where-Object { $_.response.status -ge 400 }
if ($errors.Count -gt 0) {
  $errors | ForEach-Object {
    Write-Host "[$($_.response.status)] $($_.request.method) $($_.request.url)" -ForegroundColor Red
  }
} else {
  Write-Host "No error responses found" -ForegroundColor Green
}
