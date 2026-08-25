import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { getDispatcherScriptPath } from '../paths';
import { NotificationEvent } from '../domain';
import { syncConfig } from '../config';

export function testSound(): void {
  syncConfig();

  const child = spawn(
    'powershell.exe',
    [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy',
      'Bypass',
      '-WindowStyle',
      'Hidden',
      '-File',
      getDispatcherScriptPath(),
      '-Event',
      NotificationEvent.TaskFinished,
    ],
    { windowsHide: true }
  );

  child.on('error', (err) => vscode.window.showErrorMessage(`Claude Notifier: failed to play sound: ${err.message}`));
}
