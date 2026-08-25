import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';

interface HookCommand {
  type: string;
  command: string;
}

interface HookGroup {
  matcher: string;
  hooks: HookCommand[];
}

interface ClaudeSettings {
  hooks?: {
    Stop?: HookGroup[];
    Notification?: HookGroup[];
    [key: string]: HookGroup[] | undefined;
  };
  [key: string]: unknown;
}

function getClaudeSettingsPath(): string {
  return path.join(os.homedir(), '.claude', 'settings.json');
}

// Hooks reference files by absolute path, but a marketplace extension's install
// folder is versioned (e.g. ...\publisher.name-0.1.0\...) and gets replaced on every
// auto-update. Pointing hooks straight at context.extensionPath would silently break
// after each update. Instead we mirror the bundled script/sound into a stable,
// version-independent location and point hooks there.
function getStableDir(): string {
  return path.join(os.homedir(), '.claude', 'notifier');
}

function syncBundledFiles(context: vscode.ExtensionContext): void {
  const stableDir = getStableDir();
  fs.mkdirSync(stableDir, { recursive: true });
  fs.copyFileSync(
    path.join(context.extensionPath, 'resources', 'notify.ps1'),
    path.join(stableDir, 'notify.ps1')
  );
  fs.copyFileSync(
    path.join(context.extensionPath, 'resources', 'sounds', 'notify.wav'),
    path.join(stableDir, 'notify.wav')
  );
}

function readSettings(settingsPath: string): ClaudeSettings {
  if (!fs.existsSync(settingsPath)) {
    return {};
  }
  const raw = fs.readFileSync(settingsPath, 'utf8').trim();
  if (raw.length === 0) {
    return {};
  }
  return JSON.parse(raw) as ClaudeSettings;
}

function writeSettings(settingsPath: string, settings: ClaudeSettings): void {
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
}

function getScriptPath(): string {
  return path.join(getStableDir(), 'notify.ps1');
}

function getSoundPath(): string {
  const custom = vscode.workspace.getConfiguration('claudeNotifier').get<string>('soundFile', '');
  if (custom && custom.trim().length > 0) {
    return custom.trim();
  }
  return path.join(getStableDir(), 'notify.wav');
}

function buildCommand(scriptPath: string, soundPath: string): string {
  return `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "${scriptPath}" -Sound "${soundPath}"`;
}

function removeOurHooks(groups: HookGroup[] | undefined, scriptPath: string): HookGroup[] {
  if (!groups) {
    return [];
  }
  const cleaned: HookGroup[] = [];
  for (const group of groups) {
    const remainingHooks = group.hooks.filter((h) => !h.command.includes(scriptPath));
    if (remainingHooks.length > 0) {
      cleaned.push({ ...group, hooks: remainingHooks });
    }
  }
  return cleaned;
}

function runSetup(): void {
  const settingsPath = getClaudeSettingsPath();
  let settings: ClaudeSettings;
  try {
    settings = readSettings(settingsPath);
  } catch (err) {
    vscode.window.showErrorMessage(
      `Claude Notifier: couldn't parse ${settingsPath} as JSON. Fix or back up that file, then try again. (${(err as Error).message})`
    );
    return;
  }

  const scriptPath = getScriptPath();
  const soundPath = getSoundPath();
  const command = buildCommand(scriptPath, soundPath);
  const notifyOnIdle = vscode.workspace.getConfiguration('claudeNotifier').get<boolean>('notifyOnIdle', true);

  settings.hooks = settings.hooks ?? {};

  const stopGroups = removeOurHooks(settings.hooks.Stop, scriptPath);
  stopGroups.push({ matcher: '', hooks: [{ type: 'command', command }] });
  settings.hooks.Stop = stopGroups;

  const notificationGroups = removeOurHooks(settings.hooks.Notification, scriptPath);
  notificationGroups.push({
    matcher: notifyOnIdle ? '' : 'permission_prompt',
    hooks: [{ type: 'command', command }],
  });
  settings.hooks.Notification = notificationGroups;

  writeSettings(settingsPath, settings);

  vscode.window.showInformationMessage(
    'Claude Notifier: sound notifications enabled (applies to this and every other Claude Code session, CLI included).'
  );
}

function runDisable(): void {
  const settingsPath = getClaudeSettingsPath();
  let settings: ClaudeSettings;
  try {
    settings = readSettings(settingsPath);
  } catch (err) {
    vscode.window.showErrorMessage(
      `Claude Notifier: couldn't parse ${settingsPath} as JSON. (${(err as Error).message})`
    );
    return;
  }

  if (!settings.hooks) {
    vscode.window.showInformationMessage('Claude Notifier: nothing to disable.');
    return;
  }

  const scriptPath = getScriptPath();
  settings.hooks.Stop = removeOurHooks(settings.hooks.Stop, scriptPath);
  settings.hooks.Notification = removeOurHooks(settings.hooks.Notification, scriptPath);

  if (settings.hooks.Stop.length === 0) {
    delete settings.hooks.Stop;
  }
  if (settings.hooks.Notification.length === 0) {
    delete settings.hooks.Notification;
  }
  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  writeSettings(settingsPath, settings);
  vscode.window.showInformationMessage('Claude Notifier: sound notifications disabled.');
}

function runTestSound(): void {
  const scriptPath = getScriptPath();
  const soundPath = getSoundPath();

  const child = spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', scriptPath, '-Sound', soundPath],
    { windowsHide: true }
  );

  child.on('error', (err) => {
    vscode.window.showErrorMessage(`Claude Notifier: failed to play sound: ${err.message}`);
  });
}

export function activate(context: vscode.ExtensionContext): void {
  // Cheap, idempotent: keeps ~/.claude/notifier in sync with whatever version of the
  // extension is currently installed, so hooks (which point at that stable path) keep
  // working across auto-updates without the user having to re-run setup.
  try {
    syncBundledFiles(context);
  } catch {
    // best-effort; setup/testSound will surface a real error if files are truly missing
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('claudeNotifier.setup', () => runSetup()),
    vscode.commands.registerCommand('claudeNotifier.disable', () => runDisable()),
    vscode.commands.registerCommand('claudeNotifier.testSound', () => runTestSound())
  );
}

export function deactivate(): void {
  // no-op
}
