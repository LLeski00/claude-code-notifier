import * as path from 'path';

const AUMID_BY_EXE_NAME: Record<string, string> = {
  'code.exe': 'Microsoft.VisualStudioCode',
  'code - insiders.exe': 'Microsoft.VisualStudioCode.Insiders',
};

export function detectVscodeAumid(): string | null {
  const exeName = path.basename(process.execPath).toLowerCase();
  return AUMID_BY_EXE_NAME[exeName] ?? null;
}
