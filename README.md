# Sound Notifier for Claude Code

A sound alert for [Claude Code](https://claude.com/claude-code) that actually plays — even on Windows machines where system sounds are silently broken.

*Unofficial community extension. Not affiliated with or endorsed by Anthropic.*

## Why this exists

Several "Claude Code notifier" extensions already exist, but on some Windows machines they simply produce no sound: no error, no popup, nothing. On those machines, `Settings → Sound → Sounds` also fails — clicking **Test** on any system sound plays nothing, even though every other app (browser, Spotify, games, VLC) has audio working perfectly.

The cause is that most notifier tools (and Windows' own sound-scheme "Test" button) go through the legacy `winmm` / `PlaySound` / `System.Media.SoundPlayer` audio path. On some setups that path is broken — no audio session is even created — while the modern WASAPI-based path used by browsers and media apps works fine.

This extension sidesteps the broken path entirely: it plays sound through the same **`Windows.Media.Playback`** (WinRT) engine that Movies & TV and other modern apps use. If your browser and media apps have sound, this will too.

## What it does

Adds two [Claude Code hooks](https://code.claude.com/docs/en/hooks) — **Stop** (Claude finishes responding) and **Notification** (Claude needs your input: a permission prompt, or idle ~60s waiting for you) — written to `~/.claude/settings.json`, so they apply everywhere Claude Code runs: this VS Code extension's chat panel, the CLI, anywhere.

Both hooks call a single dispatcher script that reads a small config file and runs whichever notification **channels** are enabled. Sound is the only channel today; a Windows toast-style popup (bottom-right of the screen, like a Windows Update notification) is planned as a second channel — the dispatcher already loops over however many channels are configured, so adding one is a matter of dropping in a new channel implementation rather than changing how hooks are wired up.

## Architecture

```
resources/runNotify.ps1        dispatcher: reads config.json, runs each enabled channel
resources/channels/sound.ps1   the sound channel (WinRT Windows.Media.Playback)

src/domain/                    NotificationEvent, the NotificationChannel contract
src/channels/                  one file per channel, registered in an array (Strategy pattern)
src/config/                    builds & persists the dispatcher's config.json from VS Code settings
src/claudeHooks/                reads/writes ~/.claude/settings.json, registers the dispatcher hook
src/commands/                    enable / disable / test-sound command handlers
```

## Usage

1. Run **`Claude Notifier: Enable Sound Notifications`** from the Command Palette.
2. That's it. You'll hear a sound whenever Claude finishes or needs you.

Other commands:
- **`Claude Notifier: Test Sound`** — plays the sound immediately, to check it works.
- **`Claude Notifier: Disable Sound Notifications`** — removes the hooks again.

## Settings

| Setting | Default | Description |
|---|---|---|
| `claudeNotifier.soundFile` | *(bundled sound)* | Absolute path to a custom `.wav` file to play instead. |
| `claudeNotifier.notifyOnIdle` | `true` | Also play a sound when Claude has been idle ~60s waiting for input, not just on permission prompts. |

## Platform

Windows only — the sound channel (`resources/channels/sound.ps1`) uses PowerShell and the WinRT `Windows.Media.Playback` API.

## License

MIT © Luka Leskovec
