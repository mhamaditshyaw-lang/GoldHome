# Quick status check for Caddy
Write-Host "=== Caddy & PM2 Status ===" -ForegroundColor Cyan
Write-Host ""

# PM2 Status
Write-Host "PM2 Processes:" -ForegroundColor Yellow
pm2 list

Write-Host ""

# Check if port 443 is being listened on
Write-Host "HTTPS Port 443 Status:" -ForegroundColor Yellow
$port443 = netstat -ano | findstr ":443" | findstr "LISTENING"
if ($port443) {
    Write-Host "✓ Caddy is listening on port 443" -ForegroundColor Green
    Write-Host $port443
}
else {
    Write-Host "✗ Port 443 is NOT listening!" -ForegroundColor Red
}

Write-Host ""

# Check Caddy processes
Write-Host "Caddy Processes:" -ForegroundColor Yellow
$caddyProcs = Get-Process -Name caddy -ErrorAction SilentlyContinue
if ($caddyProcs) {
    $caddyProcs | Format-Table Id, ProcessName, @{Label = "Memory (MB)"; Expression = { [math]::Round($_.WS / 1MB, 2) } }, StartTime -AutoSize
    Write-Host "✓ Caddy is running!" -ForegroundColor Green
}
else {
    Write-Host "✗ No Caddy processes found!" -ForegroundColor Red
}

Write-Host ""
Write-Host "Commands:" -ForegroundColor Cyan
Write-Host "  View logs:  pm2 logs goldhome-caddy" -ForegroundColor White
Write-Host "  Monitor:    pm2 monit" -ForegroundColor White  
Write-Host "  Restart:    pm2 restart goldhome-caddy" -ForegroundColor White
Write-Host ""
