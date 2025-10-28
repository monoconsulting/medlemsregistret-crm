<# 
  File: pr16merge.ps1
  Purpose:
    - Create feature branch
    - Merge PR #16 (backend search fix)
    - Cherry-pick targeted files from PR #14 (external search config) and PR #15 (sv-SE case handling)
  Usage:
    ./pr16merge.ps1            # normal (no build)
    ./pr16merge.ps1 -DryRun    # prints commands, no changes
#>

param(
  [switch]$DryRun
)

# ------- Helpers -------
function Exec {
  param([string]$Cmd)
  Write-Host ">> $Cmd" -ForegroundColor Cyan
  if ($DryRun) { return }
  $global:LASTEXITCODE = 0
  cmd /c $Cmd
  if ($LASTEXITCODE -ne 0) {
    Write-Error "Command failed: $Cmd (exit $LASTEXITCODE)"
    exit 1
  }
}

function GitCleanCheck {
  $status = git status --porcelain
  if ($status) {
    Write-Error "Working tree is not clean. Commit/stash changes first."
    exit 1
  }
}

function BranchExists {
  param([string]$Branch)
  git show-ref --verify --quiet "refs/heads/$Branch"
  return ($LASTEXITCODE -eq 0)
}

function RefExists {
  param([string]$Ref)
  git show-ref --verify --quiet "$Ref"
  return ($LASTEXITCODE -eq 0)
}

function PreferRef {
  param([string]$MergeRef, [string]$HeadRef)
  if (RefExists $MergeRef) { return $MergeRef }
  if (RefExists $HeadRef)  { return $HeadRef }
  return $null
}

function TryCheckoutFromRefs {
  param(
    [string[]]$FromRefs,
    [string[]]$CandidatePaths,
    [string]$CommitMessage
  )
  $checkedOut = @()
  foreach ($ref in $FromRefs) {
    if (-not (RefExists $ref)) { continue }
    foreach ($p in $CandidatePaths) {
      # Check if path exists in the ref tree
      $null = git ls-tree -r --name-only $ref | findstr /r /c:"^$([Regex]::Escape($p))$"
      if ($LASTEXITCODE -eq 0) {
        Exec "git checkout $ref -- `"$p`""
        $checkedOut += $p
      }
    }
    if ($checkedOut.Count -gt 0) { break } # we found files in this ref; stop
  }

  if ($checkedOut.Count -gt 0) {
    $pathsJoined = ($checkedOut | ForEach-Object { "`"`$_`"" }) -join ' '
    Exec "git add $pathsJoined"
    Exec "git commit -m `"$CommitMessage`""
    Write-Host ("  ✓ Included from $($FromRefs -join ' OR '):") -ForegroundColor Green
    foreach ($f in $checkedOut) { Write-Host ("    - {0}" -f $f) }
  }
  else {
    Write-Warning ("No matching files found in: {0}. Skipped." -f ($FromRefs -join ', '))
  }
}

# ------- Start -------
Write-Host "=== Merge Association Search Fix (PR #16 + cherry-picks from #14, #15) ===" -ForegroundColor Green
GitCleanCheck

# Detect base branch
$baseBranch = 'main'
git rev-parse --verify main > $null 2>&1
if ($LASTEXITCODE -ne 0) {
  git rev-parse --verify master > $null 2>&1
  if ($LASTEXITCODE -eq 0) { $baseBranch = 'master' } else {
    Write-Error "Unable to find base branch 'main' or 'master'."
    exit 1
  }
}

# Fetch PR heads and merge refs
Write-Host "`nFetching PR refs (head + merge)..." -ForegroundColor Yellow
Exec "git fetch origin +pull/14/head:pr-14 +pull/14/merge:pr-14-merge"
Exec "git fetch origin +pull/15/head:pr-15 +pull/15/merge:pr-15-merge"
Exec "git fetch origin +pull/16/head:pr-16 +pull/16/merge:pr-16-merge"

# Create feature branch
$ts = Get-Date -Format "yyyyMMdd-HHmm"
$featureBranch = "feat/search-merge-16-plus-picks-$ts"
if (BranchExists $featureBranch) {
  Write-Error "Branch $featureBranch already exists. Delete it or re-run later."
  exit 1
}

Exec "git checkout $baseBranch"
Exec "git pull --ff-only origin $baseBranch"
Exec "git checkout -b $featureBranch"

# Merge PR #16 (prefer merge-ref for conflict-resolved tree)
Write-Host "`nMerging PR #16..." -ForegroundColor Yellow
$ref16 = PreferRef "pr-16-merge" "pr-16"
if (-not $ref16) {
  Write-Error "Could not find PR #16 refs."
  exit 1
}
Exec "git merge --no-ff $ref16 -m `"Merge PR #16: Association search robustness and coverage`""

# Cherry-pick targeted files from PR #14 (external search config)
$pr14Paths = @(
  "crm-app/lib/search.ts",
  "apps/crm/lib/search.ts",
  "web/lib/search.ts",
  "app/lib/search.ts",
  "packages/web/lib/search.ts"
)
Write-Host "`nCherry-picking key files from PR #14 (external search config)..." -ForegroundColor Yellow
TryCheckoutFromRefs -FromRefs @("pr-14-merge","pr-14") -CandidatePaths $pr14Paths -CommitMessage "Cherry-pick (#14): align external search (Typesense/Meili) fields (types, activities, categories, tags)."

# Cherry-pick sv-SE handling from PR #15
$pr15Paths = @(
  "crm-app/utils/locale.ts",
  "crm-app/lib/locale.ts",
  "crm-app/utils/string.ts",
  "crm-app/lib/string.ts",
  "crm-app/lib/search.ts"
)
Write-Host "`nCherry-picking key files from PR #15 (sv-SE diacritics handling)..." -ForegroundColor Yellow
TryCheckoutFromRefs -FromRefs @("pr-15-merge","pr-15") -CandidatePaths $pr15Paths -CommitMessage "Cherry-pick (#15): sv-SE diacritic handling for search terms (Å/Ä/Ö normalization)."

Write-Host "`nDone. You are now on branch: $featureBranch" -ForegroundColor Green
Write-Host "Next:"
Write-Host "  1) Verify searches (Å/Ä/Ö + types/activities/categories/tags)."
Write-Host "  2) git push -u origin $featureBranch"
Write-Host "  3) Open PR and merge."
