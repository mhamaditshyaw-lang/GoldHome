param(
    [string]$DestDir = 'C:\Users\Administrator\Documents\GoldHome\GoldHomeServices95\caddy',
    [string]$Domain = 'malialtwni.com',
    [string]$Email = 'you@your-email.com'
)

$ErrorActionPreference = 'Stop'
Write-Host "Install Caddy to: $DestDir"

# Ensure destination exists
if (-Not (Test-Path $DestDir)) { New-Item -ItemType Directory -Path $DestDir -Force | Out-Null }

# Query GitHub Releases API for latest release
Write-Host 'Querying GitHub for latest Caddy release...'
$rel = Invoke-RestMethod -Uri 'https://api.github.com/repos/caddyserver/caddy/releases/latest' -Headers @{ 'User-Agent' = 'PowerShell' }
$asset = $rel.assets | Where-Object { ($_.name -match 'windows' -and $_.name -match 'amd64' -and $_.name -match '\.zip$') } | Select-Object -First 1
if (-not $asset) {
    Write-Error 'No windows amd64 zip asset found in release assets.'
    exit 2
}
Write-Host "Found asset: $($asset.name)"
$dl = Join-Path $env:TEMP "caddy_repo_install_$((Get-Date).ToString('yyyyMMddHHmmss')).zip"
Write-Host "Downloading $($asset.browser_download_url) -> $dl"
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $dl -UseBasicParsing
Write-Host 'Download complete.'

# Extract into destination
Write-Host "Extracting archive to $DestDir"
Expand-Archive -Path $dl -DestinationPath $DestDir -Force
Remove-Item $dl -Force
Write-Host 'Extraction complete.'

# Ensure caddy.exe exists
$caddyExe = Join-Path $DestDir 'caddy.exe'
if (-not (Test-Path $caddyExe)) {
    Write-Error "caddy.exe not found in $DestDir after extraction"
    exit 1
}
Write-Host "caddy.exe is at $caddyExe"

# Write Caddyfile (use the content you provided)
$caddyfile = Join-Path $DestDir 'Caddyfile'
$caddyCfg = @"
$Domain {
	# Serve ACME http-01 challenge files directly from disk so Caddy
	# can answer Let's Encrypt validation requests without forwarding
	# them to the backend (which returned 403 previously).
	handle_path /.well-known* {
		root * C:\Windows\Temp\caddy-challenges
		file_server
	}

	# Then proxy the rest to the Node backend
	# The Node app is running on port 3000 on this host — proxy there.
	reverse_proxy localhost:3000

	log {
		output file $DestDir\access.log
	}
}
"@
Set-Content -Path $caddyfile -Value $caddyCfg -Force
Write-Host "Wrote Caddyfile to $caddyfile"

# Validate config
Write-Host 'Validating Caddy configuration...'
& $caddyExe validate --config $caddyfile 2>&1 | ForEach-Object { Write-Host $_ }
Write-Host 'Validation complete.'

Write-Host 'Installation to repo finished. You can run the binary at:'
Write-Host "  $caddyExe run --config $caddyfile"
