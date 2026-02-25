param(
    [string]$Src = 'C:\Program Files\Caddy',
    [string]$Dest = 'C:\Users\Administrator\Documents\GoldHome\GoldHomeServices95\caddy',
    [string]$Domain = 'malialtwni.com'
)
$ErrorActionPreference = 'Stop'
Write-Host "Copying Caddy from $Src to $Dest"
if (-Not (Test-Path $Src)) { Write-Error "Source not found: $Src"; exit 1 }
if (Test-Path $Dest) { Write-Host "Destination exists, removing: $Dest"; Remove-Item -Path $Dest -Recurse -Force }
Copy-Item -Path $Src -Destination $Dest -Recurse -Force
Write-Host "Copied files to $Dest"

# Write Caddyfile in destination
$caddyfile = Join-Path $Dest 'Caddyfile'
$caddyCfg = @"
$Domain {
	handle_path /.well-known* {
		root * C:\Windows\Temp\caddy-challenges
		file_server
	}
	reverse_proxy localhost:3000
	log {
		output file $Dest\access.log
	}
}
"@
Set-Content -Path $caddyfile -Value $caddyCfg -Force
Write-Host "Wrote Caddyfile to $caddyfile"

# Validate using copied binary
$caddyExe = Join-Path $Dest 'caddy.exe'
if (-Not (Test-Path $caddyExe)) { Write-Error "caddy.exe not found at $caddyExe"; exit 1 }
Write-Host "Validating config with $caddyExe"
& $caddyExe validate --config $caddyfile 2>&1 | ForEach-Object { Write-Host $_ }
Write-Host 'Done.'
