# Claude Code Toast Notifier

A VS Code extension that shows a Windows popup notification when Claude Code finishes responding or needs input. Built because the "proper" WinRT toast API silently drops notifications unless the calling process is registered under a real AUMID — see README.md "Why this exists" for the full story.

The popup is always branded as **Visual Studio Code** (its name and icon) — the dispatcher reuses VS Code's own already-installed, already-trusted app identity, never one this project invents itself. This only works if the running VS Code build's AUMID is registered on the machine (true for a normal Code/Insiders install) and Windows notifications are enabled for it. There is no fallback: if either condition isn't met, no popup shows. See "The notification itself" below for why a self-registered AUMID doesn't work and was deliberately not pursued, and README.md's "Requirements" section for what this means for the user.

## Architecture

Two runtimes are involved and must stay decoupled:

1. **The VS Code extension** (`src/`, TypeScript, runs inside VS Code) — lets the user enable/disable notifications and configure them. It never shows the popup directly.
2. **The hook dispatcher** (`resources/`, PowerShell, runs standalone) — invoked by Claude Code itself (via `~/.claude/settings.json` hooks) completely outside VS Code. It reads a config file and performs the actual notification.

These two communicate through two files the extension writes into `~/.claude/notifier/` (the "stable dir", see `src/paths.ts`):
- The bundled scripts, mirrored there by `src/assets` on every activation (so hooks always point at a version-independent path, immune to the extension's install folder changing on every auto-update).
- `config.json`, rebuilt by `src/config` from the user's VS Code settings on activation, on every settings change, and on "Enable"/"Test Notification" — never baked into the hook command itself. **Never make the hook command carry settings values.** The hook command is static (`runNotify.ps1 -Event stop`); only `config.json` changes when the user changes a setting. This is what lets a settings change apply without re-running "Enable".

### The notification itself

`resources/runNotify.ps1` reads `config.json`; if `toastEnabled` is false it exits without doing anything. Otherwise it shows a **WinRT toast under VS Code's own AUMID** — the only mechanism, no fallback. If `config.vscodeAumid` is set (detected by `src/config/vscodeAumid.ts` from `process.execPath` — `Code.exe` → `Microsoft.VisualStudioCode`, `Code - Insiders.exe` → `Microsoft.VisualStudioCode.Insiders`) *and* `Get-StartApps` confirms that AUMID is actually registered on this machine, the dispatcher calls `Windows.UI.Notifications.ToastNotificationManager` with that AUMID. This renders as a native toast attributed to "Visual Studio Code" — its real name and icon — because we're reusing an identity Windows already trusts, not inventing one. If either condition fails (unrecognized VS Code build, or the hook fired before `config.json` exists), `Show-ToastUnderRegisteredApp` returns `$false` / the outer `if` is skipped and the script exits having shown nothing — there used to be a `System.Windows.Forms.NotifyIcon` balloon-tip fallback for this case, deliberately removed so the extension has exactly one code path to reason about; don't reintroduce it without a real second requirement driving it. This is also why Windows notifications being enabled for **Visual Studio Code** specifically (not "Windows PowerShell" — that only mattered for the removed fallback) is a hard requirement now, not just a recommendation. See README.md's "Requirements" section.

**Why not just register our own AUMID for "Claude Code" branding?** This was tried and reverted — a Start Menu shortcut with `System.AppUserModel.ID` set via `IPersistFile`/`IPropertyStore` genuinely persists (verified independently through `Shell.Application`'s `ExtendedProperty`), but Windows doesn't trust a freshly-invented AUMID for toast purposes: the first `Show()` either drops silently or renders many seconds late, misattributed to the underlying process name anyway. This is the exact failure mode described above and in README.md's "Why this exists" — a real AUMID needs to already be known to the OS's notification permission store, which only happens for apps genuinely installed the normal way (like VS Code itself), not for a shortcut a script drops into the Start Menu on the fly. Don't re-attempt self-registration without solving that trust problem first.

If toast notifications ever stop appearing, check Windows Settings → System → Notifications first (both the global toggle and the per-app **Visual Studio Code** toggle) before suspecting the code — a real-world debugging session traced a "nothing happens, no error" failure entirely to notifications being switched off at the OS level, not a bug in the script.

### Design pattern: Repository, for the two JSON files

`src/claudeHooks` owns `~/.claude/settings.json` (Claude Code's own file — read/merge/write it as a foreign format we adapt to, never assume we own its full contents). `src/config` owns our own `config.json`. Keep these two repositories independent; nothing outside `src/claudeHooks` should touch Claude's settings file, and nothing outside `src/config` should touch ours.

### Folder responsibilities

```
src/domain/       Our own vocabulary: NotificationEvent. No I/O.
src/config/         NotifierConfig type, building it from vscode.workspace settings (plus the detected VS Code AUMID), writing config.json.
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
