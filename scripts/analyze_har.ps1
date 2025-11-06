$harFile = "E:\projects\CRM\docs\har\loopia_e2e.har"
$har = Get-Content $harFile -Raw | ConvertFrom-Json

# Find the associations.php request
$entry = $har.log.entries | Where-Object {
  $_.request.url -like '*associations.php*'
} | Select-Object -First 1

if ($entry) {
  Write-Host "=== Request ===" -ForegroundColor Cyan
  Write-Host "URL: $($entry.request.url)"
  Write-Host "Method: $($entry.request.method)"

  Write-Host "`n=== Response ===" -ForegroundColor Cyan
  Write-Host "Status: $($entry.response.status)"
  Write-Host "Content-Type: $($entry.response.content.mimeType)"
  Write-Host "Body size: $($entry.response.content.size) bytes"
  Write-Host "Encoding: $($entry.response.content.encoding)"

  if ($entry.response.content.text) {
    Write-Host "`n=== Response Body ===" -ForegroundColor Cyan
    try {
      $decoded = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($entry.response.content.text))
      $preview = if ($decoded.Length -gt 1000) { $decoded.Substring(0, 1000) + "..." } else { $decoded }
      Write-Host $preview
    } catch {
      Write-Host "Could not decode body: $_"
      Write-Host "Raw (first 500 chars): $($entry.response.content.text.Substring(0, [Math]::Min(500, $entry.response.content.text.Length)))"
    }
  } else {
    Write-Host "No response body found"
  }
} else {
  Write-Host "No associations.php request found in HAR file" -ForegroundColor Red
}

# Check for console errors
Write-Host "`n=== Error Responses ===" -ForegroundColor Cyan
$consoleEntries = $har.log.entries | Where-Object {
  $_.response.status -ge 400 -or $_.response.status -eq 0
}
if ($consoleEntries) {
  $consoleEntries | ForEach-Object {
    Write-Host "[$($_.response.status)] $($_.request.url)" -ForegroundColor Yellow
  }
} else {
  Write-Host "No error responses found"
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
$statusGroups = $har.log.entries | Group-Object {$_.response.status}
$statusGroups | ForEach-Object {
  Write-Host "Status $($_.Name): $($_.Count) requests"
}

Write-Host "`nTotal requests: $($har.log.entries.Count)"
