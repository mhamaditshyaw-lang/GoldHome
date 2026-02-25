param(
    [string]$RepoCaddyDir = 'C:\Users\Administrator\Documents\GoldHomeServices95\GoldHomeServices95\caddy',
    [string]$ProgramFilesCaddy = 'C:\Program Files\Caddy',
    [string]$Domain = 'malialtwni.com',
    [string]$Email = 'you@your-email.com'
)

$ErrorActionPreference = 'Stop'
$timestamp = Get-Date -Format yyyyMMddHHmmss

Write-Host "Starting Caddy remove-and-reinstall script at $(Get-Date)"

# 1) Backup repo Caddy folder if it exists
if (Test-Path $RepoCaddyDir) {
    $backupRepo = "$RepoCaddyDir.bak.$timestamp"
    Write-Host "Backing up $RepoCaddyDir -> $backupRepo"
    Rename-Item -Path $RepoCaddyDir -NewName $backupRepo -Force
} else {
    Write-Host "No repo Caddy folder found at $RepoCaddyDir"
}

# 2) Stop and delete existing caddy service if present
if (Get-Service -Name caddy -ErrorAction SilentlyContinue) {
    Write-Host "Stopping existing caddy service..."
    Stop-Service -Name caddy -Force -ErrorAction SilentlyContinue
    Write-Host "Deleting existing caddy service..."
    sc.exe delete caddy | Out-Null
    Start-Sleep -Seconds 1
} else {
    Write-Host "No existing caddy service found."
}

# 3) Backup Program Files caddy folder if present
if (Test-Path $ProgramFilesCaddy) {
    $backupPF = "$ProgramFilesCaddy.bak.$timestamp"
    Write-Host "Moving existing $ProgramFilesCaddy -> $backupPF"
    Rename-Item -Path $ProgramFilesCaddy -NewName $backupPF -Force
} else {
    Write-Host "No existing Program Files caddy folder found."
}

# 4) Download latest Caddy
$zip = "$env:TEMP\caddy_windows.zip"
$downloadUrl = 'https://github.com/caddyserver/caddy/releases/latest/download/caddy_windows_amd64.zip'
Write-Host "Downloading Caddy from $downloadUrl to $zip"
Invoke-WebRequest -Uri $downloadUrl -OutFile $zip -UseBasicParsing

# 5) Extract to Program Files\Caddy
Write-Host "Extracting to $ProgramFilesCaddy"
New-Item -ItemType Directory -Path $ProgramFilesCaddy -Force | Out-Null
Expand-Archive -Path $zip -DestinationPath $ProgramFilesCaddy -Force
Remove-Item $zip -Force

# 6) Create a new Caddyfile
$caddyfilePath = Join-Path $ProgramFilesCaddy 'Caddyfile'
$caddyCfg = @"
$Domain {
    encode zstd gzip
    tls $Email
    handle_path /.well-known* {
        root * C:\Windows\Temp\caddy-challenges
        file_server
    }
    reverse_proxy localhost:3000
    log {
        output file $ProgramFilesCaddy\access.log
        level INFO
    }
}
"@

Write-Host "Writing new Caddyfile to $caddyfilePath"
Set-Content -Path $caddyfilePath -Value $caddyCfg -Force

# 7) Install and start Caddy service
$caddyExe = Join-Path $ProgramFilesCaddy 'caddy.exe'
if (Test-Path $caddyExe) {
    Write-Host "Installing Caddy service using $caddyExe"
    & $caddyExe service install --config $caddyfilePath 2>&1 | ForEach-Object { Write-Host $_ }
    Start-Sleep -Seconds 2
    Write-Host "Starting caddy service"
    Start-Service -Name caddy -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    Write-Host "Caddy service should be started."
} else {
    Write-Host "ERROR: caddy.exe not found at $caddyExe"
    exit 1
}

# 8) Validate config and show status
Write-Host "Validating Caddy configuration..."
& $caddyExe validate --config $caddyfilePath 2>&1 | ForEach-Object { Write-Host $_ }

Write-Host "Service status:"
Get-Service -Name caddy | Format-Table Name,Status

Write-Host "Caddy process details:"
Get-CimInstance Win32_Process -Filter "Name='caddy.exe'" | Select-Object ProcessId,CommandLine | Format-List

Write-Host "Done."
