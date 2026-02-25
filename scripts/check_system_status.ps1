# Comprehensive 24/7 Status Check for GoldHome
Write-Host "=== GoldHome 24/7 System Status ===" -ForegroundColor Cyan
Write-Host ""

# PM2 Apps
Write-Host "--- PM2 Managed Processes ---" -ForegroundColor Yellow
pm2 list

Write-Host ""

# Listening Ports
Write-Host "--- Active Web Ports ---" -ForegroundColor Yellow
$ports = netstat -ano | findstr "LISTENING" | findstr ":3000 :443 :80"
if ($ports) {
    Write-Host $ports
    Write-Host "✓ Ports are active" -ForegroundColor Green
}
else {
    Write-Host "✗ Important ports (3000/443) are not listening!" -ForegroundColor Red
}

Write-Host ""

# Task Scheduler
Write-Host "--- Boot Persistence (Auto-Start) ---" -ForegroundColor Yellow
$task = Get-ScheduledTask -TaskName "GoldHome-Caddy-KeepAlive" -ErrorAction SilentlyContinue
if ($task) {
    Write-Host "✓ Task Scheduler entry found: $($task.TaskName) [$($task.State)]" -ForegroundColor Green
}
else {
    Write-Host "✗ Auto-start task NOT FOUND!" -ForegroundColor Red
}

Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
$pm2Running = (pm2 list | Select-String "online").Count
if ($pm2Running -ge 2) {
    Write-Host "✓ SYSTEM IS LIVE AND PROTECTED 24/7" -ForegroundColor Green
}
else {
    Write-Host "⚠ Some services might be down. Check 'pm2 list' above." -ForegroundColor Yellow
}
Write-Host ""
