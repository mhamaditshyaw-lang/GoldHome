$ErrorActionPreference = 'Continue'
Write-Host 'Deleting existing caddy service (if any)...'
sc.exe delete caddy | Out-Null
Start-Sleep -Seconds 1

$bin = '"C:\PROGRA~1\Caddy\caddy.exe" run --config "C:\PROGRA~1\Caddy\Caddyfile"'
Write-Host "Creating service with BinaryPathName: $bin"
try {
    New-Service -Name caddy -BinaryPathName $bin -DisplayName 'caddy' -StartupType Automatic -ErrorAction Stop
    Write-Host 'Service created.'
} catch {
    Write-Host 'New-Service failed (maybe already exists):' $_
}

Write-Host 'Starting caddy service...'
try {
    Start-Service -Name caddy -ErrorAction Stop
    Start-Sleep -Seconds 2
} catch {
    Write-Host 'Start-Service failed:' $_
}

Write-Host 'Service status:'
Get-Service -Name caddy -ErrorAction SilentlyContinue | Format-List Name,Status

Write-Host 'Processes:'
Get-Process -Name caddy -ErrorAction SilentlyContinue | Select-Object Id,Path | Format-List
