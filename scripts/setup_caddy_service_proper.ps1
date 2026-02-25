# Script to properly setup Caddy as a Windows service
# This ensures Caddy runs persistently and restarts automatically

$ErrorActionPreference = 'Stop'

Write-Host "=== Caddy Service Setup for GoldHome ===" -ForegroundColor Cyan
Write-Host ""

# Get the project directory (parent of scripts folder)
$projectDir = Split-Path -Parent $PSScriptRoot
$caddyfilePath = Join-Path $projectDir "Caddyfile"

Write-Host "Project directory: $projectDir" -ForegroundColor Yellow
Write-Host "Caddyfile path: $caddyfilePath" -ForegroundColor Yellow
Write-Host ""

# Find Caddy executable
$caddyExe = Get-Command caddy -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $caddyExe) {
    Write-Host "ERROR: Caddy executable not found in PATH!" -ForegroundColor Red
    Write-Host "Please install Caddy first or add it to your PATH" -ForegroundColor Red
    exit 1
}

Write-Host "Caddy executable: $caddyExe" -ForegroundColor Green
Write-Host ""

# Check if Caddyfile exists
if (-not (Test-Path $caddyfilePath)) {
    Write-Host "ERROR: Caddyfile not found at $caddyfilePath" -ForegroundColor Red
    exit 1
}

# Stop all existing Caddy processes
Write-Host "Stopping all Caddy processes..." -ForegroundColor Yellow
Get-Process -Name caddy -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Stop and remove existing Caddy services
Write-Host "Cleaning up old Caddy services..." -ForegroundColor Yellow
$services = @('caddy', 'caddy_service', 'caddy_service2', 'CaddyService', 'GoldHomeCaddy')
foreach ($svc in $services) {
    $existingService = Get-Service -Name $svc -ErrorAction SilentlyContinue
    if ($existingService) {
        Write-Host "  Stopping and removing service: $svc"
        Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
        sc.exe delete $svc | Out-Null
        Start-Sleep -Seconds 1
    }
}

Write-Host ""
Write-Host "Creating new Caddy service..." -ForegroundColor Yellow

# Create the service with proper configuration
# Using the full path to Caddyfile
$serviceName = "GoldHomeCaddy"
$displayName = "Caddy Web Server (GoldHome)"
$description = "Caddy web server for GoldHome Services - handles HTTPS and reverse proxy"

# Build the command line for the service
# Important: Use --config with absolute path and --adapter caddyfile
$binaryPath = "`"$caddyExe`" run --config `"$caddyfilePath`" --adapter caddyfile"

Write-Host "Service name: $serviceName"
Write-Host "Binary path: $binaryPath"
Write-Host ""

try {
    # Create the service
    New-Service -Name $serviceName `
                -BinaryPathName $binaryPath `
                -DisplayName $displayName `
                -Description $description `
                -StartupType Automatic `
                -ErrorAction Stop
    
    Write-Host "✓ Service created successfully!" -ForegroundColor Green
} catch {
    Write-Host "ERROR creating service: $_" -ForegroundColor Red
    exit 1
}

# Configure the service to restart on failure
Write-Host ""
Write-Host "Configuring service recovery options..." -ForegroundColor Yellow
sc.exe failure $serviceName reset= 86400 actions= restart/5000/restart/10000/restart/30000 | Out-Null

# Start the service
Write-Host ""
Write-Host "Starting Caddy service..." -ForegroundColor Yellow

try {
    Start-Service -Name $serviceName -ErrorAction Stop
    Start-Sleep -Seconds 3
    
    $service = Get-Service -Name $serviceName
    if ($service.Status -eq 'Running') {
        Write-Host "✓ Caddy service is running!" -ForegroundColor Green
    } else {
        Write-Host "⚠ Service exists but status is: $($service.Status)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "ERROR starting service: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Checking Windows Event Log for errors..." -ForegroundColor Yellow
    Get-EventLog -LogName System -Source "Service Control Manager" -Newest 5 -ErrorAction SilentlyContinue | 
        Where-Object { $_.Message -like "*$serviceName*" } | 
        Format-Table -AutoSize
}

# Show final status
Write-Host ""
Write-Host "=== Final Status ===" -ForegroundColor Cyan
Write-Host ""

$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service) {
    Write-Host "Service Status:" -ForegroundColor Yellow
    $service | Format-List Name, DisplayName, Status, StartType
}

Write-Host "Caddy Processes:" -ForegroundColor Yellow
$processes = Get-Process -Name caddy -ErrorAction SilentlyContinue
if ($processes) {
    $processes | Format-Table Id, ProcessName, @{Label="Memory (MB)"; Expression={[math]::Round($_.WS / 1MB, 2)}} -AutoSize
} else {
    Write-Host "  No Caddy processes running" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Check if Caddy is serving: https://malialtwni.com" -ForegroundColor White
Write-Host "2. View service status: Get-Service -Name $serviceName" -ForegroundColor White
Write-Host "3. View Caddy logs in Event Viewer (Windows Logs > Application)" -ForegroundColor White
Write-Host "4. To stop: Stop-Service -Name $serviceName" -ForegroundColor White
Write-Host "5. To restart: Restart-Service -Name $serviceName" -ForegroundColor White
Write-Host ""
