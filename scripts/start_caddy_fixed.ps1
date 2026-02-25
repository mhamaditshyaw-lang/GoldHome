# Simple script to start Caddy with PM2 using ecosystem config

Write-Host "=== Starting Caddy with PM2 (Fixed) ===" -ForegroundColor Cyan
Write-Host ""

# Stop old processes
Write-Host "Stopping old Caddy instances..." -ForegroundColor Yellow
pm2 delete goldhome-caddy 2>$null
pm2 delete caddy 2>$null
Get-Process -Name caddy -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start using ecosystem config
Write-Host "Starting Caddy from ecosystem config..." -ForegroundColor Yellow
pm2 start ecosystem.caddy.config.cjs

# Save PM2 config
Write-Host ""
Write-Host "Saving PM2 configuration..." -ForegroundColor Yellow
pm2 save

# Setup PM2 to start on boot
Write-Host "Setting up PM2 startup..." -ForegroundColor Yellow
pm2 startup

Write-Host ""
Write-Host "=== PM2 Status ===" -ForegroundColor Cyan
pm2 list

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host "View logs:    pm2 logs goldhome-caddy" -ForegroundColor White
Write-Host "Monitor:      pm2 monit" -ForegroundColor White
Write-Host "Restart:      pm2 restart goldhome-caddy" -ForegroundColor White
Write-Host "Stop:         pm2 stop goldhome-caddy" -ForegroundColor White
Write-Host ""
