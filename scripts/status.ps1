# Simple status check
Write-Host "--- PM2 APPS ---"
pm2 list
Write-Host "--- PORTS ---"
netstat -ano | findstr "LISTENING" | findstr ":3000 :443"
Write-Host "--- AUTO-START TASK ---"
Get-ScheduledTask -TaskName "GoldHome-Caddy-KeepAlive" -ErrorAction SilentlyContinue | Select-Object TaskName, State
