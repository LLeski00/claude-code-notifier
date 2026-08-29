# Claude Windows Notifier

A VS Code extension that pops up a Windows notification whenever [Claude Code](https://claude.com/claude-code) finishes a task or needs your input — like the ones Windows Update shows, in the bottom-right of your screen, branded as Visual Studio Code. Works no matter how you run Claude Code (this extension, a terminal, anywhere), since it hooks into Claude Code itself, not VS Code.

*Unofficial community extension. Not affiliated with or endorsed by Anthropic.*

## Setup

1. **Turn on Windows notifications for Visual Studio Code** — this is required, there's no other way the popup can appear:
   - the main switch: **Settings → System → Notifications**
   - the **Visual Studio Code** switch further down that same page
2. Open the Command Palette (`Ctrl+Shift+P`) and run **`Claude Notifier: Enable Notifications`**.
3. Run **`Claude Notifier: Test Notification`** to confirm a popup shows up.

If the popup doesn't appear and you don't get an error, it's almost always step 1 — see [Troubleshooting](#troubleshooting).

## Requirements

- Windows, with a normal (non-portable) install of VS Code — the popup is shown under VS Code's own registered identity, so it only works if VS Code is installed the regular way.
- Windows notifications enabled for **Visual Studio Code**, as in [Setup](#setup).

## Commands

Run these from the Command Palette (`Ctrl+Shift+P`):

| Command | What it does |
|---|---|
| `Claude Notifier: Enable Notifications` | Registers the notifier with Claude Code and turns popups on. |
| `Claude Notifier: Disable Notifications` | Turns popups back off. |
| `Claude Notifier: Test Notification` | Shows a popup immediately, so you can check it works. |

## When you get notified

Once enabled, a popup shows when:
- Claude finishes responding to you,
- Claude needs something from you — a permission prompt, or (if `notifyOnIdle` is on) it's been sitting idle for about a minute waiting on you,
- Claude hits its usage limit and can't continue, or
- a subagent finishes (if `notifySubagentFinished` is on) — separately from the main task-finished popup.

## Settings

Search "Claude Notifier" in VS Code's Settings:

| Setting | Default | What it does |
|---|---|---|
| `claudeNotifier.toastEnabled` | On | Master switch for the popup notification. |
| `claudeNotifier.notifyOnIdle` | On | Also popup when Claude's been idle ~60s waiting for you, not just for permission prompts. |
| `claudeNotifier.notifySubagentFinished` | On | Popup when a subagent finishes, separately from the main task-finished popup. |

A settings change applies immediately — no need to re-run `Enable Notifications` afterwards.

## Troubleshooting

**Popup not showing, no error?** Check Windows notifications are on for **Visual Studio Code** specifically (see [Requirements](#requirements)) — this is by far the most common cause, and this extension has no way to detect or report that they're off.

**Want to silence just this notification's sound?** Go to **Settings → System → Notifications**, click into the **Visual Studio Code** entry, and turn off "Play a sound when a notification arrives." This only affects this popup, not other VS Code or Windows notifications.

## Why it's branded as VS Code, not "Claude Code"

Windows only shows these popups for apps it already trusts — normally granted by installing the app the regular way (a Start Menu shortcut, etc). A background script triggered by Claude Code has no such identity of its own to borrow.

This extension works around that by reusing an identity Windows *already* trusts: VS Code's. It asks Windows to show the popup as if VS Code itself sent it, which only works because VS Code is genuinely installed. A fresh, self-registered "Claude Code" identity was tried and doesn't work — Windows silently drops or badly delays toasts from an AUMID it doesn't already recognize as a real installed app. So there's no fallback: if VS Code's identity isn't recognized, or its notifications are off, nothing shows.

## Platform

Windows only.

## For contributors

<details>
<summary>Technical details</summary>

Two runtimes are involved, and stay decoupled:

- **The VS Code extension** (`src/`, TypeScript) — lets you enable/disable notifications and configure them from VS Code. It never shows the popup itself.
- **The hook dispatcher** (`resources/runNotify.ps1`, PowerShell) — invoked by Claude Code itself via hooks in `~/.claude/settings.json`, completely outside VS Code. It reads a small `config.json` and shows the popup if enabled.

Four [Claude Code hooks](https://code.claude.com/docs/en/hooks) — **Stop**, **Notification**, **StopFailure** (matched to `rate_limit`), and **SubagentStop** — are registered, all calling the same dispatcher script.

The popup itself uses the WinRT `Windows.UI.Notifications.ToastNotificationManager` API, under the running VS Code build's own AUMID (`Microsoft.VisualStudioCode` / `.Insiders`) — but only after `Get-StartApps` confirms Windows already has that AUMID registered, since an unregistered AUMID makes the API silently drop the toast with no exception.

```
resources/runNotify.ps1   dispatcher: reads config.json, shows the toast under VS Code's AUMID

src/domain/               NotificationEvent vocabulary shared by the extension and the hook registration
src/config/                builds & persists the dispatcher's config.json from VS Code settings
src/claudeHooks/            reads/writes ~/.claude/settings.json, registers the dispatcher hooks
src/commands/                 enable / disable / test-notification command handlers
```

</details>

## License

MIT © Luka Leskovec
