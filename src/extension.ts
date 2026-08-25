import * as vscode from 'vscode';
import { syncBundledFiles } from './assets';
import { syncConfig } from './config';
import { registerCommands } from './commands';

export function activate(context: vscode.ExtensionContext): void {
  try {
    syncBundledFiles(context);
    syncConfig();
  } catch {}

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('claudeNotifier')) {
        try {
          syncConfig();
        } catch {}
      }
    })
  );

  registerCommands(context);
}

export function deactivate(): void {}
