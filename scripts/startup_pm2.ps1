# Startup script for PM2/Caddy - to be run on system boot
# This restores PM2 processes that were saved

Write-Host "Starting PM2 and restoring processes..." -ForegroundColor Cyan

# Resurrect PM2 processes from saved state
pm2 resurrect

Write-Host ""
Write-Host "PM2 Process List:" -ForegroundColor Yellow
pm2 list

Write-Host ""
Write-Host "Caddy startup complete!" -ForegroundColor Green
