import * as vscode from 'vscode';
import { enableNotifications } from './enable';
import { disableNotifications } from './disable';
import { testSound } from './testSound';

export function registerCommands(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('claudeNotifier.setup', enableNotifications),
    vscode.commands.registerCommand('claudeNotifier.disable', disableNotifications),
    vscode.commands.registerCommand('claudeNotifier.testSound', testSound)
  );
}
