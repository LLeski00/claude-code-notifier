import * as fs from 'fs';
import * as path from 'path';
import { getConfigFilePath } from '../paths';
import { NotifierConfig } from './types';

export function writeConfig(config: NotifierConfig): void {
  const configPath = getConfigFilePath();
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
}
