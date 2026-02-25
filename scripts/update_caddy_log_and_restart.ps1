$ErrorActionPreference = 'Stop'
$pfShort = 'C:\PROGRA~1\Caddy'
$caddyExe = Join-Path $pfShort 'caddy.exe'
$caddyfile = Join-Path $pfShort 'Caddyfile'
if (-not (Test-Path $caddyfile)) { Write-Host "Caddyfile missing at $caddyfile"; exit 1 }

$cfg = Get-Content -Path $caddyfile -Raw
$cfg = $cfg -replace "output file .*access.log","output file C:\\Program Files\\Caddy\\access.log"
Set-Content -Path $caddyfile -Value $cfg -Force
Write-Host "Updated Caddyfile log path to C:\\Program Files\\Caddy\\access.log"

Write-Host 'Validating config...'
& $caddyExe validate --config $caddyfile 2>&1 | ForEach-Object { Write-Host $_ }

Write-Host 'Restarting caddy service...'
Restart-Service -Name caddy -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Get-Service -Name caddy | Format-List Name,Status
Write-Host 'Tail access log (if exists):'
$alog = 'C:\Program Files\Caddy\access.log'
if (Test-Path $alog) { Get-Content -Path $alog -Tail 50 -ErrorAction SilentlyContinue } else { Write-Host 'No access log yet.' }
