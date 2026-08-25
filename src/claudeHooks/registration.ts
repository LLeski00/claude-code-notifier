import { NotificationEvent } from '../domain';
import { ClaudeSettings, HookGroup } from './types';

type ClaudeHookName = 'Stop' | 'Notification';

const HOOK_NAME_BY_EVENT: Record<NotificationEvent, ClaudeHookName> = {
  [NotificationEvent.TaskFinished]: 'Stop',
  [NotificationEvent.NeedsInput]: 'Notification',
};

function buildDispatchCommand(dispatcherScriptPath: string, event: NotificationEvent): string {
  return `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "${dispatcherScriptPath}" -Event ${event}`;
}

function withoutOurHooks(groups: HookGroup[] | undefined, dispatcherScriptPath: string): HookGroup[] {
  if (!groups) {
    return [];
  }
  const cleaned: HookGroup[] = [];
  for (const group of groups) {
    const remainingHooks = group.hooks.filter((hook) => !hook.command.includes(dispatcherScriptPath));
    if (remainingHooks.length > 0) {
      cleaned.push({ ...group, hooks: remainingHooks });
    }
  }
  return cleaned;
}

export function withNotifierEnabled(
  settings: ClaudeSettings,
  dispatcherScriptPath: string,
  notifyOnIdle: boolean
): ClaudeSettings {
  const hooks = { ...(settings.hooks ?? {}) };

  for (const event of Object.values(NotificationEvent)) {
    const hookName = HOOK_NAME_BY_EVENT[event];
    const command = buildDispatchCommand(dispatcherScriptPath, event);
    const matcher = event === NotificationEvent.NeedsInput && !notifyOnIdle ? 'permission_prompt' : '';

    const groups = withoutOurHooks(hooks[hookName], dispatcherScriptPath);
    groups.push({ matcher, hooks: [{ type: 'command', command }] });
    hooks[hookName] = groups;
  }

  return { ...settings, hooks };
}

export function withNotifierDisabled(settings: ClaudeSettings, dispatcherScriptPath: string): ClaudeSettings {
  if (!settings.hooks) {
    return settings;
  }

  const hooks = { ...settings.hooks };

  for (const event of Object.values(NotificationEvent)) {
    const hookName = HOOK_NAME_BY_EVENT[event];
    const cleaned = withoutOurHooks(hooks[hookName], dispatcherScriptPath);
    if (cleaned.length === 0) {
      delete hooks[hookName];
    } else {
      hooks[hookName] = cleaned;
    }
  }

  const result: ClaudeSettings = { ...settings, hooks };
  if (Object.keys(hooks).length === 0) {
    delete result.hooks;
  }
  return result;
}
