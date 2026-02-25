# Setup Caddy to auto-start on Windows boot using Task Scheduler
# This ensures Caddy runs 24/7

Write-Host "=== Setting up Caddy Auto-Start (24/7) ===" -ForegroundColor Cyan
Write-Host ""

$taskName = "GoldHome-Caddy-AutoStart"
$scriptPath = "C:\Users\Administrator\Documents\GoldHome\GoldHomeServices95\scripts\startup_pm2.ps1"

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "Removing existing task: $taskName" -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

Write-Host "Creating new scheduled task: $taskName" -ForegroundColor Yellow
Write-Host ""

# Create the action (what to run)
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""

# Create the trigger (when to run - at startup)
$trigger = New-ScheduledTaskTrigger -AtStartup

# Create settings
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1)

# Get the current user
$principal = New-ScheduledTaskPrincipal `
    -UserId "$env:USERDOMAIN\$env:USERNAME" `
    -LogonType Interactive `
    -RunLevel Highest

# Register the task
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Auto-start Caddy web server with PM2 for GoldHome Services (24/7 operation)" `
        -ErrorAction Stop
    
    Write-Host "✓ Task created successfully!" -ForegroundColor Green
    Write-Host ""
    
    # Verify the task
    $task = Get-ScheduledTask -TaskName $taskName
    Write-Host "Task Details:" -ForegroundColor Yellow
    Write-Host "  Name:          $($task.TaskName)" -ForegroundColor White
    Write-Host "  State:         $($task.State)" -ForegroundColor White
    Write-Host "  Trigger:       At system startup" -ForegroundColor White
    Write-Host "  Action:        Start Caddy via PM2" -ForegroundColor White
    Write-Host ""
    
    Write-Host "✓ Caddy will now auto-start every time Windows boots!" -ForegroundColor Green
    Write-Host "✓ Configured for 24/7 operation" -ForegroundColor Green
    
}
catch {
    Write-Host "✗ Error creating task: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "You may need to run this script as Administrator" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Testing the Task ===" -ForegroundColor Cyan
Write-Host "You can test the task by running:" -ForegroundColor Yellow
Write-Host "  Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
Write-Host ""
Write-Host "To view the task in Task Scheduler:" -ForegroundColor Yellow
Write-Host "  1. Press Win+R" -ForegroundColor White
Write-Host "  2. Type: taskschd.msc" -ForegroundColor White
Write-Host "  3. Look for: $taskName" -ForegroundColor White
Write-Host ""
