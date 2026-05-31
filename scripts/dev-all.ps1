param(
  [string]$LanIp
)

$ErrorActionPreference = "Stop"

function Get-PrivateIPv4 {
  $candidates = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object {
      $_.IPAddress -notlike "127.*" -and
      $_.IPAddress -match "^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)"
    } |
    Sort-Object SkipAsSource, InterfaceMetric

  if ($candidates) {
    return $candidates[0].IPAddress
  }

  return $null
}

function Test-ListeningPort([int]$Port) {
  return $null -ne (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

if (-not $LanIp) {
  $LanIp = Get-PrivateIPv4
}

if (-not $LanIp) {
  throw "Keine passende LAN-IP gefunden. Starte das Script mit -LanIp 192.168.x.x."
}

$busyPorts = @(3000, 5173, 5174 | Where-Object { Test-ListeningPort $_ })

if ($busyPorts.Count -gt 0) {
  throw "Folgende Ports sind schon belegt: $($busyPorts -join ', '). Nutze vorher .\scripts\stop-dev.ps1"
}

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$serverUrl = "http://$LanIp`:3000"
$controllerOrigin = "http://$LanIp`:5174"

Push-Location $projectRoot
try {
  npm run build:packages
  npm run games:sync-local
} finally {
  Pop-Location
}

$jobs = @(
  @{
    Title = "Open Party Lab Server"
    Command = @"
`$Host.UI.RawUI.WindowTitle = 'Open Party Lab Server'
Set-Location '$projectRoot'
`$env:PUBLIC_CONTROLLER_ORIGIN = '$controllerOrigin'
npm run dev --workspace @open-party-lab/server
"@
  },
  @{
    Title = "Open Party Lab Host"
    Command = @"
`$Host.UI.RawUI.WindowTitle = 'Open Party Lab Host'
Set-Location '$projectRoot'
`$env:VITE_SERVER_URL = '$serverUrl'
npm run dev --workspace @open-party-lab/host
"@
  },
  @{
    Title = "Open Party Lab Controller"
    Command = @"
`$Host.UI.RawUI.WindowTitle = 'Open Party Lab Controller'
Set-Location '$projectRoot'
`$env:VITE_SERVER_URL = '$serverUrl'
npm run dev --workspace @open-party-lab/controller
"@
  }
)

foreach ($job in $jobs) {
  Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-Command", $job.Command | Out-Null
}

Write-Host "Dev-Stack gestartet."
Write-Host "LAN-IP: $LanIp"
Write-Host "Server: $serverUrl"
Write-Host "Host: http://$LanIp`:5173"
Write-Host "Controller: $controllerOrigin"
