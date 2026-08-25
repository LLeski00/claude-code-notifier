import * as vscode from 'vscode';
import { readClaudeSettings, writeClaudeSettings, withNotifierEnabled } from '../claudeHooks';
import { getClaudeSettingsPath, getDispatcherScriptPath } from '../paths';
import { syncConfig } from '../config';

export function enableNotifications(): void {
  const settingsPath = getClaudeSettingsPath();

  let settings;
  try {
    settings = readClaudeSettings(settingsPath);
  } catch (err) {
    vscode.window.showErrorMessage(
      `Claude Notifier: couldn't parse ${settingsPath} as JSON. Fix or back up that file, then try again. (${(err as Error).message})`
    );
    return;
  }

  const notifyOnIdle = vscode.workspace.getConfiguration('claudeNotifier').get<boolean>('notifyOnIdle', true);

  writeClaudeSettings(settingsPath, withNotifierEnabled(settings, getDispatcherScriptPath(), notifyOnIdle));
  syncConfig();

  vscode.window.showInformationMessage(
    'Claude Notifier: notifications enabled (applies to this and every other Claude Code session, CLI included).'
  );
}
