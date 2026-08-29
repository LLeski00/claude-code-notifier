# Claude Code Toast Notifier

Shows a little Windows popup in the bottom-right of your screen whenever [Claude Code](https://claude.com/claude-code) finishes a task or needs your input — the same kind of popup you get from Windows Update. It's shown under VS Code's own name and icon.

*Unofficial community extension. Not affiliated with or endorsed by Anthropic.*

## Why this exists

Windows has a "proper" way for apps to show these popups, but it only works for apps Windows already recognizes as genuinely installed — normally granted through a Start Menu shortcut. A background script has no such identity of its own, so it can't use that path directly.

This extension works around that by borrowing an identity Windows already trusts: VS Code's. It asks Windows to show the popup as if VS Code itself sent it. That only works if VS Code is installed normally (true almost all the time) and if Windows notifications are turned on for it — see [Requirements](#requirements) below, since **this is the only way the popup can appear.**

## What it does

Once enabled, you'll get a popup whenever:
- Claude finishes responding to you,
- Claude needs something from you — like a permission prompt, or it's been waiting quietly for about a minute, or
- Claude hits its usage limit and can't keep going.

This works no matter how you use Claude Code — in this VS Code extension, in a terminal, anywhere.

## How to use it

1. Make sure Windows notifications are turned on (see [Requirements](#requirements) below).
2. Open the Command Palette (`Ctrl+Shift+P`) and run **`Claude Notifier: Enable Notifications`**.
3. That's it — you'll now see a popup whenever Claude finishes or needs you.

Other commands, also run from the Command Palette:
- **`Claude Notifier: Test Notification`** — shows a popup right away, so you can check it works.
- **`Claude Notifier: Disable Notifications`** — turns the popups back off.

## Settings

You can adjust these in VS Code's Settings (search for "Claude Notifier"):

| Setting | Default | What it does |
|---|---|---|
| `claudeNotifier.toastEnabled` | On | Turns the popup notification on or off. |
| `claudeNotifier.notifyOnIdle` | On | Also shows a popup if Claude has been sitting idle for about a minute waiting for you, not just for permission prompts. |

## Requirements

**Windows notifications must be turned on for Visual Studio Code — this is mandatory, there's no other way for the popup to appear:**
- the main switch: **Settings → System → Notifications**, and
- the switch for **Visual Studio Code** specifically, a bit further down that same page.

If either of these is off, the popup won't appear and there's no error message to tell you why — this is a Windows setting, not something this extension controls.

## Troubleshooting

**Popups not showing up?** Check the [Requirements](#requirements) above first — this is by far the most common cause.

**Want to turn off the notification sound?** Windows automatically plays its default chime whenever this popup appears. To mute just this extension's sound: go to **Settings → System → Notifications**, click into the **Visual Studio Code** entry, and turn off "Play a sound when a notification arrives." This won't affect notification sounds from any other app.

## Platform

Windows only.

## For contributors

<details>
<summary>Technical details</summary>

The popup is shown via the WinRT `Windows.UI.Notifications.ToastNotificationManager` API (in `resources/runNotify.ps1`), reusing the running VS Code build's own AUMID (`Microsoft.VisualStudioCode` / `.Insiders`) — but only after confirming via `Get-StartApps` that Windows already has that AUMID registered, since an *unregistered* AUMID causes this API to silently drop the toast with no exception. There is no fallback mechanism: if the AUMID isn't registered, nothing shows.

Three [Claude Code hooks](https://code.claude.com/docs/en/hooks) — **Stop**, **Notification**, and **StopFailure** (matched to `rate_limit`) — are written to `~/.claude/settings.json`. All three call the same dispatcher script, which reads a small config file and shows the popup if it's enabled.

```
resources/runNotify.ps1   dispatcher: reads config.json, shows the toast under VS Code's AUMID

src/domain/               NotificationEvent vocabulary shared by the extension and the hook registration
src/config/                builds & persists the dispatcher's config.json from VS Code settings
src/claudeHooks/            reads/writes ~/.claude/settings.json, registers the dispatcher hook
src/commands/                 enable / disable / test-notification command handlers
```

</details>

## License

MIT © Luka Leskovec
</content>
