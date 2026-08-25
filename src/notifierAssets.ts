import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function getStableDir(): string {
  return path.join(os.homedir(), '.claude', 'notifier');
}

export function getScriptPath(): string {
  return path.join(getStableDir(), 'notify.ps1');
}

export function getDefaultSoundPath(): string {
  return path.join(getStableDir(), 'notify.wav');
}

export function getSoundPath(): string {
  const custom = vscode.workspace.getConfiguration('claudeNotifier').get<string>('soundFile', '');
  return custom && custom.trim().length > 0 ? custom.trim() : getDefaultSoundPath();
}

export function syncBundledFiles(context: vscode.ExtensionContext): void {
  const stableDir = getStableDir();
  fs.mkdirSync(stableDir, { recursive: true });
  fs.copyFileSync(
    path.join(context.extensionPath, 'resources', 'notify.ps1'),
    getScriptPath()
  );
  fs.copyFileSync(
    path.join(context.extensionPath, 'resources', 'sounds', 'notify.wav'),
    getDefaultSoundPath()
  );
}
