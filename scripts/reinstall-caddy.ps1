# Reinstall Caddy script
# Run as Administrator. Review before running.

try {
    $repoCaddyDir = 'C:\Users\Administrator\Documents\GoldHomeServices95\GoldHomeServices95\caddy'
    $programFilesCaddy = 'C:\Program Files\Caddy'
    $timestamp = (Get-Date).ToString('yyyyMMddHHmmss')

    Write-Host "Timestamp: $timestamp"

    # 1) Back up repo Caddy folder if it exists
    if (Test-Path $repoCaddyDir) {
        $backupRepo = "$repoCaddyDir.bak.$timestamp"
        Write-Host "Backing up $repoCaddyDir -> $backupRepo"
        Rename-Item -Path $repoCaddyDir -NewName $backupRepo -Force
    } else {
        Write-Host "No repo Caddy folder found at $repoCaddyDir"
    }

    # 2) Ensure any existing caddy service is stopped and removed
    $svc = Get-Service -Name caddy -ErrorAction SilentlyContinue
    if ($svc) {
        Write-Host "Stopping existing caddy service..."
        Stop-Service -Name caddy -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        sc.exe delete caddy | Out-Null
        Write-Host "Deleted existing caddy service."
    } else {
        Write-Host "No existing caddy service found."
    }

    # 3) Remove/backup existing Program Files caddy folder (backup first)
    if (Test-Path $programFilesCaddy) {
        $backupPF = "$programFilesCaddy.bak.$timestamp"
        Write-Host "Moving existing $programFilesCaddy -> $backupPF"
        Rename-Item -Path $programFilesCaddy -NewName $backupPF -Force
    } else {
        Write-Host "No existing Caddy in Program Files."
    }

    # 4) Download latest Caddy (Windows amd64)
    $zip = "$env:TEMP\caddy_windows.zip"
    $downloadUrl = 'https://github.com/caddyserver/caddy/releases/latest/download/caddy_windows_amd64.zip'
    Write-Host "Downloading Caddy from $downloadUrl to $zip"
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zip -UseBasicParsing

    # 5) Expand to Program Files\Caddy
    Write-Host "Extracting to $programFilesCaddy"
    New-Item -ItemType Directory -Path $programFilesCaddy -Force | Out-Null
    Expand-Archive -Path $zip -DestinationPath $programFilesCaddy -Force
    Remove-Item $zip -Force

    # 6) Create a new Caddyfile (edit domain/email as needed)
    $domain = 'malialtwni.com'
    $email = 'you@your-email.com'  # CHANGE to your email to request real certs
    $caddyfilePath = Join-Path $programFilesCaddy 'Caddyfile'
    $caddyCfg = @"
$domain {
    encode zstd gzip
    tls $email
    handle_path /.well-known* {
        root * C:\Windows\Temp\caddy-challenges
        file_server
    }
    reverse_proxy localhost:3000
    log {
        output file $programFilesCaddy\access.log
        level INFO
    }
}
"@
    Set-Content -Path $caddyfilePath -Value $caddyCfg -Force
    Write-Host "Wrote new Caddyfile to $caddyfilePath"

    # 7) Install Caddy as a service and start it
    $caddyExe = Join-Path $programFilesCaddy 'caddy.exe'
    if (Test-Path $caddyExe) {
        Write-Host "Installing Caddy service..."
        & $caddyExe service install --config $caddyfilePath
        Start-Sleep -Seconds 2
        try { Start-Service -Name caddy -ErrorAction Stop } catch { }
        Write-Host "Caddy service installed and started (if supported)."
    } else {
        Write-Host "Caddy binary not found at $caddyExe. Aborting service install."
        exit 1
    }

    # 8) Validate config and show status
    Write-Host "Validating Caddy config..."
    & $caddyExe validate --config $caddyfilePath

    Write-Host "Service status:"
    Get-Service -Name caddy | Format-Table Name,Status

    Write-Host "Caddy process info:"
    Get-CimInstance Win32_Process -Filter "Name='caddy.exe'" | Select-Object ProcessId,CommandLine

    Write-Host "Done. Please check https://$domain"
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
