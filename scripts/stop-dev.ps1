$ErrorActionPreference = "Stop"

$ports = 3000, 5173, 5174
$processIds = @(
  foreach ($port in $ports) {
    Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
  }
) | Sort-Object -Unique

if ($processIds.Count -eq 0) {
  Write-Host "Keine Dev-Prozesse auf 3000, 5173 oder 5174 gefunden."
  exit 0
}

foreach ($processId in $processIds) {
  try {
    Stop-Process -Id $processId -Force -ErrorAction Stop
    Write-Host "Prozess $processId wurde beendet."
  } catch {
    Write-Warning "Prozess $processId konnte nicht beendet werden."
  }
}
