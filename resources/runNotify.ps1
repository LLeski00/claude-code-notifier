param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('stop', 'notification')]
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

try {
  Add-Type -AssemblyName System.Windows.Forms
  Add-Type -AssemblyName System.Drawing

  switch ($Event) {
    'stop' { $title = 'Claude Code'; $message = 'Task finished' }
    'notification' { $title = 'Claude Code'; $message = 'Needs your input' }
    default { $title = 'Claude Code'; $message = 'Notification' }
  }

  $notifyIcon = New-Object System.Windows.Forms.NotifyIcon
  $notifyIcon.Icon = [System.Drawing.SystemIcons]::Information
  $notifyIcon.Visible = $true
  Start-Sleep -Milliseconds 300
  $notifyIcon.ShowBalloonTip(5000, $title, $message, [System.Windows.Forms.ToolTipIcon]::Info)

  $deadline = (Get-Date).AddSeconds(5)
  while ((Get-Date) -lt $deadline) {
    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 100
  }

  $notifyIcon.Dispose()
} catch {
  exit 0
}
