$ErrorActionPreference = 'Stop'
Write-Host "Querying GitHub API for latest Caddy release..."
$rel = Invoke-RestMethod -Uri 'https://api.github.com/repos/caddyserver/caddy/releases/latest' -Headers @{ 'User-Agent' = 'PowerShell' }
$asset = $rel.assets | Where-Object { ($_.name -match 'windows' -and $_.name -match 'amd64' -and $_.name -match '\.zip$') } | Select-Object -First 1
if (-not $asset) {
    Write-Host "No suitable asset found in release assets. Listing assets:"
    $rel.assets | ForEach-Object { Write-Host $_.name }
    exit 2
}
Write-Host "Found asset:" $asset.name
Write-Host "Download URL:" $asset.browser_download_url
$dl = "$env:TEMP\caddy_windows_from_api.zip"
Write-Host "Downloading to" $dl
Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $dl -UseBasicParsing
Write-Host "Downloaded OK"
$dest = 'C:\Program Files\Caddy'
if (-Not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest -Force | Out-Null }
Write-Host "Extracting to $dest"
Expand-Archive -Path $dl -DestinationPath $dest -Force
Remove-Item $dl -Force
Write-Host "Extracted to $dest"
