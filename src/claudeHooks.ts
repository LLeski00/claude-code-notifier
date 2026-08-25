export interface HookCommand {
  type: string;
  command: string;
}

export interface HookGroup {
  matcher: string;
  hooks: HookCommand[];
}

export interface ClaudeSettings {
  hooks?: {
    Stop?: HookGroup[];
    Notification?: HookGroup[];
    [key: string]: HookGroup[] | undefined;
  };
  [key: string]: unknown;
}

export function buildNotifyCommand(scriptPath: string, soundPath: string): string {
  return `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "${scriptPath}" -Sound "${soundPath}"`;
}

function withoutOurHooks(groups: HookGroup[] | undefined, scriptPath: string): HookGroup[] {
  if (!groups) {
    return [];
  }
  const cleaned: HookGroup[] = [];
  for (const group of groups) {
    const remainingHooks = group.hooks.filter((hook) => !hook.command.includes(scriptPath));
    if (remainingHooks.length > 0) {
      cleaned.push({ ...group, hooks: remainingHooks });
    }
  }
  return cleaned;
}

export function withNotifierEnabled(
  settings: ClaudeSettings,
  scriptPath: string,
  command: string,
  notifyOnIdle: boolean
): ClaudeSettings {
  const hooks = settings.hooks ?? {};

  const stopGroups = withoutOurHooks(hooks.Stop, scriptPath);
  stopGroups.push({ matcher: '', hooks: [{ type: 'command', command }] });

  const notificationGroups = withoutOurHooks(hooks.Notification, scriptPath);
  notificationGroups.push({
    matcher: notifyOnIdle ? '' : 'permission_prompt',
    hooks: [{ type: 'command', command }],
  });

  return {
    ...settings,
    hooks: { ...hooks, Stop: stopGroups, Notification: notificationGroups },
  };
}

export function withNotifierDisabled(settings: ClaudeSettings, scriptPath: string): ClaudeSettings {
  if (!settings.hooks) {
    return settings;
  }

  const hooks = { ...settings.hooks };
  hooks.Stop = withoutOurHooks(hooks.Stop, scriptPath);
  hooks.Notification = withoutOurHooks(hooks.Notification, scriptPath);

  if (hooks.Stop.length === 0) {
    delete hooks.Stop;
  }
  if (hooks.Notification.length === 0) {
    delete hooks.Notification;
  }

  const result: ClaudeSettings = { ...settings, hooks };
  if (Object.keys(hooks).length === 0) {
    delete result.hooks;
  }
  return result;
}
