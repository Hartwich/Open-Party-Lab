param([ValidateSet('check', 'start', 'stop')][string]$Action = 'check')
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)
$started = $false
$manager = $null
$previousConfig = $null
$configured = $false
function Wait-WinRT($operation, [Type]$resultType) {
    $methods = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 }
    if ($resultType) {
        $method = $methods | Where-Object { $_.IsGenericMethodDefinition -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
        $task = $method.MakeGenericMethod($resultType).Invoke($null, @($operation))
    } else {
        $method = $methods | Where-Object { -not $_.IsGenericMethod -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' } | Select-Object -First 1
        $task = $method.Invoke($null, @($operation))
    }
    # Do not abandon an in-flight start: it could create an unowned hotspot.
    if ($resultType) { return $task.GetAwaiter().GetResult() }
    $null = $task.GetAwaiter().GetResult()
}
function Read-InputLine {
    $line = [Console]::ReadLine()
    if ($null -eq $line) { throw 'Missing hotspot settings.' }
    [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($line))
}
try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime
    $null = [Windows.Networking.Connectivity.NetworkInformation, Windows.Networking.Connectivity, ContentType=WindowsRuntime]
    $null = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager, Windows.Networking.NetworkOperators, ContentType=WindowsRuntime]
    $name = $password = $upstreamId = $null
    if ($Action -ne 'check') {
        $name = Read-InputLine
        $password = Read-InputLine
        $upstreamId = Read-InputLine
        $restoreConfig = Read-InputLine
    }
    $profile = [Windows.Networking.Connectivity.NetworkInformation]::GetInternetConnectionProfile()
    if ($Action -eq 'stop' -and $upstreamId) {
        $profile = [Windows.Networking.Connectivity.NetworkInformation]::GetConnectionProfiles() | Where-Object { $_.NetworkAdapter.NetworkAdapterId.ToString() -eq $upstreamId } | Select-Object -First 1
    }
    if (-not $profile) { throw 'Windows has no internet connection to share. Connect this PC to Wi-Fi or Ethernet, or use an existing local network without the hotspot option.' }
    if ($Action -ne 'stop') {
        $capability = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::GetTetheringCapabilityFromConnectionProfile($profile)
        if ($capability.ToString() -ne 'Enabled') { throw ('Windows cannot create a hotspot on this PC: ' + $capability + '. Check the Wi-Fi adapter and Windows Mobile hotspot settings.') }
    }
    $manager = [Windows.Networking.NetworkOperators.NetworkOperatorTetheringManager]::CreateFromConnectionProfile($profile)
    if ($Action -eq 'check') {
        @{ success=$true; state=$manager.TetheringOperationalState.ToString(); maxClients=$manager.MaxClientCount } | ConvertTo-Json -Compress
        exit 0
    }
    if ($Action -eq 'stop') {
        $current = $manager.GetCurrentAccessPointConfiguration()
        if ($manager.TetheringOperationalState.ToString() -eq 'On' -and $current.Ssid -eq $name -and $current.Passphrase -eq $password) {
            $result = Wait-WinRT ($manager.StopTetheringAsync()) ([Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult, Windows.Networking.NetworkOperators, ContentType=WindowsRuntime])
            if ($result.Status.ToString() -ne 'Success') { throw ('Windows could not stop the hotspot: ' + $result.Status) }
            if ($restoreConfig) {
                $previous = $restoreConfig | ConvertFrom-Json
                $restore = New-Object Windows.Networking.NetworkOperators.NetworkOperatorTetheringAccessPointConfiguration
                $restore.Ssid = $previous.name
                $restore.Passphrase = $previous.password
                if ($restore.PSObject.Properties['Band'] -and $null -ne $previous.band) { $restore.Band = $previous.band }
                Wait-WinRT ($manager.ConfigureAccessPointAsync($restore)) $null
            }
        }
        @{ success=$true } | ConvertTo-Json -Compress
        exit 0
    }
    if ($manager.TetheringOperationalState.ToString() -ne 'Off') { throw 'A Windows hotspot is already active or changing state. Disable the hotspot option to use your existing network, or turn the existing hotspot off in Windows first.' }
    if ([Text.Encoding]::UTF8.GetByteCount($name) -lt 1 -or [Text.Encoding]::UTF8.GetByteCount($name) -gt 32) { throw 'The network name must contain 1 to 32 UTF-8 bytes.' }
    if ($password -notmatch '^[\x20-\x7E]{8,63}$') { throw 'The password must contain 8 to 63 printable ASCII characters.' }
    $previousConfig = $manager.GetCurrentAccessPointConfiguration()
    $beforeAddresses = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.AddressState -eq 'Preferred' } | ForEach-Object { "$($_.InterfaceIndex):$($_.IPAddress)" })
    $config = New-Object Windows.Networking.NetworkOperators.NetworkOperatorTetheringAccessPointConfiguration
    $config.Ssid = $name
    $config.Passphrase = $password
    # 2.4 GHz reaches more phones; older Windows versions may lack this property.
    if ($config.PSObject.Properties['Band']) { $config.Band = 1 }
    Wait-WinRT ($manager.ConfigureAccessPointAsync($config)) $null
    $configured = $true
    $result = Wait-WinRT ($manager.StartTetheringAsync()) ([Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult, Windows.Networking.NetworkOperators, ContentType=WindowsRuntime])
    if ($result.Status.ToString() -ne 'Success') { throw ('Windows could not start the hotspot: ' + $result.Status + '. Check Windows Mobile hotspot settings.') }
    $started = $true
    $address = $null
    for ($attempt = 0; $attempt -lt 30 -and -not $address; $attempt++) {
        # Modern drivers can name the hotspot adapter like the physical Wi-Fi
        # device. Exclude the upstream adapter and recognize newly assigned IPs.
        $adapters = Get-NetAdapter -IncludeHidden | Where-Object { $_.Status -eq 'Up' -and $_.InterfaceGuid.ToString() -ne $profile.NetworkAdapter.NetworkAdapterId.ToString() }
        foreach ($adapter in $adapters) {
            $candidate = Get-NetIPAddress -InterfaceIndex $adapter.ifIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object {
                $_.AddressState -eq 'Preferred' -and $_.IPAddress -match '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)' -and
                ($adapter.InterfaceDescription -like '*Wi-Fi Direct*' -or $adapter.Virtual -or "$($_.InterfaceIndex):$($_.IPAddress)" -notin $beforeAddresses)
            } | Select-Object -First 1
            if ($candidate) { $address = $candidate.IPAddress; break }
        }
        if (-not $address) { Start-Sleep -Milliseconds 500 }
    }
    if (-not $address) { throw 'The hotspot started, but its local IPv4 address could not be detected. The game has not started.' }
    $previous = @{ name=$previousConfig.Ssid; password=$previousConfig.Passphrase; band=$null }
    if ($previousConfig.PSObject.Properties['Band']) { $previous.band = [int]$previousConfig.Band }
    @{ success=$true; started=$true; address=$address; maxClients=$manager.MaxClientCount; upstreamId=$profile.NetworkAdapter.NetworkAdapterId.ToString(); restoreConfig=($previous | ConvertTo-Json -Compress) } | ConvertTo-Json -Compress
} catch {
    $message = $_.Exception.Message
    if ($started -and $manager) {
        try { $null = Wait-WinRT ($manager.StopTetheringAsync()) ([Windows.Networking.NetworkOperators.NetworkOperatorTetheringOperationResult, Windows.Networking.NetworkOperators, ContentType=WindowsRuntime]) }
        catch { $message += ' Automatic hotspot cleanup failed. Turn it off in Windows Mobile hotspot settings.' }
    }
    if ($configured -and $previousConfig -and $manager.TetheringOperationalState.ToString() -eq 'Off') {
        try { Wait-WinRT ($manager.ConfigureAccessPointAsync($previousConfig)) $null }
        catch { $message += ' Previous Windows hotspot settings could not be restored.' }
    }
    @{ success=$false; error=$message } | ConvertTo-Json -Compress
    exit 1
}
