<#
PowerShell helper: prepare cloudfunctions for deployment
Usage: run from project root or execute this script from scripts folder.
#>
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectRoot = Resolve-Path (Join-Path $scriptDir "..")
$cfRoot = Join-Path $projectRoot 'cloudfunctions'
if (-Not (Test-Path $cfRoot)) {
  Write-Error "cloudfunctions directory not found at $cfRoot"
  exit 1
}
Get-ChildItem -Path $cfRoot -Directory | ForEach-Object {
  $dir = $_.FullName
  if (Test-Path (Join-Path $dir 'package.json')) {
    Write-Host "Installing dependencies in: $dir"
    Push-Location $dir
    # Prefer clean install; fallback to npm install
    npm ci --silent || npm install --silent
    Pop-Location
  } else {
    Write-Host "No package.json in: $dir, skipping"
  }
}
Write-Host "Preparation complete. Next steps: get envID from WeChat Cloud Console, set it in utils/cloud.js or config, then deploy functions using CloudBase CLI or upload via WeChat DevTools. See README for commands."