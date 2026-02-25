$ErrorActionPreference = 'Continue'
Write-Host "Starting caddy service (if installed)..."
Start-Service -Name caddy -ErrorAction SilentlyContinue
Write-Host "Service status:"
Get-Service -Name caddy -ErrorAction SilentlyContinue | Format-List Name,Status

Write-Host "List caddy.exe processes (if any):"
Get-Process -Name caddy -ErrorAction SilentlyContinue | Select-Object Id,Path | Format-List

$caddyExe = 'C:\Program Files\Caddy\caddy.exe'
$caddyfile = 'C:\Program Files\Caddy\Caddyfile'
if (Test-Path $caddyExe -and Test-Path $caddyfile) {
    Write-Host "Validating Caddy config..."
    & $caddyExe validate --config $caddyfile 2>&1 | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "caddy.exe or Caddyfile missing. caddyExe=$caddyExe exists=$(Test-Path $caddyExe), caddyfile exists=$(Test-Path $caddyfile)"
}

Write-Host "Testing https://malialtwni.com with curl (may report 502 if backend not ready):"
try {
    curl -v https://malialtwni.com
} catch {
    Write-Host "curl failed: $_"
}
