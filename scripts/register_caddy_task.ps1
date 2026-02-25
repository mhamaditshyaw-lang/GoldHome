# Setup Caddy to auto-start on Windows boot via Task Scheduler
$taskName = "GoldHome-Caddy-KeepAlive"
$scriptPath = "C:\Users\Administrator\Documents\GoldHome\GoldHomeServices95\scripts\startup_pm2.ps1"

# Delete if exists
Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false

# Action
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""
# Trigger
$trigger = New-ScheduledTaskTrigger -AtStartup
# Settings
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
# Principal
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Register
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal

Write-Host "Task '$taskName' registered successfully to run at startup as SYSTEM."
