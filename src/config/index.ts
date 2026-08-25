import { buildConfig } from './builder';
import { writeConfig } from './repository';

export { NotifierConfig } from './types';
export { buildConfig } from './builder';
export { writeConfig } from './repository';

export function syncConfig(): void {
  writeConfig(buildConfig());
}
