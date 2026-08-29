param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('stop', 'notification', 'usageLimit', 'subagentStop')]
  [string]$Event
)

$ErrorActionPreference = 'Stop'
$configPath = Join-Path $PSScriptRoot 'config.json'

try {
  $config = Get-Content $configPath -Raw | ConvertFrom-Json
} catch {
  exit 0
}

if (-not $config.toastEnabled) {
  exit 0
}

if ($Event -eq 'subagentStop' -and -not $config.notifySubagentFinished) {
  exit 0
}

switch ($Event) {
  'stop' { $title = 'Claude Code'; $message = 'Task finished' }
  'notification' { $title = 'Claude Code'; $message = 'Needs your input' }
  'usageLimit' { $title = 'Claude Code'; $message = 'Usage limit reached' }
  'subagentStop' { $title = 'Claude Code'; $message = 'Subagent finished' }
  default { $title = 'Claude Code'; $message = 'Notification' }
}

function Show-ToastUnderRegisteredApp([string]$aumid, [string]$title, [string]$message) {
  if (-not (Get-StartApps | Where-Object { $_.AppID -eq $aumid })) {
    return $false
  }

  [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
  [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

  $xmlText = @"
<toast>
  <visual>
    <binding template="ToastGeneric">
      <text>$title</text>
      <text>$message</text>
    </binding>
  </visual>
</toast>
"@

  $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
  $xml.LoadXml($xmlText)
  $toast = New-Object Windows.UI.Notifications.ToastNotification $xml
  [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($aumid).Show($toast)
  return $true
}

try {
  if ($config.vscodeAumid) {
    Show-ToastUnderRegisteredApp $config.vscodeAumid $title $message | Out-Null
  }
} catch {
  exit 0
}
