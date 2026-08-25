import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ClaudeSettings } from './claudeHooks';

export function getClaudeSettingsPath(): string {
  return path.join(os.homedir(), '.claude', 'settings.json');
}

export function readSettings(settingsPath: string): ClaudeSettings {
  if (!fs.existsSync(settingsPath)) {
    return {};
  }
  const raw = fs.readFileSync(settingsPath, 'utf8').trim();
  if (raw.length === 0) {
    return {};
  }
  return JSON.parse(raw) as ClaudeSettings;
}

export function writeSettings(settingsPath: string, settings: ClaudeSettings): void {
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
}
