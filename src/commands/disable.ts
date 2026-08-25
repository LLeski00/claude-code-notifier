import * as vscode from 'vscode';
import { readClaudeSettings, writeClaudeSettings, withNotifierDisabled } from '../claudeHooks';
import { getClaudeSettingsPath, getDispatcherScriptPath } from '../paths';

export function disableNotifications(): void {
  const settingsPath = getClaudeSettingsPath();

  let settings;
  try {
    settings = readClaudeSettings(settingsPath);
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

  writeClaudeSettings(settingsPath, withNotifierDisabled(settings, getDispatcherScriptPath()));
  vscode.window.showInformationMessage('Claude Notifier: notifications disabled.');
}
