import { spawn } from 'child_process';

export function playSound(scriptPath: string, soundPath: string, onError: (message: string) => void): void {
  const child = spawn(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', scriptPath, '-Sound', soundPath],
    { windowsHide: true }
  );

  child.on('error', (err) => onError(err.message));
}
