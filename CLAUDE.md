# Claude Code Toast Notifier

A VS Code extension that shows a Windows popup notification when Claude Code finishes responding or needs input. Built because the "proper" WinRT toast API silently drops notifications unless the calling process is registered under a real AUMID — see README.md "Why this exists" for the full story.

## Architecture

Two runtimes are involved and must stay decoupled:

1. **The VS Code extension** (`src/`, TypeScript, runs inside VS Code) — lets the user enable/disable notifications and configure them. It never shows the popup directly.
2. **The hook dispatcher** (`resources/`, PowerShell, runs standalone) — invoked by Claude Code itself (via `~/.claude/settings.json` hooks) completely outside VS Code. It reads a config file and performs the actual notification.

These two communicate through two files the extension writes into `~/.claude/notifier/` (the "stable dir", see `src/paths.ts`):
- The bundled scripts, mirrored there by `src/assets` on every activation (so hooks always point at a version-independent path, immune to the extension's install folder changing on every auto-update).
- `config.json`, rebuilt by `src/config` from the user's VS Code settings on activation, on every settings change, and on "Enable"/"Test Notification" — never baked into the hook command itself. **Never make the hook command carry settings values.** The hook command is static (`runNotify.ps1 -Event stop`); only `config.json` changes when the user changes a setting. This is what lets a settings change apply without re-running "Enable".

### The notification itself

`resources/runNotify.ps1` reads `config.json`; if `toastEnabled` is false it exits without doing anything, otherwise it shows the popup inline using `System.Windows.Forms.NotifyIcon` + `ShowBalloonTip`, not the raw WinRT `Windows.UI.Notifications.ToastNotificationManager` API — the WinRT API requires the calling process to be registered under a real AUMID (Start Menu shortcut with notification support) or it silently drops the toast with no exception. `NotifyIcon` needs no such registration and Windows 10/11 render its balloon as a native Action Center toast automatically. If toast notifications ever stop appearing, check Windows Settings → System → Notifications first (both the global toggle and the per-app "Windows PowerShell" toggle) before suspecting the code — a real-world debugging session traced a "nothing happens, no error" failure entirely to notifications being switched off at the OS level, not a bug in the script.

There is deliberately no channel/strategy abstraction here — there is exactly one notification mechanism, so `runNotify.ps1` just does it. If a second, genuinely different notification mechanism is ever needed, that's the point to reintroduce a seam (a registry + one file per mechanism); don't build it preemptively for a single implementation.

### Design pattern: Repository, for the two JSON files

`src/claudeHooks` owns `~/.claude/settings.json` (Claude Code's own file — read/merge/write it as a foreign format we adapt to, never assume we own its full contents). `src/config` owns our own `config.json`. Keep these two repositories independent; nothing outside `src/claudeHooks` should touch Claude's settings file, and nothing outside `src/config` should touch ours.

### Folder responsibilities

```
src/domain/       Our own vocabulary: NotificationEvent. No I/O.
src/config/         NotifierConfig type, building it from vscode.workspace settings, writing config.json.
src/claudeHooks/     ClaudeSettings type, reading/writing settings.json, registering/removing our hooks.
src/assets/           Copies resources/ into the stable dir. Stays generic — never special-cases a filename.
src/commands/           One file per VS Code command (enable/disable/testNotification), registered in index.ts.
src/paths.ts              Single source of truth for every absolute path used anywhere. Nothing else joins these paths by hand.
src/extension.ts           Entry point only: sync assets, sync config, register commands, listen for config changes.
```

## Conventions (non-negotiable — keep the project consistent)

- **No comments in code, anywhere** — not in `.ts`, not in `.ps1`. If logic needs explaining, make the name clearer or extract a function; don't annotate around it. This applies to future edits too, not just the current baseline.
- **One concept per file, one clear owner per folder.** Before adding a function to an existing file, check whether it actually belongs to that file's stated responsibility above — if not, it gets a new file/folder, not a bolt-on.
- **A folder with more than one file gets an `index.ts` barrel** that re-exports its public surface; nothing outside the folder imports a non-`index.ts` file directly from another folder.
- **`src/paths.ts` is the only place that builds absolute paths under `~/.claude/`.** Every other module asks it for a path; none of them call `path.join(os.homedir(), ...)` themselves.
- Apply SOLID pragmatically, not ceremonially: prefer a plain function over a class/interface unless there's an actual second implementation that needs the seam. Don't add dependency injection, factories, registries, or abstract base classes for a single implementation — this project removed exactly such an abstraction (a Strategy-pattern channel registry) once it was down to one notification mechanism; don't reintroduce it speculatively.
- DRY means the `NotificationEvent` enum and `HOOK_NAME_BY_EVENT` map are the only place that knows about Stop/Notification — don't reintroduce a second Stop/Notification branch anywhere else in the codebase.

## Build & verify

```
npm run compile     # cleans out/ first (tsc doesn't remove files for deleted sources — this bit us once), then builds
npx @vscode/vsce package
code --uninstall-extension lukalesko.claude-code-toast-notifier
code --install-extension claude-code-toast-notifier-0.1.0.vsix
```

There is no automated test suite. Verify a change actually works by running the dispatcher directly and confirming a popup is seen:

```
powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "$env:USERPROFILE\.claude\notifier\runNotify.ps1" -Event stop
```

If you hand-edit `~/.claude/notifier/config.json` while testing, don't hand-escape Windows paths — `\n`, `\.` etc. are read as JSON escapes (e.g. `\n` becomes a literal newline) and silently corrupt the path, which then makes the dispatcher fail with no visible error (its try/catch swallows it). Regenerate it with `syncConfig()` (or `JSON.stringify` via Node) instead of a manual heredoc.

After reinstalling the extension, reload the VS Code window (`Developer: Reload Window`) before testing — the extension host won't pick up a new install otherwise.

## Git

Never commit without an explicit ask in the current message, even right after finishing a clear unit of work. Leave changes in the working tree and describe what changed; the user commits and pushes themselves.
