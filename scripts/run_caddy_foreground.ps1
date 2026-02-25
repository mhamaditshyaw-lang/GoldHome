$ErrorActionPreference = 'Continue'
$out = 'C:\Users\Administrator\AppData\Local\Temp\caddy_run_log.txt'
$err = 'C:\Users\Administrator\AppData\Local\Temp\caddy_run_err.txt'
if (Test-Path $out) { Remove-Item $out -Force }
if (Test-Path $err) { Remove-Item $err -Force }
$p = Start-Process -FilePath 'C:\Program Files\Caddy\caddy.exe' -ArgumentList 'run','--config','C:\Program Files\Caddy\Caddyfile' -RedirectStandardOutput $out -RedirectStandardError $err -PassThru
Start-Sleep -Seconds 5
Write-Host "Process started Id=$($p.Id)"
Write-Host '---- stdout ----'
if (Test-Path $out) { Get-Content $out -Raw } else { Write-Host '(no stdout)' }
Write-Host '---- stderr ----'
if (Test-Path $err) { Get-Content $err -Raw } else { Write-Host '(no stderr)' }
try { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue } catch { }
Write-Host 'Foreground run finished.'
