import * as vscode from 'vscode';
import { CHANNELS } from '../channels';
import { NotifierConfig } from './types';

export function buildConfig(): NotifierConfig {
  const workspaceConfig = vscode.workspace.getConfiguration('claudeNotifier');

  const channels: NotifierConfig['channels'] = {};
  for (const channel of CHANNELS) {
    channels[channel.id] = channel.buildSettings(workspaceConfig);
  }

  return {
    notifyOnIdle: workspaceConfig.get<boolean>('notifyOnIdle', true),
    channels,
  };
}
