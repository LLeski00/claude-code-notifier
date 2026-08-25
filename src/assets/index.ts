import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getStableDir } from '../paths';

function copyRecursive(source: string, destination: string): void {
  const stat = fs.statSync(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(destination, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(destination, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

export function syncBundledFiles(context: vscode.ExtensionContext): void {
  copyRecursive(path.join(context.extensionPath, 'resources'), getStableDir());
}
