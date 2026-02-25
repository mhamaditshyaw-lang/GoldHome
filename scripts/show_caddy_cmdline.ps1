$id = 17276
$p = Get-CimInstance Win32_Process -Filter "ProcessId=$id" -ErrorAction SilentlyContinue
if ($p) { $p | Select-Object ProcessId,CommandLine | Format-List } else { Write-Host "Process $id not found" }