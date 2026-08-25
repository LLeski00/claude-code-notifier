import * as vscode from 'vscode';
import { buildNotifyCommand, withNotifierEnabled, withNotifierDisabled } from './claudeHooks';
import { getClaudeSettingsPath, readSettings, writeSettings } from './settingsFile';
import { getScriptPath, getSoundPath } from './notifierAssets';
import { playSound } from './soundPlayer';

function readSettingsOrShowError(settingsPath: string): ReturnType<typeof readSettings> | undefined {
  try {
    return readSettings(settingsPath);
  } catch (err) {
    vscode.window.showErrorMessage(
      `Claude Notifier: couldn't parse ${settingsPath} as JSON. Fix or back up that file, then try again. (${(err as Error).message})`
    );
    return undefined;
  }
}

export function runSetup(): void {
  const settingsPath = getClaudeSettingsPath();
  const settings = readSettingsOrShowError(settingsPath);
  if (!settings) {
    return;
  }

  const command = buildNotifyCommand(getScriptPath(), getSoundPath());
  const notifyOnIdle = vscode.workspace.getConfiguration('claudeNotifier').get<boolean>('notifyOnIdle', true);

  writeSettings(settingsPath, withNotifierEnabled(settings, getScriptPath(), command, notifyOnIdle));

  vscode.window.showInformationMessage(
    'Claude Notifier: sound notifications enabled (applies to this and every other Claude Code session, CLI included).'
  );
}

export function runDisable(): void {
  const settingsPath = getClaudeSettingsPath();
  const settings = readSettingsOrShowError(settingsPath);
  if (!settings) {
    return;
  }

  if (!settings.hooks) {
    vscode.window.showInformationMessage('Claude Notifier: nothing to disable.');
    return;
  }

  writeSettings(settingsPath, withNotifierDisabled(settings, getScriptPath()));
  vscode.window.showInformationMessage('Claude Notifier: sound notifications disabled.');
}

export function runTestSound(): void {
  playSound(getScriptPath(), getSoundPath(), (message) =>
    vscode.window.showErrorMessage(`Claude Notifier: failed to play sound: ${message}`)
  );
}
