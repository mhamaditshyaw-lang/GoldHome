$ErrorActionPreference = 'Stop'
$pf = 'C:\Program Files\Caddy'
if (-not (Test-Path $pf)) { Write-Host "Caddy folder not found at $pf"; exit 1 }
$caddyfilePath = Join-Path $pf 'Caddyfile'
$content = @'
malialtwni.com {
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
		output file C:\Users\Administrator\Documents\GoldHomeServices95\GoldHomeServices95\caddy\access.log
	}
}
'@
Set-Content -Path $caddyfilePath -Value $content -Force
Write-Host "Wrote Caddyfile to $caddyfilePath"
