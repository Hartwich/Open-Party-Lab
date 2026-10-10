# Wi-Fi Direct legacy access point. Keep this process alive for the entire session.
# Credentials and stop signal use stdin; closing the launcher pipe stops the AP.
param([switch]$Check)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$publisher = $null
function Read-Setting {
    $line = [Console]::ReadLine()
    if ($null -eq $line) { throw 'Missing offline hotspot settings.' }
    [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($line))
}
try {
    $null = [Windows.Devices.WiFiDirect.WiFiDirectAdvertisementPublisher, Windows.Devices.WiFiDirect, ContentType=WindowsRuntime]
    if ($Check) {
        @{success=$true; apiAvailable=$true; deviceSupport='requires_start_test'} | ConvertTo-Json -Compress
        exit 0
    }
    $name = Read-Setting
    $password = Read-Setting
    if ([Text.Encoding]::UTF8.GetByteCount($name) -notin 1..32) { throw 'The network name must contain 1 to 32 UTF-8 bytes.' }
    if ($password -notmatch '^[\x20-\x7E]{8,63}$') { throw 'The password must contain 8 to 63 printable ASCII characters.' }
    # Never take over a running Mobile hotspot. Windows gives it priority over Wi-Fi Direct.
    $null = [Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType=WindowsRuntime]
    $null = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType=WindowsRuntime]
    foreach ($profile in [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles()) {
        try { $manager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($profile) }
        catch { continue }
        if ($manager.TetheringOperationalState.ToString() -ne 'Off') { throw 'A Windows Mobile hotspot is active or changing state. Turn it off first, or use your current network.' }
    }
    $before = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | ForEach-Object { "$($_.InterfaceIndex):$($_.IPAddress)" })
    $publisher = New-Object Windows.Devices.WiFiDirect.WiFiDirectAdvertisementPublisher
    $publisher.Advertisement.IsAutonomousGroupOwnerEnabled = $true
    $publisher.Advertisement.LegacySettings.IsEnabled = $true
    $publisher.Advertisement.LegacySettings.Ssid = $name
    $publisher.Advertisement.LegacySettings.Passphrase.Password = $password
    $publisher.Start()
    $address = $null
    for ($attempt = 0; $attempt -lt 60 -and -not $address; $attempt++) {
        $state = $publisher.Status.ToString()
        if ($state -eq 'Aborted') { throw 'Windows refused the offline hotspot. Check Wi-Fi is enabled, Wi-Fi Direct driver support, and that Mobile hotspot or Miracast is not running.' }
        if ($state -eq 'Started') {
            # Only accept a new address: never advertise a pre-existing upstream/VPN IP.
            $candidate = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object {
                $_.AddressState -eq 'Preferred' -and
                $_.IPAddress -match '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)' -and
                "$($_.InterfaceIndex):$($_.IPAddress)" -notin $before
            } | Where-Object {
                $adapter = Get-NetAdapter -InterfaceIndex $_.InterfaceIndex -IncludeHidden -ErrorAction SilentlyContinue
                # Some modern Intel drivers expose the GO as a physical Wi-Fi adapter.
                $adapter -and ($adapter.Virtual -or $adapter.NdisPhysicalMedium -eq 9 -or $adapter.InterfaceDescription -like '*Wi-Fi Direct*')
            } | Select-Object -First 1
            if ($candidate) { $address = $candidate.IPAddress }
        }
        if (-not $address) { Start-Sleep -Milliseconds 500 }
    }
    if (-not $address) { throw 'Windows did not provide an offline hotspot IPv4 address. This adapter/driver may not support a standalone access point.' }
    @{success=$true; address=$address; name=$publisher.Advertisement.LegacySettings.Ssid; maxClients=0; upstreamId=''; restoreConfig=''} | ConvertTo-Json -Compress
    # A line, EOF, or launcher crash releases only this publisher's access point.
    $null = [Console]::ReadLine()
} catch {
    @{success=$false; error=$_.Exception.Message} | ConvertTo-Json -Compress
    exit 1
} finally {
    if ($publisher) { $publisher.Stop() }
}
