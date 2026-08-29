import * as vscode from 'vscode';
import { NotifierConfig } from './types';

export function buildConfig(): NotifierConfig {
  const workspaceConfig = vscode.workspace.getConfiguration('claudeNotifier');

  return {
    notifyOnIdle: workspaceConfig.get<boolean>('notifyOnIdle', true),
    toastEnabled: workspaceConfig.get<boolean>('toastEnabled', true),
  };
}
