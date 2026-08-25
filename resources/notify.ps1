<#
  Plays a sound file using the WinRT Windows.Media.Playback engine instead of the
  legacy winmm PlaySound/System.Media.SoundPlayer path. On some machines the legacy
  path is silently broken (no audio session is even created) while apps that use the
  modern WASAPI-based engine (browsers, Spotify, the Movies & TV app, games) work fine.
  Using the same engine as those apps sidesteps that broken layer entirely.
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$Sound
)

$ErrorActionPreference = 'Stop'

try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime | Out-Null
  $null = [Windows.Media.Playback.MediaPlayer, Windows.Media.Playback, ContentType = WindowsRuntime]
  $null = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
  $null = [Windows.Media.Core.MediaSource, Windows.Media.Core, ContentType = WindowsRuntime]

  function Wait-WinRTTask($AsyncOp, [Type]$ResultType) {
    $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() |
      Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $task = $asTask.Invoke($null, @($AsyncOp))
    $task.Wait() | Out-Null
    return $task.Result
  }

  $storageFile = Wait-WinRTTask ([Windows.Storage.StorageFile]::GetFileFromPathAsync($Sound)) ([Windows.Storage.StorageFile])

  $player = New-Object Windows.Media.Playback.MediaPlayer
  $player.Source = [Windows.Media.Core.MediaSource]::CreateFromStorageFile($storageFile)
  $player.Volume = 1.0
  $player.Play()

  # Fixed wait instead of hooking MediaEnded (WinRT events are unreliable to
  # marshal from PowerShell 5.1). Covers any of the bundled short notification clips.
  Start-Sleep -Seconds 3
}
catch {
  # Never let a broken audio path fail the calling Claude Code hook.
  exit 0
}
