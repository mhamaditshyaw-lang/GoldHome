# Setup Caddy to run with PM2 for persistent operation
# PM2 handles auto-restart and is more reliable than Windows services for this use case

Write-Host "=== Setting up Caddy with PM2 ===" -ForegroundColor Cyan
Write-Host ""

# Get the project directory
$projectDir = Split-Path -Parent $PSScriptRoot
$caddyfilePath = Join-Path $projectDir "Caddyfile"

Write-Host "Project directory: $projectDir" -ForegroundColor Yellow
Write-Host "Caddyfile path: $caddyfilePath" -ForegroundColor Yellow
Write-Host ""

# Find Caddy executable
$caddyExe = Get-Command caddy -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $caddyExe) {
    Write-Host "ERROR: Caddy executable not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Caddy executable: $caddyExe" -ForegroundColor Green
Write-Host ""

# Stop any existing Caddy processes
Write-Host "Stopping existing Caddy processes and PM2 apps..." -ForegroundColor Yellow
pm2 delete goldhome-caddy 2>$null
pm2 delete caddy 2>$null
Get-Process -Name caddy -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Start Caddy with PM2
Write-Host "Starting Caddy with PM2..." -ForegroundColor Yellow
$wrapperScript = Join-Path $projectDir "scripts\start-caddy.bat"
Write-Host "Using wrapper: $wrapperScript" -ForegroundColor Gray
Write-Host ""

# Use the batch wrapper which PM2 can execute
pm2 start $wrapperScript --name "goldhome-caddy"

Write-Host ""
Write-Host "Saving PM2 configuration..." -ForegroundColor Yellow
pm2 save

Write-Host ""
Write-Host "=== Caddy PM2 Status ===" -ForegroundColor Cyan
pm2 list

Write-Host ""
Write-Host "=== Usage ===" -ForegroundColor Cyan
Write-Host "View logs:    pm2 logs goldhome-caddy" -ForegroundColor White
Write-Host "Stop:         pm2 stop goldhome-caddy" -ForegroundColor White
Write-Host "Start:        pm2 start goldhome-caddy" -ForegroundColor White
Write-Host "Restart:      pm2 restart goldhome-caddy" -ForegroundColor White
Write-Host "Status:       pm2 status goldhome-caddy" -ForegroundColor White
Write-Host ""
Write-Host "PM2 will automatically restart Caddy if it crashes!" -ForegroundColor Green
Write-Host ""
