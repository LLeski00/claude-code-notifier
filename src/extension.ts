import * as vscode from 'vscode';
import { syncBundledFiles } from './notifierAssets';
import { runSetup, runDisable, runTestSound } from './commands';

export function activate(context: vscode.ExtensionContext): void {
  try {
    syncBundledFiles(context);
  } catch {}

  context.subscriptions.push(
    vscode.commands.registerCommand('claudeNotifier.setup', runSetup),
    vscode.commands.registerCommand('claudeNotifier.disable', runDisable),
    vscode.commands.registerCommand('claudeNotifier.testSound', runTestSound)
  );
}

export function deactivate(): void {}
