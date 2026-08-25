param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('stop', 'notification')]
  [string]$Event
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$configPath = Join-Path $root 'config.json'

try {
  $config = Get-Content $configPath -Raw | ConvertFrom-Json
} catch {
  exit 0
}

foreach ($channelId in $config.channels.PSObject.Properties.Name) {
  $channelSettings = $config.channels.$channelId
  if (-not $channelSettings.enabled) {
    continue
  }

  $channelScript = Join-Path $root "channels\$channelId.ps1"
  if (-not (Test-Path $channelScript)) {
    continue
  }

  try {
    . $channelScript
    Invoke-Notify -Event $Event -Settings $channelSettings
  } catch {
    continue
  }
}
