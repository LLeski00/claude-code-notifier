import * as path from 'path';
import * as os from 'os';

export function getStableDir(): string {
  return path.join(os.homedir(), '.claude', 'notifier');
}

export function getClaudeSettingsPath(): string {
  return path.join(os.homedir(), '.claude', 'settings.json');
}

export function getDispatcherScriptPath(): string {
  return path.join(getStableDir(), 'runNotify.ps1');
}

export function getConfigFilePath(): string {
  return path.join(getStableDir(), 'config.json');
}

export function getDefaultSoundPath(): string {
  return path.join(getStableDir(), 'sounds', 'notify.wav');
}
