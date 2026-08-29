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
    StopFailure?: HookGroup[];
    SubagentStop?: HookGroup[];
    [key: string]: HookGroup[] | undefined;
  };
  [key: string]: unknown;
}
